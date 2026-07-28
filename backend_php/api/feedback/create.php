<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$student_id = AuthMiddleware::$currentUserId;
$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$feedback_type = isset($data['feedback_type']) ? trim($data['feedback_type']) : '';
$comment = isset($data['comment']) ? trim($data['comment']) : '';

$validTypes = ['suggestion', 'bug', 'ux', 'feature'];

if (!in_array($feedback_type, $validTypes)) {
    jsonResponse(false, "Invalid feedback type. Must be one of: suggestion, bug, ux, feature", 400);
}

if (empty($comment)) {
    jsonResponse(false, "Feedback comment is required", 400);
}

try {
    // Insert new application feedback
    $stmt = $conn->prepare("
        INSERT INTO application_feedback (student_id, feedback_type, comment, status) 
        VALUES (?, ?, ?, 'pending')
    ");
    $stmt->execute([$student_id, $feedback_type, $comment]);

    jsonResponse(true, "Feedback submitted successfully", 201, [
        "feedback_id" => $conn->lastInsertId()
    ]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
