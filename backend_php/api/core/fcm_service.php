<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/env.php';

class FcmService {
    private static ?string $cachedAccessToken = null;
    private static int $tokenExpiresAt = 0;

    /**
     * Get or refresh a Google OAuth2 Access Token for FCM HTTP v1 API.
     */
    public static function getAccessToken(): ?string {
        $now = time();
        if (self::$cachedAccessToken && self::$tokenExpiresAt > ($now + 60)) {
            return self::$cachedAccessToken;
        }

        $cacheFile = sys_get_temp_dir() . '/absher_fcm_token.json';
        if (file_exists($cacheFile)) {
            $cached = json_decode(@file_get_contents($cacheFile), true);
            if (!empty($cached['token']) && !empty($cached['expires_at']) && $cached['expires_at'] > ($now + 60)) {
                self::$cachedAccessToken = $cached['token'];
                self::$tokenExpiresAt = $cached['expires_at'];
                return self::$cachedAccessToken;
            }
        }

        $credPath = Env::get('FIREBASE_CREDENTIALS_PATH', __DIR__ . '/../../../credentials/firebase_service_account.json');
        if (!file_exists($credPath)) {
            // Fallback check in parent directories
            $altPath = '/var/www/absher/credentials/firebase_service_account.json';
            if (file_exists($altPath)) {
                $credPath = $altPath;
            } else {
                error_log("FcmService error: Service account credentials not found at: " . $credPath);
                return null;
            }
        }

        $credentials = json_decode(file_get_contents($credPath), true);
        if (!$credentials || empty($credentials['private_key']) || empty($credentials['client_email'])) {
            error_log("FcmService error: Invalid service account JSON.");
            return null;
        }

        // 1. Build JWT
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $claims = [
            'iss'   => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'iat'   => $now,
            'exp'   => $now + 3600
        ];

        $b64Header = self::base64UrlEncode(json_encode($header));
        $b64Claims = self::base64UrlEncode(json_encode($claims));
        $signaturePayload = $b64Header . '.' . $b64Claims;

        $signature = '';
        $privateKey = $credentials['private_key'];
        $success = openssl_sign($signaturePayload, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        if (!$success) {
            error_log("FcmService error: Failed to sign OAuth2 JWT with private key.");
            return null;
        }

        $jwt = $signaturePayload . '.' . self::base64UrlEncode($signature);

        // 2. Request Access Token from Google OAuth2
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_POSTFIELDS     => http_build_query([
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt
            ]),
            CURLOPT_TIMEOUT        => 10
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            error_log("FcmService error: Failed to fetch Google OAuth token (HTTP $httpCode): " . $response);
            return null;
        }

        $data = json_decode($response, true);
        if (empty($data['access_token'])) {
            error_log("FcmService error: access_token not found in OAuth response.");
            return null;
        }

        $token = $data['access_token'];
        $expiresIn = isset($data['expires_in']) ? (int)$data['expires_in'] : 3600;
        self::$cachedAccessToken = $token;
        self::$tokenExpiresAt = $now + $expiresIn;

        @file_put_contents($cacheFile, json_encode([
            'token'      => $token,
            'expires_at' => self::$tokenExpiresAt
        ]));

        return $token;
    }

    /**
     * Send Push Notification to a single device token via FCM HTTP v1.
     */
    public static function sendToToken(string $deviceToken, string $title, string $body, array $data = []): array {
        $accessToken = self::getAccessToken();
        if (!$accessToken) {
            return ['success' => false, 'error' => 'Could not acquire FCM access token'];
        }

        $projectId = Env::get('FIREBASE_PROJECT_ID', 'absher-app-7a743');
        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        // Convert all data payload values to string (FCM requirement)
        $stringData = [];
        foreach ($data as $key => $val) {
            if (is_array($val) || is_object($val)) {
                $stringData[(string)$key] = json_encode($val, JSON_UNESCAPED_UNICODE);
            } else {
                $stringData[(string)$key] = (string)$val;
            }
        }
        $stringData['click_action'] = 'FLUTTER_NOTIFICATION_CLICK';

        $payload = [
            'message' => [
                'token' => $deviceToken,
                'notification' => [
                    'title' => $title,
                    'body'  => $body
                ],
                'data' => (object)$stringData,
                'android' => [
                    'priority' => 'HIGH',
                    'notification' => [
                        'sound'      => 'default',
                        'channel_id' => 'absher_high_importance_channel'
                    ]
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'sound' => 'default',
                            'badge' => 1
                        ]
                    ]
                ]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json; UTF-8'
            ],
            CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT        => 10
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $resData = json_decode($response, true) ?: [];

