<?php
require_once __DIR__ . '/config/db.php';

// Issue 3: news table schema
$stmt = $conn->query('SHOW CREATE TABLE news');
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo "=== NEWS CREATE TABLE ===" . PHP_EOL;
echo $row['Create Table'] . PHP_EOL . PHP_EOL;

// Column listings
foreach(['news','apartments','services','service_requests','chats','chat_messages'] as $t) {
    $cols = $conn->query("SHOW COLUMNS FROM $t")->fetchAll(PDO::FETCH_ASSOC);
    echo "=== $t COLUMNS ===" . PHP_EOL;
    foreach($cols as $c) { echo "  {$c['Field']}  {$c['Type']}" . PHP_EOL; }
    echo PHP_EOL;
}

// Issue 2: raw image values from DB
$apts = $conn->query('SELECT id, title, images FROM apartments LIMIT 4')->fetchAll(PDO::FETCH_ASSOC);
echo "=== APARTMENTS RAW IMAGES ===" . PHP_EOL;
foreach($apts as $a) {
    echo "id={$a['id']} title={$a['title']}" . PHP_EOL;
    echo "  images_raw=" . $a['images'] . PHP_EOL;
}
echo PHP_EOL;

$svcs = $conn->query('SELECT id, title, image_url FROM services LIMIT 4')->fetchAll(PDO::FETCH_ASSOC);
echo "=== SERVICES RAW image_url ===" . PHP_EOL;
foreach($svcs as $s) {
    echo "id={$s['id']} title={$s['title']} image_url={$s['image_url']}" . PHP_EOL;
}
echo PHP_EOL;

// Booking/service request flow
$reqs = $conn->query('SELECT id, student_id, student_name, service_title, status, created_at FROM service_requests ORDER BY id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
echo "=== RECENT service_requests ===" . PHP_EOL;
foreach($reqs as $r) { echo json_encode($r) . PHP_EOL; }
echo PHP_EOL;

// Recent chats
$chats = $conn->query('SELECT id, student_name, phone, last_msg, status, created_at FROM chats ORDER BY id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
echo "=== RECENT chats ===" . PHP_EOL;
foreach($chats as $c) { echo json_encode($c) . PHP_EOL; }
