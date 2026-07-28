<?php
// End-to-end test: service request submit with simulated JWT
require_once __DIR__ . '/config/db.php';

echo "=== Test 1: Submit service request (simulated authenticated student) ===" . PHP_EOL;

// Simulate what the backend does: student_id=1 exists
$studentId = 1;
$studentName = "محمد علي";
$studentPhone = "+995599123456";
$studentUni = "جامعة جورجيا";
$serviceTitle = "فني كهربائي";
$fullDetails = "الجامعة: $studentUni\nالتفاصيل: اختبار شامل";

// 1. Insert service request
$stmt = $conn->prepare("INSERT INTO service_requests (student_id, student_name, student_phone, service_title, details, status, created_at) VALUES (?, ?, ?, ?, ?, 'قيد المراجعة', NOW())");
$stmt->execute([$studentId, $studentName, $studentPhone, $serviceTitle, $fullDetails]);
$requestId = $conn->lastInsertId();
echo "✅ service_request inserted: id=$requestId" . PHP_EOL;

// 2. Find or create chat
$chatStmt = $conn->prepare("SELECT id FROM chats WHERE student_id = ? AND status != 'archived' ORDER BY updated_at DESC LIMIT 1");
$chatStmt->execute([$studentId]);
$chatRow = $chatStmt->fetch(PDO::FETCH_ASSOC);
$chatId = $chatRow ? (int)$chatRow['id'] : null;
echo "Chat found: " . ($chatId ? "id=$chatId" : "NONE — creating new") . PHP_EOL;

if (!$chatId) {
    $createChat = $conn->prepare("INSERT INTO chats (student_id, student_name, student_uni, phone, status, updated_at) VALUES (?, ?, ?, ?, 'رسالة جديدة 🔔', NOW())");
    $createChat->execute([$studentId, $studentName, $studentUni, $studentPhone]);
    $chatId = (int)$conn->lastInsertId();
    echo "✅ New chat created: id=$chatId" . PHP_EOL;
}

// 3. Insert chat message
$msgContent = "📋 [طلب خدمة جديد - #$requestId]\nالخدمة: $serviceTitle\n$fullDetails";
$msgStmt = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, type, text, created_at) VALUES (?, 'student', 'text', ?, NOW())");
$msgStmt->execute([$chatId, $msgContent]);
$msgId = $conn->lastInsertId();
echo "✅ chat_message inserted: id=$msgId, chat_id=$chatId" . PHP_EOL;

// 4. Update chat last_msg (using correct column name)
$updateChat = $conn->prepare("UPDATE chats SET last_msg = ?, updated_at = NOW() WHERE id = ?");
$updateChat->execute([$msgContent, $chatId]);
echo "✅ chats.last_msg updated" . PHP_EOL;

// 5. Verify row
$verify = $conn->query("SELECT id, student_id, service_title, status FROM service_requests WHERE id=$requestId")->fetch(PDO::FETCH_ASSOC);
echo PHP_EOL . "=== VERIFIED service_requests row ===" . PHP_EOL;
echo json_encode($verify, JSON_UNESCAPED_UNICODE) . PHP_EOL;

$verifyMsg = $conn->query("SELECT id, chat_id, sender, LEFT(text,60) AS text_preview FROM chat_messages WHERE id=$msgId")->fetch(PDO::FETCH_ASSOC);
echo PHP_EOL . "=== VERIFIED chat_messages row ===" . PHP_EOL;
echo json_encode($verifyMsg, JSON_UNESCAPED_UNICODE) . PHP_EOL;

$verifyChat = $conn->query("SELECT id, student_name, status, LEFT(last_msg,60) AS last_msg FROM chats WHERE id=$chatId")->fetch(PDO::FETCH_ASSOC);
echo PHP_EOL . "=== VERIFIED chats row ===" . PHP_EOL;
echo json_encode($verifyChat, JSON_UNESCAPED_UNICODE) . PHP_EOL;

// Cleanup test data
$conn->exec("DELETE FROM chat_messages WHERE id=$msgId");
$conn->exec("DELETE FROM service_requests WHERE id=$requestId");
echo PHP_EOL . "✅ Test rows cleaned up" . PHP_EOL;

// === News test ===
echo PHP_EOL . "=== Test 2: News insert with image_url ===" . PHP_EOL;
$stmt = $conn->prepare("INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)");
$stmt->execute(['خبر اختبار', 'محتوى خبر اختباري', 'uploads/general/test.jpg']);
$newsId = $conn->lastInsertId();
$row = $conn->query("SELECT id, title, image_url FROM news WHERE id=$newsId")->fetch(PDO::FETCH_ASSOC);
echo "✅ News insert: " . json_encode($row, JSON_UNESCAPED_UNICODE) . PHP_EOL;
$conn->exec("DELETE FROM news WHERE id=$newsId");
echo "✅ News test row cleaned up" . PHP_EOL;
