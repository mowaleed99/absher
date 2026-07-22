<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAnyAuth();

$chat_id = $_GET['chat_id'] ?? null;

if (!$chat_id) {
    jsonResponse(false, "chat_id is required", 400);
}

try {
    if (!AuthMiddleware::$isAdmin) {
        $student_id = AuthMiddleware::$currentUserId;
        // Verify chat belongs to student
        $stuStmt = $conn->prepare("SELECT phone FROM students WHERE id = ?");
        $stuStmt->execute([$student_id]);
        $stuPhone = $stuStmt->fetchColumn() ?: '';

        $checkStmt = $conn->prepare("SELECT id FROM chats WHERE id = ? AND (student_id = ? OR (phone = ? AND phone != '')) LIMIT 1");
        $checkStmt->execute([$chat_id, $student_id, $stuPhone]);
        if (!$checkStmt->fetch()) {
            jsonResponse(false, "Unauthorized access to chat", 403);
        }
    }

    $stmt = $conn->prepare("SELECT id, chat_id, sender AS sender_type, type AS message_type, text AS content, sender, type, text, image_url, quote_text, quote_sender, created_at 
                            FROM chat_messages 
                            WHERE chat_id = ? AND is_deleted = 0 
                            ORDER BY id ASC");
    $stmt->execute([$chat_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "status" => "success",
        "message" => "Success",
        "messages" => $messages,
        "data" => $messages
    ], JSON_UNESCAPED_UNICODE);
    exit();
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
