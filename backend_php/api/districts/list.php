<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $lang = $_GET['lang'] ?? 'ar';
    if (!in_array($lang, ['ar', 'en'], true)) {
        $lang = 'ar';
    }
    $nameCol = ($lang === 'en') ? "COALESCE(NULLIF(name_en, ''), NULLIF(name_ar, ''), name)" : "COALESCE(NULLIF(name_ar, ''), name)";
    $stmt = $conn->query("SELECT id, $nameCol AS name FROM districts ORDER BY $nameCol ASC");
    $districts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(true, '', 200, $districts);
} catch (PDOException $e) {
    error_log('Error fetching districts: ' . $e->getMessage());
    jsonResponse(false, 'Failed to fetch districts', 500);
}
