<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$student_id = AuthMiddleware::$currentUserId;
$rating = isset($data['rating']) ? (int)$data['rating'] : null;
$comment = trim($data['comment'] ?? '');

if ($rating === null || $rating < 1 || $rating > 5 || empty($comment)) {
    jsonResponse(false, "Valid rating (1-5) and comment are required", 400);
}

try {
    $stmt = $conn->prepare("INSERT INTO reviews (student_id, rating, comment, is_approved) VALUES (?, ?, ?, 0)");
    $stmt->execute([$student_id, $rating, $comment]);

    jsonResponse(true, "Review submitted and is pending approval", 201, ["review_id" => $conn->lastInsertId()]);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
