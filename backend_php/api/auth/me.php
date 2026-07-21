<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

AuthMiddleware::requireAuth();

$studentId = AuthMiddleware::$currentUserId;

try {
    $stmt = $conn->prepare("SELECT id, full_name, email, phone, university_id, points_balance, created_at, updated_at FROM students WHERE id = ? AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($student) {
        jsonResponse(true, "Profile fetched successfully", 200, ['student' => $student]);
    } else {
        jsonResponse(false, "Student not found or deactivated", 404);
    }
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
