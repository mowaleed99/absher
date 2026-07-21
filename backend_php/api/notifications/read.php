<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$notification_id = $data['notification_id'] ?? null;
$student_id = AuthMiddleware::$currentUserId;

if (!$notification_id) {
    jsonResponse(false, "notification_id is required", 400);
}

try {
    $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND student_id = ?");
    $stmt->execute([$notification_id, $student_id]);

    if ($stmt->rowCount() > 0) {
        jsonResponse(true, "Notification marked as read", 200);
    } else {
        jsonResponse(false, "Notification not found or unauthorized", 404);
    }
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
