<?php
require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$student_id = AuthMiddleware::$currentUserId;
$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$id = isset($data['id']) ? (int)$data['id'] : null;
$rating = isset($data['rating']) ? (int)$data['rating'] : null;
$comment = isset($data['comment']) ? trim($data['comment']) : null;

if ($id === null || $id <= 0) {
    jsonResponse(false, "Valid review ID is required", 400);
}

if ($rating !== null && ($rating < 1 || $rating > 5)) {
    jsonResponse(false, "Valid rating (1-5) is required", 400);
}

try {
    // 1. Fetch review and verify ownership
    $stmt = $conn->prepare("
        SELECT id, student_id, rating, comment 
        FROM service_reviews 
        WHERE id = ?
    ");
    $stmt->execute([$id]);
    $review = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$review) {
        jsonResponse(false, "Review not found", 404);
    }

    if ((int)$review['student_id'] !== $student_id) {
        jsonResponse(false, "Unauthorized: This review does not belong to you", 403);
    }

    // 2. Perform update
    $newRating = $rating !== null ? $rating : (int)$review['rating'];
    $newComment = $comment !== null ? (!empty($comment) ? $comment : null) : $review['comment'];

    // Reset status to 'pending' upon editing
    $stmt = $conn->prepare("
        UPDATE service_reviews 
        SET rating = ?, comment = ?, status = 'pending' 
        WHERE id = ?
    ");
    $stmt->execute([$newRating, $newComment, $id]);

    jsonResponse(true, "Review updated successfully and is pending moderation", 200);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
