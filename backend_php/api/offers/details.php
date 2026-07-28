<?php
// Public endpoint: get a single housing offer details.
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

$id = $_GET['id'] ?? null;

// Return 400 for missing ID
if ($id === null || $id === '') {
    jsonResponse(false, "Housing Offer ID is required", 400);
}

// Return 400 for invalid/non-numeric ID values
if (!is_numeric($id) || intval($id) <= 0) {
    jsonResponse(false, "Invalid Housing Offer ID value", 400);
}

$id = intval($id);

try {
    $sql = "SELECT ho.*, 
                   apt.id AS apt_id, apt.title AS apt_title, apt.price AS apt_price, 
                   apt.location AS apt_location, apt.proximity AS apt_proximity, 
                   apt.universities AS apt_universities, apt.capacity AS apt_capacity, 
                   apt.move_in_type AS apt_move_in_type, apt.move_in_date AS apt_move_in_date, 
                   apt.images AS apt_images, apt.features AS apt_features, 
                   apt.description AS apt_description, apt.is_available AS apt_is_available, 
                   apt.rental_type AS apt_rental_type, apt.rooms_count AS apt_rooms_count, 
                   apt.district_id AS apt_district_id
            FROM housing_offers ho
            INNER JOIN apartments apt ON ho.apartment_id = apt.id
            WHERE ho.id = ? LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        jsonResponse(false, "Housing offer not found", 404);
    }

    $now = time();

    // 1. Check if disabled
    if (intval($row['is_active']) !== 1) {
        jsonResponse(false, "هذا العرض غير نشط حالياً", 403);
    }

    // 2. Check if scheduled in the future
    if (!empty($row['starts_at']) && strtotime($row['starts_at']) > $now) {
        jsonResponse(false, "هذا العرض مجدول للمستقبل وغير متاح حالياً", 403);
    }

    // 3. Check if expired
    if (!empty($row['expires_at']) && strtotime($row['expires_at']) <= $now) {
        jsonResponse(false, "انتهت صلاحية هذا العرض", 410);
    }

    // 4. Check if linked apartment is unavailable
    if (intval($row['apt_is_available']) !== 1) {
        jsonResponse(false, "الشقة المرتبطة بهذا العرض غير متاحة حالياً", 403);
    }

    // Parse JSON arrays for the nested apartment
    $images       = json_decode($row['apt_images'] ?? '[]', true) ?: [];
    $features     = json_decode($row['apt_features'] ?? '[]', true) ?: [];
    $universities = json_decode($row['apt_universities'] ?? '[]', true) ?: [];

    // Calculate discount percentage on the fly
    $orig = floatval($row['original_price']);
    $off = floatval($row['offer_price']);
    $discountPercent = 0;
    if ($orig > 0) {
        $discountPercent = round((($orig - $off) / $orig) * 100);
    }

    // Image fallback logic: if image_url is empty, use the first apartment image
    $finalImageUrl = $row['image_url'];
    if (empty($finalImageUrl)) {
        $finalImageUrl = !empty($images) ? $images[0] : null;
    }

    $offer = [
        'id'             => (int)$row['id'],
        'apartment_id'   => (int)$row['apartment_id'],
        'title'          => $row['title'],
        'description'    => $row['description'],
        'original_price' => floatval($row['original_price']),
        'offer_price'    => floatval($row['offer_price']),
        'discount_percent' => $discountPercent,
        'badge_text'     => $row['badge_text'],
        'image_url'      => $finalImageUrl,
        'starts_at'      => $row['starts_at'],
        'expires_at'     => $row['expires_at'],
        'is_active'      => (int)$row['is_active'],
        'display_order'  => (int)$row['display_order'],
        'created_at'     => $row['created_at'],
        'updated_at'     => $row['updated_at'],
        'apartment'      => [
            'id'            => (int)$row['apt_id'],
            'title'         => $row['apt_title'],
            'price'         => $row['apt_price'],
            'location'      => $row['apt_location'],
            'proximity'     => $row['apt_proximity'],
            'universities'  => $universities,
            'capacity'      => $row['apt_capacity'],
            'move_in_type'  => $row['apt_move_in_type'],
            'move_in_date'  => $row['apt_move_in_date'],
            'images'        => $images,
            'features'      => $features,
            'description'   => $row['apt_description'],
            'is_available'  => (bool)$row['apt_is_available'],
            'rental_type'   => $row['apt_rental_type'],
            'rooms_count'   => $row['apt_rooms_count'] !== null ? (int)$row['apt_rooms_count'] : null,
            'district_id'   => $row['apt_district_id'] !== null ? (int)$row['apt_district_id'] : null,
        ]
    ];

    jsonResponse(true, "Success", 200, ['offer' => $offer]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
