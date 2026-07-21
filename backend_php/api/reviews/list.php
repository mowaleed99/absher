<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $stmt = $conn->prepare("
        SELECT r.id, r.rating, r.comment, r.created_at, s.full_name as student_name 
        FROM reviews r
        JOIN students s ON r.student_id = s.id
        WHERE r.is_approved = 1
        ORDER BY r.created_at DESC
    ");
    $stmt->execute();
    $reviews = $stmt->fetchAll();

    jsonResponse(true, "Success", 200, $reviews);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
