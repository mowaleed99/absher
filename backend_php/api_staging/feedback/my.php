<?php
require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$student_id = AuthMiddleware::$currentUserId;

try {
    // Select the student's feedback submissions
    $stmt = $conn->prepare("
        SELECT id, feedback_type, comment, status, created_at, reviewed_at
        FROM application_feedback
        WHERE student_id = ?
        ORDER BY created_at DESC
    ");
    $stmt->execute([$student_id]);
    $feedback = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, "Success", 200, $feedback);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
