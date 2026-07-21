<?php
require_once __DIR__ . '/../../config/db.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    jsonResponse(false, "Apartment ID is required", 400);
}

try {
    $aptQuery = "SELECT a.id, a.title, a.description, a.price, a.currency, a.capacity, a.is_available, d.name AS district
                 FROM apartments a
                 LEFT JOIN districts d ON a.district_id = d.id
                 WHERE a.id = ? AND a.deleted_at IS NULL LIMIT 1";
    $stmt = $conn->prepare($aptQuery);
    $stmt->execute([$id]);
    $apt = $stmt->fetch();

    if (!$apt) {
        jsonResponse(false, "Apartment not found", 404);
    }

    $aptId = $apt['id'];

    $imgStmt = $conn->prepare("SELECT image_url FROM apartment_images WHERE apartment_id = ? ORDER BY is_primary DESC, id ASC");
    $imgStmt->execute([$aptId]);
    $apt['images'] = $imgStmt->fetchAll(PDO::FETCH_COLUMN);

    $uniStmt = $conn->prepare("SELECT u.name FROM apartment_universities au JOIN universities u ON au.university_id = u.id WHERE au.apartment_id = ?");
    $uniStmt->execute([$aptId]);
    $apt['universities'] = $uniStmt->fetchAll(PDO::FETCH_COLUMN);

    $featStmt = $conn->prepare("SELECT f.name FROM apartment_features af JOIN features f ON af.feature_id = f.id WHERE af.apartment_id = ?");
    $featStmt->execute([$aptId]);
    $apt['features'] = $featStmt->fetchAll(PDO::FETCH_COLUMN);

    jsonResponse(true, "Success", 200, $apt);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
