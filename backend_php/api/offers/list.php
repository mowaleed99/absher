<?php
// Public endpoint: list active housing offers for students.
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $now = date('Y-m-d H:i:s');

    // Query active offers whose start/expiration dates are valid and whose linked apartment is available.
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
            WHERE ho.is_active = 1
              AND (ho.starts_at IS NULL OR ho.starts_at <= :now1)
              AND (ho.expires_at IS NULL OR ho.expires_at > :now2)
              AND apt.is_available = 1
            ORDER BY ho.display_order ASC, ho.created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':now1' => $now,
        ':now2' => $now
    ]);
    $offers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];
    foreach ($offers as $row) {
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

        $result[] = [
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
    }

    jsonResponse(true, "Success", 200, ['offers' => $result]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
