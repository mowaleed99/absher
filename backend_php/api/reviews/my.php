<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$student_id = AuthMiddleware::$currentUserId;

try {
    // Select the student's reviews, joining with service_requests for context
    $stmt = $conn->prepare("
        SELECT r.id, r.rating, r.comment, r.status, r.created_at, 
               sr.service_title, sr.id AS service_request_id
        FROM service_reviews r
        LEFT JOIN service_requests sr ON r.service_request_id = sr.id
        WHERE r.student_id = ?
        ORDER BY r.created_at DESC
    ");
    $stmt->execute([$student_id]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, "Success", 200, $reviews);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
