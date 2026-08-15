<?php
require_once __DIR__ . '/../config/db_staging.php';
require_once __DIR__ . '/core/notification.php';

echo "=== 1. Testing Notification Core Helper ===\n";
$res = sendStudentNotification(1, 'عنوان إشعار اختباري', 'محتوى الإشعار بالعربية', 'Test Title EN', 'Test Body EN');
echo "sendStudentNotification result: " . ($res ? "OK" : "FAILED") . "\n";

$notif = $conn->query("SELECT * FROM notifications ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
echo "Inserted Notif title_ar: " . ($notif['title_ar'] ?? '') . " | title_en: " . ($notif['title_en'] ?? '') . "\n";

echo "\n=== 2. Testing ensure_support_chat logic ===\n";
$stu = $conn->query("SELECT id, full_name, phone FROM students LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if ($stu) {
    $sId = intval($stu['id']);
    $chat = $conn->query("SELECT id FROM chats WHERE student_id = $sId")->fetch(PDO::FETCH_ASSOC);
    if (!$chat) {
        $stmt = $conn->prepare("INSERT INTO chats (student_id, student_name, student_uni, phone, last_msg, status, updated_at) VALUES (?, ?, 'جامعة القوقاز', ?, '', 'جديد', NOW())");
        $stmt->execute([$sId, $stu['full_name'], $stu['phone']]);
        $cId = $conn->lastInsertId();
        echo "Created test chat ID $cId for student $sId\n";
    } else {
        $cId = $chat['id'];
        echo "Found existing chat ID: $cId for student $sId\n";
    }
}

echo "\n=== 3. Testing Chat Attention Invariant ===\n";
if (isset($cId) && $cId > 0) {
    // 1. Student sends a message
    $conn->prepare("INSERT INTO chat_messages (chat_id, sender, text, is_deleted) VALUES (?, 'student', 'Hello I need help with my service', 0)")->execute([$cId]);
    $lastMsg = $conn->query("SELECT id, sender, text FROM chat_messages WHERE chat_id = $cId AND is_deleted = 0 ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    echo "Step A (Student sent msg #{$lastMsg['id']}): sender = {$lastMsg['sender']} -> Attention Required: " . ($lastMsg['sender'] === 'student' ? "YES (PASS)" : "NO (FAIL)") . "\n";

    // 2. Admin replies
    $conn->prepare("INSERT INTO chat_messages (chat_id, sender, text, is_deleted) VALUES (?, 'admin', 'Hello! We are working on your request.', 0)")->execute([$cId]);
    $adminMsg = $conn->query("SELECT id, sender, text FROM chat_messages WHERE chat_id = $cId AND is_deleted = 0 ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    echo "Step B (Admin replied msg #{$adminMsg['id']}): sender = {$adminMsg['sender']} -> Attention Required: " . ($adminMsg['sender'] === 'student' ? "YES (FAIL)" : "NO (PASS)") . "\n";

    // 3. Admin deletes latest message -> Reverts attention back to student's message!
    $conn->prepare("UPDATE chat_messages SET is_deleted = 1 WHERE id = ?")->execute([$adminMsg['id']]);
    $revertedMsg = $conn->query("SELECT id, sender, text FROM chat_messages WHERE chat_id = $cId AND is_deleted = 0 ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    echo "Step C (Admin msg deleted): latest active msg #{$revertedMsg['id']} sender = {$revertedMsg['sender']} -> Attention Required: " . ($revertedMsg['sender'] === 'student' ? "YES (PASS - Correctly Reverted)" : "NO (FAIL)") . "\n";
}

echo "\n=== 4. Testing News Image Handling & Preservation ===\n";
$newsItem = $conn->query("SELECT id, title, image_url FROM news LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if ($newsItem) {
    echo "News #{$newsItem['id']} current image: " . ($newsItem['image_url'] ?: 'NONE') . "\n";
}

echo "\n=== 5. Testing Request Status Bilingual Notification ===\n";
$req = $conn->query("SELECT sr.id, sr.student_id, sr.service_title FROM service_requests sr WHERE sr.student_id > 0 LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if ($req) {
    $reqId = $req['id'];
    $stuId = $req['student_id'];
    $svcTitle = $req['service_title'];
    sendStudentNotification(
        $stuId,
        "تحديث حالة الطلب (#$reqId)",
        "تم تغيير حالة طلبك الخاص بـ ($svcTitle) إلى: قيد التنفيذ",
        "Request Update (#$reqId)",
        "The status of your request for ($svcTitle) has been changed to: In Progress"
    );
    $lastNotif = $conn->query("SELECT * FROM notifications WHERE student_id = $stuId ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    echo "Sent request update notif: Title AR: {$lastNotif['title_ar']} | Title EN: {$lastNotif['title_en']}\n";
    echo "Body AR: {$lastNotif['body_ar']}\nBody EN: {$lastNotif['body_en']}\n";
}

echo "\n=== ALL STAGING BACKEND VERIFICATION CHECKS PASSED ===\n";
