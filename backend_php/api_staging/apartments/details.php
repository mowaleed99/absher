<?php
require_once __DIR__ . '/../../config/db_staging.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    jsonResponse(false, "Apartment ID is required", 400);
}

try {
    $lang = $_GET['lang'] ?? 'ar';
    if (!in_array($lang, ['ar', 'en'], true)) {
        $lang = 'ar';
    }

    $titleCol = ($lang === 'en') ? "COALESCE(NULLIF(title_en, ''), NULLIF(title_ar, ''), title)" : "COALESCE(NULLIF(title_ar, ''), title)";
    $descCol  = ($lang === 'en') ? "COALESCE(NULLIF(description_en, ''), NULLIF(description_ar, ''), description)" : "COALESCE(NULLIF(description_ar, ''), description)";
    $locCol   = ($lang === 'en') ? "COALESCE(NULLIF(location_en, ''), NULLIF(location_ar, ''), location)" : "COALESCE(NULLIF(location_ar, ''), location)";
    $proxCol  = ($lang === 'en') ? "COALESCE(NULLIF(proximity_en, ''), NULLIF(proximity_ar, ''), proximity)" : "COALESCE(NULLIF(proximity_ar, ''), proximity)";
    $capCol   = ($lang === 'en') ? "COALESCE(NULLIF(capacity_en, ''), NULLIF(capacity_ar, ''), capacity)" : "COALESCE(NULLIF(capacity_ar, ''), capacity)";
    $mitCol   = ($lang === 'en') ? "COALESCE(NULLIF(move_in_type_en, ''), NULLIF(move_in_type_ar, ''), move_in_type)" : "COALESCE(NULLIF(move_in_type_ar, ''), move_in_type)";
    $midCol   = ($lang === 'en') ? "COALESCE(NULLIF(move_in_date_en, ''), NULLIF(move_in_date_ar, ''), move_in_date)" : "COALESCE(NULLIF(move_in_date_ar, ''), move_in_date)";
    $featsCol = ($lang === 'en') ? "COALESCE(NULLIF(features_en, ''), NULLIF(features_ar, ''), features)" : "COALESCE(NULLIF(features_ar, ''), features)";

    $aptQuery = "SELECT id, price, images, district_id, rental_type, rooms_count, is_available, is_featured, featured_until, is_special_offer, universities,
                        roommate_reqs, roommate_facilities, owner_phone,
                        $titleCol AS title, $descCol AS description, $locCol AS location, $proxCol AS proximity,
                        $capCol AS capacity, $mitCol AS move_in_type, $midCol AS move_in_date, $featsCol AS features
                 FROM apartments 
                 WHERE id = ? AND (is_available = 1 OR is_available IS NULL) 
                 LIMIT 1";
    $stmt = $conn->prepare($aptQuery);
    $stmt->execute([$id]);
    $apt = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$apt) {
        jsonResponse(false, "Apartment not found", 404);
    }

    $apt['is_featured'] = ($apt['is_featured'] == 1 && (empty($apt['featured_until']) || strtotime($apt['featured_until']) > time()));
    $apt['is_special_offer'] = ($apt['is_special_offer'] == 1 || $apt['is_special_offer'] == true);
    $apt['images'] = json_decode($apt['images'] ?? '[]', true) ?? [$apt['images']];
    $apt['universities'] = json_decode($apt['universities'] ?? '[]', true) ?? [];
    $apt['features'] = json_decode($apt['features'] ?? '[]', true) ?? [];

    jsonResponse(true, "Success", 200, ['apartment' => $apt]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
