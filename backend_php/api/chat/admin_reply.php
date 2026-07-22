<?php
// Admin reply endpoint: allows authenticated admins to send messages in a chat.
// SECURITY: sender identity is determined from the verified JWT (admin_id),
//           never from a client-provided field.
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

// Only admins can use this endpoint.
AuthMiddleware::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Method not allowed", 405);
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

try {
    // Verify chat exists
    $chatStmt = $conn->prepare("SELECT id FROM chats WHERE id = ?");
    $chatStmt->execute([$chat_id]);
    if (!$chatStmt->fetch()) {
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

    // Update chat last message and status
    $conn->prepare(
        "UPDATE chats SET last_msg = ?, status = 'رد إداري', updated_at = NOW()
         WHERE id = ?"
    )->execute([!empty($content) ? $content : 'صورة مرفقة', $chat_id]);

    jsonResponse(true, "Message sent", 201, ['message_id' => (int)$messageId]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
