<?php
// ملف وسيط لعرض الصور والفيديوهات وحل مشكلة الـ CORS (Cross-Origin Resource Sharing)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$file = $_GET['file'] ?? '';
if (empty($file)) {
    http_response_code(400);
    echo "معلمة الملف مفقودة";
    exit();
}

// حماية ضد ثغرات التمرير عبر المجلدات (Directory Traversal Security)
$file = basename($file);
$filePath = __DIR__ . '/../uploads/' . $file;

if (!file_exists($filePath)) {
    http_response_code(404);
    echo "الملف غير موجود";
    exit();
}

$ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
$contentTypes = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
    'mp4' => 'video/mp4',
    'mov' => 'video/quicktime',
    'avi' => 'video/x-msvideo',
    'mkv' => 'video/x-matroska',
    'webm' => 'video/webm',
];

$contentType = 'application/octet-stream';
if (function_exists('mime_content_type')) {
    $detected = @mime_content_type($filePath);
    if ($detected && strpos($detected, '/') !== false) {
        $contentType = $detected;
    }
}
if ($contentType === 'application/octet-stream' && function_exists('getimagesize')) {
    $imgInfo = @getimagesize($filePath);
    if ($imgInfo && !empty($imgInfo['mime'])) {
        $contentType = $imgInfo['mime'];
    }
}
if ($contentType === 'application/octet-stream' && isset($contentTypes[$ext])) {
    $contentType = $contentTypes[$ext];
}

header("Content-Type: $contentType");
header("Content-Length: " . filesize($filePath));

// تنظيف البافرات لتجنب تلف البيانات الثنائية
if (ob_get_level()) {
    ob_end_clean();
}

readfile($filePath);
exit();
?>
