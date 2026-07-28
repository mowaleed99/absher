<?php
require_once __DIR__ . '/config/db.php';

// Chats - correct columns
$chats = $conn->query('SELECT * FROM chats ORDER BY id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
echo "=== RECENT chats ===" . PHP_EOL;
foreach($chats as $c) { echo json_encode($c, JSON_UNESCAPED_UNICODE) . PHP_EOL; }
echo PHP_EOL;

// Chat messages
$msgs = $conn->query('SELECT * FROM chat_messages ORDER BY id DESC LIMIT 8')->fetchAll(PDO::FETCH_ASSOC);
echo "=== RECENT chat_messages ===" . PHP_EOL;
foreach($msgs as $m) { echo json_encode($m, JSON_UNESCAPED_UNICODE) . PHP_EOL; }
echo PHP_EOL;

// Check if chats has created_at
$cols = $conn->query('SHOW COLUMNS FROM chats')->fetchAll(PDO::FETCH_ASSOC);
echo "=== chats exact columns ===" . PHP_EOL;
foreach($cols as $c) { echo "  {$c['Field']}  {$c['Type']} default={$c['Default']}" . PHP_EOL; }
echo PHP_EOL;

// Full districts list
$districts = $conn->query('SELECT * FROM districts')->fetchAll(PDO::FETCH_ASSOC);
echo "=== districts ===" . PHP_EOL;
foreach($districts as $d) { echo json_encode($d, JSON_UNESCAPED_UNICODE) . PHP_EOL; }
echo PHP_EOL;

// Filesystem check - where do uploaded images actually live?
echo "=== UPLOAD FOLDER STRUCTURE ===" . PHP_EOL;
$basePath = __DIR__ . '/uploads';
if (is_dir($basePath)) {
    $dirs = glob($basePath . '/*', GLOB_ONLYDIR);
    foreach($dirs as $dir) {
        $files = glob($dir . '/*');
        echo basename($dir) . ': ' . count($files) . ' files' . PHP_EOL;
        foreach(array_slice($files, 0, 3) as $f) {
            echo "  " . str_replace(__DIR__ . '/', '', $f) . PHP_EOL;
        }
    }
} else {
    echo "  uploads/ folder does NOT exist at $basePath" . PHP_EOL;
}

// Check assets/images
$assetsPath = __DIR__ . '/../assets/images';
echo PHP_EOL . "=== assets/images files ===" . PHP_EOL;
if (is_dir($assetsPath)) {
    foreach(glob($assetsPath . '/*.{png,jpg,jpeg,webp}', GLOB_BRACE) as $f) {
        echo "  " . basename($f) . PHP_EOL;
    }
} else {
    echo "  NOT FOUND at $assetsPath" . PHP_EOL;
}

// Check where backend_php lives relative to web root
echo PHP_EOL . "=== PATH INFO ===" . PHP_EOL;
echo "__DIR__ = " . __DIR__ . PHP_EOL;
echo "realpath(../assets) = " . realpath(__DIR__ . '/../assets') . PHP_EOL;
