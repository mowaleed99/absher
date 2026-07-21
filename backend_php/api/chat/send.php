<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$chat_id = $data['chat_id'] ?? null;
$student_id = AuthMiddleware::$currentUserId;
$sender_type = $data['sender_type'] ?? 'student';
$message_type = $data['message_type'] ?? 'text';
$content = trim($data['content'] ?? '');
$image_url = $data['image_url'] ?? null;

if (!$chat_id || (trim($content) === '' && trim($image_url ?? '') === '')) {
    jsonResponse(false, "chat_id and content or image are required", 400);
}

try {
    // Verify chat belongs to student
    $stuStmt = $conn->prepare("SELECT phone FROM students WHERE id = ?");
    $stuStmt->execute([$student_id]);
    $stuPhone = $stuStmt->fetchColumn() ?: '';

    $checkStmt = $conn->prepare("SELECT id FROM chats WHERE id = ? AND (student_id = ? OR (phone = ? AND phone != '')) LIMIT 1");
    $checkStmt->execute([$chat_id, $student_id, $stuPhone]);
    if (!$checkStmt->fetch()) {
        jsonResponse(false, "Unauthorized access to chat", 403);
    }

    $quote_text = $data['quote_text'] ?? null;
    $quote_sender = $data['quote_sender'] ?? null;

    $stmt = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, type, text, image_url, quote_text, quote_sender) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$chat_id, $sender_type, $message_type, $content, !empty($image_url) ? $image_url : null, !empty($quote_text) ? $quote_text : null, !empty($quote_sender) ? $quote_sender : null]);
    $msg_id = (int)$conn->lastInsertId();
    
    // Update chat last activity and status
    $lastMsgText = !empty($content) ? $content : ($message_type === 'video' ? 'فيديو مرفق' : 'صورة مرفقة');
    $updateStmt = $conn->prepare("UPDATE chats SET last_msg = ?, status = 'رسالة جديدة', last_activity_at = CURRENT_TIMESTAMP WHERE id = ?");
    $updateStmt->execute([$lastMsgText, $chat_id]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "status" => "success",
        "message" => "Message sent",
        "message_id" => $msg_id,
        "data" => ["message_id" => $msg_id]
    ], JSON_UNESCAPED_UNICODE);
    exit();
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        jsonResponse(false, "Invalid chat_id", 400);
    }
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
