<?php
require_once __DIR__ . '/../../config/db.php';

try {
    // 1. Fetch apartments with district
    $aptQuery = "SELECT a.id, a.title, a.description, a.price, a.currency, a.capacity, a.is_available, d.name AS district
                 FROM apartments a
                 LEFT JOIN districts d ON a.district_id = d.id
                 WHERE a.deleted_at IS NULL
                 ORDER BY a.created_at DESC";
    $stmt = $conn->query($aptQuery);
    $apartments = $stmt->fetchAll();

    if (empty($apartments)) {
        jsonResponse(true, "Success", 200, []);
    }

    $aptIds = array_column($apartments, 'id');
    $inQuery = implode(',', array_fill(0, count($aptIds), '?'));

    // 2. Fetch images
    $imgStmt = $conn->prepare("SELECT apartment_id, image_url FROM apartment_images WHERE apartment_id IN ($inQuery) ORDER BY is_primary DESC, id ASC");
    $imgStmt->execute($aptIds);
    $images = $imgStmt->fetchAll();

    // 3. Fetch universities
    $uniStmt = $conn->prepare("SELECT au.apartment_id, u.name 
                               FROM apartment_universities au 
                               JOIN universities u ON au.university_id = u.id 
                               WHERE au.apartment_id IN ($inQuery)");
    $uniStmt->execute($aptIds);
    $universities = $uniStmt->fetchAll();

    // 4. Fetch features
    $featStmt = $conn->prepare("SELECT af.apartment_id, f.name 
                                FROM apartment_features af 
                                JOIN features f ON af.feature_id = f.id 
                                WHERE af.apartment_id IN ($inQuery)");
    $featStmt->execute($aptIds);
    $features = $featStmt->fetchAll();

    // 5. Aggregate Data in PHP to avoid massive N*M joins
    $result = [];
    foreach ($apartments as $apt) {
        $aptId = $apt['id'];
        
        $apt['images'] = [];
        foreach ($images as $img) {
            if ($img['apartment_id'] == $aptId) {
                $apt['images'][] = $img['image_url'];
            }
        }
        
        $apt['universities'] = [];
        foreach ($universities as $uni) {
            if ($uni['apartment_id'] == $aptId) {
                $apt['universities'][] = $uni['name'];
            }
        }
        
        $apt['features'] = [];
        foreach ($features as $feat) {
            if ($feat['apartment_id'] == $aptId) {
                $apt['features'][] = $feat['name'];
            }
        }
        
        $result[] = $apt;
    }

    jsonResponse(true, "Success", 200, $result);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
