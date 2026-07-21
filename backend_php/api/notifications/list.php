<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$student_id = AuthMiddleware::$currentUserId;

try {
    $stmt = $conn->prepare("SELECT id, title, body, is_read, created_at 
                            FROM notifications 
                            WHERE student_id = ? 
                            ORDER BY created_at DESC");
    $stmt->execute([$student_id]);
    $notifications = $stmt->fetchAll();

    jsonResponse(true, "Success", 200, $notifications);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
