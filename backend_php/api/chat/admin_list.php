<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAdmin();

try {
    $chats = $conn->query("SELECT * FROM chats ORDER BY COALESCE(updated_at, last_activity_at) DESC")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($chats as &$c) {
        $stmtMsg = $conn->prepare("SELECT sender, text, type, image_url AS imageUrl, quote_text AS quoteText, quote_sender AS quoteSender, is_deleted AS deleted, DATE_FORMAT(created_at,'%h:%i %p') AS time, created_at 
                                   FROM chat_messages 
                                   WHERE chat_id = ? 
                                   ORDER BY created_at ASC, id ASC");
        $stmtMsg->execute([$c['id']]);
        $msgs = $stmtMsg->fetchAll(PDO::FETCH_ASSOC);
        foreach ($msgs as &$m) {
            $m['deleted'] = ($m['deleted'] == 1 || $m['deleted'] === true);
        }
        $c['messages'] = $msgs;
        $c['time'] = !empty($msgs) ? end($msgs)['time'] : '';
    }

    echo json_encode([
        "success" => true,
        "status" => "success",
        "chats" => $chats,
        "data" => ["chats" => $chats]
    ], JSON_UNESCAPED_UNICODE);
    exit();
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
