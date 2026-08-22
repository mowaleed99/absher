<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Method not allowed", 405);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$deviceToken = trim($input['device_token'] ?? '');

if (empty($deviceToken)) {
    jsonResponse(false, "Device token is required", 400);
    exit();
}

try {
    $stmt = $conn->prepare("UPDATE student_device_tokens SET is_active = 0, updated_at = NOW() WHERE device_token = ?");
    $stmt->execute([$deviceToken]);

    jsonResponse(true, "Device token unregistered successfully", 200);
} catch (PDOException $e) {
    error_log("Failed to unregister device token: " . $e->getMessage());
    jsonResponse(false, "Database error", 500);
}
