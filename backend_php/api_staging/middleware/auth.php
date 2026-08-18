<?php
require_once __DIR__ . '/../core/jwt.php';
require_once __DIR__ . '/../core/response.php';

class AuthMiddleware {
    public static $currentUserId = null;
    public static $isAdmin = false;
    public static $adminRole = null;
    public static $payload = null;

    private static function getPayload() {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        
        if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return false;
        }

        $token = $matches[1];
        $payload = JWT::decode($token);
        
        if (!$payload) {
            return false;
        }

        self::$payload = $payload;
        return $payload;
    }

    public static function requireAuth() {
        $payload = self::getPayload();

        if (!$payload || !isset($payload['student_id'])) {
            jsonResponse(false, "Authentication required", 401);
            exit();
        }

        // Enforce blocking check across all authenticated APIs
        global $conn;
        if ($conn) {
            try {
                $chk = $conn->prepare("SELECT is_blocked FROM students WHERE id = ? LIMIT 1");
                $chk->execute([$payload['student_id']]);
                $stu = $chk->fetch(PDO::FETCH_ASSOC);
                if ($stu && intval($stu['is_blocked'] ?? 0) === 1) {
                    jsonResponse(false, "تم حظر هذا الحساب من قبل الإدارة. يرجى التواصل مع الدعم الفني.", 403);
                    exit();
                }
            } catch (Exception $e) {
                // Fail safe continue
            }
        }

        self::$currentUserId = $payload['student_id'];
        return true;
    }

    public static function requireAdmin() {
        $payload = self::getPayload();

        if (!$payload) {
            jsonResponse(false, "Authentication required", 401);
            exit();
        }

        if (isset($payload['student_id'])) {
            jsonResponse(false, "Unauthorized access", 401);
            exit();
        }

        if (!isset($payload['type']) || $payload['type'] !== 'admin' || !isset($payload['admin_id']) || !isset($payload['role'])) {
            jsonResponse(false, "Invalid admin token", 401);
            exit();
        }

        $allowedRoles = ['super_admin', 'admin', 'editor'];
        if (!in_array($payload['role'], $allowedRoles)) {
            jsonResponse(false, "Insufficient permissions", 401);
            exit();
        }

        self::$currentUserId = $payload['admin_id'];
        self::$isAdmin = true;
        self::$adminRole = $payload['role'];

        return true;
    }

    public static function requireAnyAuth() {
        $payload = self::getPayload();

        if (!$payload) {
            jsonResponse(false, "Authentication required", 401);
            exit();
        }

        if (isset($payload['admin_id'])) {
            self::$currentUserId = $payload['admin_id'];
            self::$isAdmin = true;
            self::$adminRole = $payload['role'] ?? 'admin';
        } elseif (isset($payload['student_id'])) {
            self::$currentUserId = $payload['student_id'];
            self::$isAdmin = false;
        } else {
            jsonResponse(false, "Invalid token structure", 401);
            exit();
        }

        return true;
    }
}
