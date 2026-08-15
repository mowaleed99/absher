<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $lang = $_GET['lang'] ?? 'ar';
    $titleCol = ($lang === 'en') ? "COALESCE(NULLIF(title_en, ''), title, title_ar)" : "COALESCE(NULLIF(title_ar, ''), title, title_en)";
    $contentCol = ($lang === 'en') ? "COALESCE(NULLIF(content_en, ''), content, content_ar)" : "COALESCE(NULLIF(content_ar, ''), content, content_en)";

    $stmt = $conn->query("
        SELECT id,
               $titleCol AS title,
               $contentCol AS content,
               title_ar,
               title_en,
               content_ar,
               content_en,
               image_url,
               DATE_FORMAT(created_at, '%Y-%m-%d %h:%i %p') AS date,
               created_at
        FROM news
        ORDER BY created_at DESC, id DESC
    ");
    $news = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, "Success", 200, $news);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
