<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$student_id = AuthMiddleware::$currentUserId;

if (!$student_id) {
    jsonResponse(false, "Authentication required", 401);
}

try {
    $stmt = $conn->prepare("SELECT points_balance FROM students WHERE id = ? LIMIT 1");
    $stmt->execute([$student_id]);
    $student = $stmt->fetch();

    if ($student) {
        jsonResponse(true, "Success", 200, ["points_balance" => $student['points_balance']]);
    } else {
        jsonResponse(false, "Student not found", 404);
    }
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
