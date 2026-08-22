<?php
// Public endpoint: list available apartments for students.
// Returns only apartments where is_available = 1.
// Supports server-side filtering: district_id, rental_type, rooms_count, location, capacity, move_in_type.
// Price and university filtering remain PHP-side (no numeric column for price, universities stored as JSON).
require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $lang = $_GET['lang'] ?? 'ar';
    if (!in_array($lang, ['ar', 'en'], true)) {
        $lang = 'ar';
    }

    $where = ["is_available = 1"];
    $params = [];

    if (!empty($_GET['location'])) {
        $where[] = "(location_ar LIKE :location OR location_en LIKE :location OR location LIKE :location)";
        $params[':location'] = '%' . trim($_GET['location']) . '%';
    }
    if (!empty($_GET['capacity'])) {
        $where[] = "(capacity_ar LIKE :capacity OR capacity_en LIKE :capacity OR capacity LIKE :capacity)";
        $params[':capacity'] = '%' . trim($_GET['capacity']) . '%';
    }
    if (!empty($_GET['move_in_type'])) {
        $where[] = "(move_in_type_ar LIKE :move_in_type OR move_in_type_en LIKE :move_in_type OR move_in_type LIKE :move_in_type)";
        $params[':move_in_type'] = '%' . trim($_GET['move_in_type']) . '%';
    }

    // Canonical server-side filters
    if (!empty($_GET['district_id'])) {
        $where[] = "district_id = :district_id";
        $params[':district_id'] = (int)$_GET['district_id'];
    }

    if (!empty($_GET['rental_type'])) {
        $allowed = ['apartment', 'room_shared', 'studio'];
        $rt = trim($_GET['rental_type']);
        if (in_array($rt, $allowed, true)) {
            $where[] = "rental_type = :rental_type";
            $params[':rental_type'] = $rt;
        }
    }

    if (isset($_GET['rooms_count']) && $_GET['rooms_count'] !== '') {
        $rc = intval($_GET['rooms_count']);
        if ($rc > 0) {
            $where[] = "rooms_count = :rooms_count";
            $params[':rooms_count'] = $rc;
        }
    }

    $titleCol = ($lang === 'en') ? "COALESCE(NULLIF(title_en, ''), NULLIF(title_ar, ''), title)" : "COALESCE(NULLIF(title_ar, ''), title)";
    $descCol  = ($lang === 'en') ? "COALESCE(NULLIF(description_en, ''), NULLIF(description_ar, ''), description)" : "COALESCE(NULLIF(description_ar, ''), description)";
    $locCol   = ($lang === 'en') ? "COALESCE(NULLIF(location_en, ''), NULLIF(location_ar, ''), location)" : "COALESCE(NULLIF(location_ar, ''), location)";
    $proxCol  = ($lang === 'en') ? "COALESCE(NULLIF(proximity_en, ''), NULLIF(proximity_ar, ''), proximity)" : "COALESCE(NULLIF(proximity_ar, ''), proximity)";
    $capCol   = ($lang === 'en') ? "COALESCE(NULLIF(capacity_en, ''), NULLIF(capacity_ar, ''), capacity)" : "COALESCE(NULLIF(capacity_ar, ''), capacity)";
    $mitCol   = ($lang === 'en') ? "COALESCE(NULLIF(move_in_type_en, ''), NULLIF(move_in_type_ar, ''), move_in_type)" : "COALESCE(NULLIF(move_in_type_ar, ''), move_in_type)";
    $midCol   = ($lang === 'en') ? "COALESCE(NULLIF(move_in_date_en, ''), NULLIF(move_in_date_ar, ''), move_in_date)" : "COALESCE(NULLIF(move_in_date_ar, ''), move_in_date)";
    $featsCol = ($lang === 'en') ? "COALESCE(NULLIF(features_en, ''), NULLIF(features_ar, ''), features)" : "COALESCE(NULLIF(features_ar, ''), features)";

    $sql = "SELECT id, $titleCol AS title, $descCol AS description, price, $locCol AS location, $proxCol AS proximity,
                   universities, $capCol AS capacity, $mitCol AS move_in_type, $midCol AS move_in_date,
                   images, $featsCol AS features, is_available, is_featured, featured_until, is_special_offer, district_id,
                   rental_type, rooms_count, roommate_reqs, roommate_facilities, owner_phone
            FROM apartments
            WHERE " . implode(" AND ", $where) . "
            ORDER BY (is_featured = 1 AND (featured_until IS NULL OR featured_until > NOW())) DESC, created_at DESC, id DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $apartments = $stmt->fetchAll();

    // PHP-side filters (no DB column equivalent)
    $minPrice = isset($_GET['min_price']) && $_GET['min_price'] !== '' ? floatval($_GET['min_price']) : null;
    $maxPrice = isset($_GET['max_price']) && $_GET['max_price'] !== '' ? floatval($_GET['max_price']) : null;
    $filterUni = !empty($_GET['university']) ? trim($_GET['university']) : null;

    $result = [];
    foreach ($apartments as $apt) {
        $images       = json_decode($apt['images'] ?? '[]', true) ?: [];
        $features     = json_decode($apt['features'] ?? '[]', true) ?: [];
        $universities = json_decode($apt['universities'] ?? '[]', true) ?: [];

        // Price check (extract numeric from string like "450 دولار")
        if ($minPrice !== null || $maxPrice !== null) {
            $numPrice = floatval(preg_replace('/[^0-9.]/', '', $apt['price'] ?? '0'));
            if ($minPrice !== null && $numPrice < $minPrice) continue;
            if ($maxPrice !== null && $numPrice > $maxPrice) continue;
        }

        // University check
        if ($filterUni !== null) {
            $uniMatched = false;
            foreach ($universities as $u) {
                if (stripos(trim((string)$u), $filterUni) !== false) {
                    $uniMatched = true;
                    break;
                }
            }
            if (!$uniMatched && stripos($apt['universities'] ?? '', $filterUni) === false) {
                continue;
            }
        }

        $isFeaturedActive = ($apt['is_featured'] == 1 && (empty($apt['featured_until']) || strtotime($apt['featured_until']) > time()));
        $isSpecialOffer = ($apt['is_special_offer'] == 1 || $apt['is_special_offer'] == true);

        $result[] = [
            'id'              => (int)$apt['id'],
            'title'           => $apt['title'],
            'description'     => $apt['description'],
            'price'           => $apt['price'],
            'location'        => $apt['location'],
            'district_id'     => $apt['district_id'] !== null ? (int)$apt['district_id'] : null,
            'proximity'       => $apt['proximity'],
            'capacity'        => $apt['capacity'],
            'rental_type'     => $apt['rental_type'],
            'rooms_count'     => $apt['rooms_count'] !== null ? (int)$apt['rooms_count'] : null,
            'move_in_type'    => $apt['move_in_type'],
            'move_in_date'    => $apt['move_in_date'],
            'is_available'    => (bool)$apt['is_available'],
            'is_featured'     => $isFeaturedActive,
            'featured_until'  => $apt['featured_until'],
            'is_special_offer'=> $isSpecialOffer,
            'images'          => $images,
            'features'        => $features,
            'universities'    => $universities,
        ];
    }

    jsonResponse(true, "Success", 200, ['apartments' => $result]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
