<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config/db.php';

try {
    $conn->beginTransaction();
    
    $studentId = 1;
    $studentName = "Test Student";
    $studentPhone = "+995599111222";
    $studentUni = "Test University";
    $serviceTitle = "Test Service";
    $requestId = 9999;
    $pricePoints = 0;
    
    // Simulate what's in student_requests.php
    $details = "Testing request image flow [رابط الصورة المرفقة: uploads/requests/test_image.jpg]";
    $fullDetails = "الجامعة: " . $studentUni . "\nالتفاصيل: " . $details;
    
    // Support sync
    $chatId = null;
    $msgId = null;
    
    // Find or create chat
    $chatStmt = $conn->prepare("SELECT id FROM chats WHERE student_id = ? AND status != 'archived' ORDER BY updated_at DESC LIMIT 1");
    $chatStmt->execute([$studentId]);
    $chatRow = $chatStmt->fetch(PDO::FETCH_ASSOC);
    $chatId = $chatRow ? (int)$chatRow['id'] : null;

    if (!$chatId) {
        $createChat = $conn->prepare("INSERT INTO chats (student_id, student_name, student_uni, phone, status, updated_at) VALUES (?, ?, ?, ?, 'رسالة جديدة 🔔', NOW())");
        $createChat->execute([$studentId, $studentName, $studentUni, $studentPhone]);
        $chatId = (int)$conn->lastInsertId();
    }
    
    $msgContent = "📋 [" . ($pricePoints > 0 ? "طلب مدفوع بالنقاط" : "طلب خدمة جديد") . " - #" . $requestId . "]\nالخدمة: " . $serviceTitle . "\n" . $fullDetails;
    
    $attachedImageUrl = '';
    // Check if details contains a photo link using ASCII-safe uploads path regex
    if (preg_match('/\[[^\]]*?(uploads\/[a-zA-Z0-9_\/.-]+)\]/', $fullDetails, $imgMatches)) {
        $attachedImageUrl = trim($imgMatches[1]);
        // Clean up the text version of the message by removing the bracketed link
        $msgContent = str_replace($imgMatches[0], '', $msgContent);
        $msgContent = trim($msgContent);
    }
    
    echo "Resolved image URL: " . $attachedImageUrl . PHP_EOL;
    echo "Message content after strip: " . $msgContent . PHP_EOL;

    // 1. Insert Text Message
    $msgStmt = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, type, text, created_at) VALUES (?, 'student', 'text', ?, NOW())");
    $msgStmt->execute([$chatId, $msgContent]);
    $msgId = $conn->lastInsertId();
    echo "Inserted text message ID: " . $msgId . PHP_EOL;
    
    // 2. Insert Image Message if image is attached
    if (!empty($attachedImageUrl)) {
        $imgCaption = "🖼️ صورة مرفقة بالطلب #" . $requestId;
        $imgStmt = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, type, text, image_url, created_at) VALUES (?, 'student', 'image', ?, ?, NOW())");
        $imgStmt->execute([$chatId, $imgCaption, $attachedImageUrl]);
        $msgId = $imgStmt->lastInsertId();
        echo "Inserted image message ID: " . $msgId . PHP_EOL;
    }
    
    $conn->rollBack();
    echo "Transaction rolled back successfully. No errors." . PHP_EOL;
} catch (Exception $e) {
    echo "Error caught: " . $e->getMessage() . PHP_EOL;
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
}
