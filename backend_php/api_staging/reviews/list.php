<?php
require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../core/response.php';

try {
    // Select approved, active reviews, joining with students to get current name and uni if available
    $stmt = $conn->prepare("
        SELECT r.id, r.rating, r.comment, r.created_at, 
               COALESCE(s.full_name, r.student_name, 'طالب كريم') AS student_name,
               COALESCE(s.university, r.uni, 'جامعة في جورجيا') AS uni
        FROM service_reviews r
        LEFT JOIN students s ON r.student_id = s.id
        WHERE r.status = 'approved'
        ORDER BY r.created_at DESC
    ");
    $stmt->execute();
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, "Success", 200, $reviews);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
