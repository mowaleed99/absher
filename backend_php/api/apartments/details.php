<?php
require_once __DIR__ . '/../../config/db.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    jsonResponse(false, "Apartment ID is required", 400);
}

try {
    $aptQuery = "SELECT * FROM apartments WHERE id = ? AND (is_available = 1 OR is_available IS NULL) LIMIT 1";
    $stmt = $conn->prepare($aptQuery);
    $stmt->execute([$id]);
    $apt = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$apt) {
        jsonResponse(false, "Apartment not found", 404);
    }

    $apt['images'] = json_decode($apt['images'] ?? '[]', true) ?? [$apt['images']];
    $apt['universities'] = json_decode($apt['universities'] ?? '[]', true) ?? [];
    $apt['features'] = json_decode($apt['features'] ?? '[]', true) ?? [];

    jsonResponse(true, "Success", 200, ['apartment' => $apt]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
