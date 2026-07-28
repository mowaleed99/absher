<?php
// Public endpoint: list available apartments for students.
// Returns only apartments where is_available = 1.
// Supports server-side filtering: district_id, rental_type, rooms_count, location, capacity, move_in_type.
// Price and university filtering remain PHP-side (no numeric column for price, universities stored as JSON).
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $where = ["is_available = 1"];
    $params = [];

    if (!empty($_GET['location'])) {
        $where[] = "location LIKE :location";
        $params[':location'] = '%' . trim($_GET['location']) . '%';
    }
    if (!empty($_GET['capacity'])) {
        $where[] = "capacity LIKE :capacity";
        $params[':capacity'] = '%' . trim($_GET['capacity']) . '%';
    }
    if (!empty($_GET['move_in_type'])) {
        $where[] = "move_in_type LIKE :move_in_type";
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

    $sql = "SELECT id, title, description, price, location, proximity,
                   universities, capacity, move_in_type, move_in_date,
                   images, features, is_available, district_id,
                   rental_type, rooms_count
            FROM apartments
            WHERE " . implode(" AND ", $where) . "
            ORDER BY created_at DESC";

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

        $result[] = [
            'id'            => (int)$apt['id'],
            'title'         => $apt['title'],
            'description'   => $apt['description'],
            'price'         => $apt['price'],
            'location'      => $apt['location'],
            'district_id'   => $apt['district_id'] !== null ? (int)$apt['district_id'] : null,
            'proximity'     => $apt['proximity'],
            'capacity'      => $apt['capacity'],
            'rental_type'   => $apt['rental_type'],
            'rooms_count'   => $apt['rooms_count'] !== null ? (int)$apt['rooms_count'] : null,
            'move_in_type'  => $apt['move_in_type'],
            'move_in_date'  => $apt['move_in_date'],
            'is_available'  => (bool)$apt['is_available'],
            'images'        => $images,
            'features'      => $features,
            'universities'  => $universities,
        ];
    }

    jsonResponse(true, "Success", 200, ['apartments' => $result]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
