<?php
// Public endpoint: list all services for students.
// The services table uses: id, title, description, image_url, has_form, created_at
// has_form indicates whether the service presents a request form (not a visibility toggle).
// All services in the table are considered visible.
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $lang = $_GET['lang'] ?? 'ar';
    if (!in_array($lang, ['ar', 'en'], true)) {
        $lang = 'ar';
    }
    $titleCol = ($lang === 'en') ? "COALESCE(NULLIF(title_en, ''), NULLIF(title_ar, ''), title)" : "COALESCE(NULLIF(title_ar, ''), title)";
    $descCol  = ($lang === 'en') ? "COALESCE(NULLIF(description_en, ''), NULLIF(description_ar, ''), description)" : "COALESCE(NULLIF(description_ar, ''), description)";

    $stmt = $conn->query(
        "SELECT id, $titleCol AS title, $descCol AS description, image_url, has_form, price_points, COALESCE(price_cash, 0.00) AS price_cash
         FROM services
         ORDER BY id ASC"
    );
    $services = $stmt->fetchAll();

    $result = [];
    foreach ($services as $svc) {
        $result[] = [
            'id'           => (int)$svc['id'],
            'title'        => $svc['title'],
            'description'  => $svc['description'],
            'image_url'    => $svc['image_url'],
            'has_form'     => (bool)$svc['has_form'],
            'price_points' => isset($svc['price_points']) ? (int)$svc['price_points'] : 0,
            'price_cash'   => isset($svc['price_cash']) ? (float)$svc['price_cash'] : 0.0,
        ];
    }

    jsonResponse(true, "Success", 200, ['services' => $result]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
