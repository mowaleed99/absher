<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $stmt = $conn->prepare("SELECT id, title, description, image_url, price_points, is_active, created_at, updated_at 
                            FROM services 
                            WHERE is_active = 1");
    $stmt->execute();
    $services = $stmt->fetchAll();

    jsonResponse(true, "Success", 200, $services);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