        if ($httpCode === 200) {
            return ['success' => true, 'response' => $resData];
        }

        // Detect invalid/unregistered tokens to clean up
        $errorCode = $resData['error']['status'] ?? '';
        $errorMsg = $resData['error']['message'] ?? ($response ?: 'Unknown error');

        if ($errorCode === 'UNREGISTERED' || $errorCode === 'NOT_FOUND' || strpos($errorMsg, 'Requested entity was not found') !== false) {
            self::deactivateToken($deviceToken);
        }

        error_log("FcmService sendToToken failed (HTTP $httpCode): " . $errorMsg);
        return ['success' => false, 'http_code' => $httpCode, 'error' => $errorMsg];
    }

    /**
     * Send Push Notification to all active devices of a specific student.
     */
    public static function sendToStudent(int $studentId, string $title, string $body, array $data = []): array {
        global $conn;
        if (!$conn || $studentId <= 0) {
            return ['success' => false, 'sent_count' => 0];
        }

        try {
            $stmt = $conn->prepare("SELECT device_token FROM student_device_tokens WHERE student_id = ? AND is_active = 1");
            $stmt->execute([$studentId]);
            $tokens = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (empty($tokens)) {
                return ['success' => true, 'sent_count' => 0, 'message' => 'No active device tokens found for student'];
            }

            $successCount = 0;
            $failCount = 0;

            foreach ($tokens as $token) {
                $res = self::sendToToken($token, $title, $body, $data);
                if ($res['success']) {
                    $successCount++;
                } else {
                    $failCount++;
                }
            }

            return [
                'success'       => $successCount > 0,
                'sent_count'    => $successCount,
                'failed_count'  => $failCount,
                'total_devices' => count($tokens)
            ];
        } catch (Throwable $e) {
            error_log("FcmService sendToStudent error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Alias for sendToAllStudents.
     */
    public static function sendToAll(string $title, string $body, array $data = []): array {
        return self::sendToAllStudents($title, $body, $data);
    }

    /**
     * Send Push Notification to all students (e.g. general broadcast).
     */
    public static function sendToAllStudents(string $title, string $body, array $data = []): array {
        global $conn;
        if (!$conn) {
            return ['success' => false, 'sent_count' => 0];
        }

        try {
            $stmt = $conn->query("SELECT DISTINCT device_token FROM student_device_tokens WHERE is_active = 1");
            $tokens = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (empty($tokens)) {
                return ['success' => true, 'sent_count' => 0];
            }

            $successCount = 0;
            foreach ($tokens as $token) {
                $res = self::sendToToken($token, $title, $body, $data);
                if ($res['success']) {
                    $successCount++;
                }
            }

            return ['success' => true, 'sent_count' => $successCount, 'total_devices' => count($tokens)];
        } catch (Throwable $e) {
            error_log("FcmService sendToAllStudents error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Mark an invalid/expired token as inactive.
     */
    private static function deactivateToken(string $deviceToken): void {
        global $conn;
        if (!$conn) return;
        try {
            $stmt = $conn->prepare("UPDATE student_device_tokens SET is_active = 0 WHERE device_token = ?");
            $stmt->execute([$deviceToken]);
        } catch (Throwable $e) {
            error_log("FcmService deactivateToken error: " . $e->getMessage());
        }
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
