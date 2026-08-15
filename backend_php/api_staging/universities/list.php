<?php
require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $lang = $_GET['lang'] ?? 'ar';
    if (!in_array($lang, ['ar', 'en'], true)) {
        $lang = 'ar';
    }
    $nameCol = ($lang === 'en') ? "COALESCE(NULLIF(name_en, ''), NULLIF(name_ar, ''), name)" : "COALESCE(NULLIF(name_ar, ''), name)";
    $stmt = $conn->query("SELECT id, $nameCol AS name FROM universities ORDER BY $nameCol ASC");
    $universities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(true, '', 200, $universities);
} catch (PDOException $e) {
    error_log('Error fetching universities: ' . $e->getMessage());
    jsonResponse(false, 'Failed to fetch universities', 500);
}
