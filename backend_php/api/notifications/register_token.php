<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Method not allowed", 405);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$deviceToken = trim($input['device_token'] ?? '');
$platform = strtolower(trim($input['platform'] ?? 'android'));
$deviceModel = trim($input['device_model'] ?? '');

if (empty($deviceToken)) {
    jsonResponse(false, "Device token is required", 400);
    exit();
}

if (!in_array($platform, ['android', 'ios', 'web'], true)) {
    $platform = 'android';
}

$studentId = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!empty($authHeader) && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    try {
        if (AuthMiddleware::requireAnyAuth()) {
            $studentId = AuthMiddleware::$currentUserId;
        }
    } catch (Throwable $e) {}
}

if (!$studentId && !empty($input['student_id'])) {
    $studentId = intval($input['student_id']);
}

if (!$studentId) {
    jsonResponse(false, "Authentication required to register device token", 401);
    exit();
}

try {
    // Upsert device token: update student_id, platform, model and reactivate if existed
    $stmt = $conn->prepare("
        INSERT INTO student_device_tokens (student_id, device_token, platform, device_model, is_active, updated_at)
        VALUES (?, ?, ?, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE
            student_id = VALUES(student_id),
            platform = VALUES(platform),
            device_model = VALUES(device_model),
            is_active = 1,
            updated_at = NOW()
    ");
    $stmt->execute([$studentId, $deviceToken, $platform, $deviceModel]);

    jsonResponse(true, "Device token registered successfully", 200, [
        'student_id'   => $studentId,
        'platform'     => $platform,
        'registered'   => true
    ]);
} catch (PDOException $e) {
    error_log("Failed to register device token: " . $e->getMessage());
    jsonResponse(false, "Database error: " . $e->getMessage(), 500);
}
