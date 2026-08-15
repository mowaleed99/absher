<?php
// Admin reply endpoint: allows authenticated admins to send messages in a chat.
// SECURITY: sender identity is determined from the verified JWT (admin_id),
//           never from a client-provided field.
require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../core/notification.php';

// Only admins can use this endpoint.
AuthMiddleware::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Method not allowed", 405);
}

function saveBase64ChatImage($url) {
    if (is_string($url) && preg_match('/^data:image\/(\w+);base64,/', $url, $matches)) {
        $ext = $matches[1] ?: 'jpg';
        $data = base64_decode(preg_replace('/^data:image\/\w+;base64,/', '', $url));
        if ($data !== false) {
            $uploadDir = __DIR__ . '/../../uploads_staging/chat/';
            if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
            $filename = 'chat_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
            file_put_contents($uploadDir . $filename, $data);
            return 'uploads_staging/chat/' . $filename;
        }
    }
    return $url;
}

$data = json_decode(file_get_contents("php://input"), true) ?? [];

$chat_id      = isset($data['chat_id']) ? (int)$data['chat_id'] : 0;
$content      = trim($data['content'] ?? $data['text'] ?? '');
$message_type = trim($data['message_type'] ?? $data['type'] ?? 'text');
$image_url    = trim($data['image_url'] ?? '');
$quote_text   = trim($data['quote_text'] ?? '');
$quote_sender = trim($data['quote_sender'] ?? '');

if ($chat_id <= 0) {
    jsonResponse(false, "chat_id is required", 400);
}

if (empty($content) && empty($image_url)) {
    jsonResponse(false, "content or image_url is required", 400);
}

// Convert base64 image if passed to disk file URL
if (!empty($image_url)) {
    $image_url = saveBase64ChatImage($image_url);
    if (empty($content)) {
        $content = 'صورة مرفقة';
    }
}

try {
    // Verify chat exists and get student_id
    $chatStmt = $conn->prepare("SELECT id, student_id FROM chats WHERE id = ?");
    $chatStmt->execute([$chat_id]);
    $chatRow = $chatStmt->fetch();
    if (!$chatRow) {
        jsonResponse(false, "Chat not found", 404);
    }

    // Insert message — sender is always 'admin', set by verified token, never by client
    $sender = 'admin';
    $stmt = $conn->prepare(
        "INSERT INTO chat_messages (chat_id, sender, text, type, image_url, quote_text, quote_sender)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $chat_id,
        $sender,
        $content,
        $message_type,
        !empty($image_url) ? $image_url : null,
        !empty($quote_text) ? $quote_text : null,
        !empty($quote_sender) ? $quote_sender : null,
    ]);

    $messageId = $conn->lastInsertId();

    // Update chat last message and status to handled ('تم الرد')
    $conn->prepare(
        "UPDATE chats SET last_msg = ?, status = 'تم الرد', updated_at = NOW()
         WHERE id = ?"
    )->execute([!empty($content) ? $content : 'صورة مرفقة', $chat_id]);

    // Send targeted bilingual notification to the student who owns the chat
    if (!empty($chatRow['student_id'])) {
        $studentId = intval($chatRow['student_id']);
        $snippet = mb_substr($content, 0, 50);
        $notifTitleAr = "رد جديد من خدمة العملاء";
        $notifBodyAr = "لديك رد جديد على استفسارك في الشات: " . $snippet;
        $notifTitleEn = "New reply from Customer Support";
        $notifBodyEn = "You have a new reply to your inquiry: " . $snippet;
        sendStudentNotification($studentId, $notifTitleAr, $notifBodyAr, $notifTitleEn, $notifBodyEn);
    }

    jsonResponse(true, "Message sent", 201, [
        'message_id' => (int)$messageId,
        'image_url' => $image_url
    ]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred: " . $e->getMessage(), 500);
}
