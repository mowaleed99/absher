<?php
// ملف الاتصال بقاعدة البيانات (Database Configuration) لـ تطبيق أبشر
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (($_SERVER['REQUEST_METHOD'] ?? '') == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if running on localhost (local development)
$http_host = $_SERVER['HTTP_HOST'] ?? '';
$hostname = explode(':', $http_host)[0];
$isLocal = ($hostname == 'localhost' || $hostname == '127.0.0.1' || php_sapi_name() == 'cli');

if ($isLocal) {
    $host = "127.0.0.1";
    $db_name = "absher_georgia_db";
    $username = "root";
    $password = "";
} else {
    $host = "localhost";
    $db_name = "u611585639_absher_db";
    $username = "u611585639_absher_user";
    $password = "1732003@mM";
}

try {
    if ($isLocal) {
        // الاتصال أولاً بدون تحديد قاعدة بيانات لإنشائها إذا لم تكن موجودة (محلياً فقط)
        $pdo_init = new PDO("mysql:host=" . $host . ";charset=utf8mb4", $username, $password);
        $pdo_init->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo_init->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    }

    // الاتصال بقاعدة البيانات المحددة
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 3. فحص هل الجداول تم إنشاؤها مسبقاً؟ إذا لم تكن موجودة يتم استيراد ملف schema.sql فوراً
    $checkApt = $conn->query("SHOW TABLES LIKE 'apartments'");
    $checkChat = $conn->query("SHOW TABLES LIKE 'chats'");
    $checkRev = $conn->query("SHOW TABLES LIKE 'reviews'");
    if ($checkApt->rowCount() == 0 || $checkChat->rowCount() == 0 || $checkRev->rowCount() == 0) {
        $schemaPath = __DIR__ . '/../schema.sql';
        if (file_exists($schemaPath)) {
            $sql = file_get_contents($schemaPath);
            // تقسيم الملف إلى استعلامات منفصلة وتنفيذها
            $queries = explode(';', $sql);
            foreach ($queries as $query) {
                $trimmed = trim($query);
                if (!empty($trimmed)) {
                    $conn->exec($trimmed);
                }
            }
        }
    }

    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $exception) {
    // في حال تعذر الاتصال بـ MySQL نهائياً نرجع رسالة خطأ واضحة
    echo json_encode([
        "status" => "error",
        "message" => "خطأ في الاتصال بقاعدة البيانات: " . $exception->getMessage() . " | Host: " . $host . " | Local: " . ($isLocal ? 'yes' : 'no')
    ], JSON_UNESCAPED_UNICODE);
    exit();
}
?>
