<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$student_id = AuthMiddleware::$currentUserId;
$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$rating = isset($data['rating']) ? (int)$data['rating'] : null;
$comment = isset($data['comment']) ? trim($data['comment']) : '';
$service_request_id = isset($data['service_request_id']) ? (int)$data['service_request_id'] : null;

if ($rating === null || $rating < 1 || $rating > 5) {
    jsonResponse(false, "Valid rating (1-5) is required", 400);
}

if ($service_request_id === null || $service_request_id <= 0) {
    jsonResponse(false, "Valid service_request_id is required", 400);
}

try {
    // 1. Verify service request belongs to the authenticated student and is completed (مكتمل)
    $stmt = $conn->prepare("
        SELECT id, student_id, status 
        FROM service_requests 
        WHERE id = ?
    ");
    $stmt->execute([$service_request_id]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$request) {
        jsonResponse(false, "Service request not found", 444); // 444 or 404
    }

    if ((int)$request['student_id'] !== $student_id) {
        jsonResponse(false, "Unauthorized: This request does not belong to you", 403);
    }

    // Normalize raw DB status before comparison.
    // Admin dashboard writes 'completed' (English); legacy rows may contain 'مكتمل' (Arabic).
    $normalizedStatus = mb_strtolower(trim((string)$request['status']), 'UTF-8');
    $isCompleted = in_array($normalizedStatus, ['completed', 'مكتمل'], true);
    if (!$isCompleted) {
        jsonResponse(false, "Cannot rate a service that is not completed", 400);
    }

    // 2. Check if already reviewed
    $stmt = $conn->prepare("
        SELECT id 
        FROM service_reviews 
        WHERE student_id = ? AND service_request_id = ?
    ");
    $stmt->execute([$student_id, $service_request_id]);
    if ($stmt->fetch()) {
        jsonResponse(false, "You have already reviewed this service request", 409);
    }

    // 3. Insert new review (defaults to 'pending' moderation)
    $stmt = $conn->prepare("
        INSERT INTO service_reviews (student_id, service_request_id, rating, comment, status) 
        VALUES (?, ?, ?, ?, 'pending')
    ");
    $stmt->execute([
        $student_id,
        $service_request_id,
        $rating,
        !empty($comment) ? $comment : null
    ]);

    jsonResponse(true, "Review submitted successfully and is pending moderation", 201, [
        "review_id" => $conn->lastInsertId()
    ]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
