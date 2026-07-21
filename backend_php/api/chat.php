<?php
// ملف المحادثات المباشرة بين الطالب والدعم الفني (Student Chat API)
// =========================================================================
// DEPRECATED: This file is deprecated. 
// Do not use. Use the endpoints in backend_php/api/chat/ instead.
// =========================================================================

require_once __DIR__ .'/../config/db.php';

$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$action = $_GET['action'] ?? ($input['action'] ??'get');

try {
    if ($action ==='get') {
        $phone = trim($_GET['phone'] ?? ($input['phone'] ??''));
        if (empty($phone)) {
            echo json_encode(["status"=>"success","messages"=> []], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $stmt = $conn->prepare("SELECT id FROM chats WHERE phone = ?");
        $stmt->execute([$phone]);
        $chat = $stmt->fetch();

        if (!$chat) {
            echo json_encode(["status"=>"success","messages"=> []], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $stmtMsg = $conn->prepare("SELECT sender, text, type, image_url AS imageUrl, quote_text AS quoteText, quote_sender AS quoteSender, DATE_FORMAT(created_at,'%h:%i %p') AS time FROM chat_messages WHERE chat_id = ? AND is_deleted = 0 ORDER BY id ASC");
        $stmtMsg->execute([$chat['id']]);
        $messages = $stmtMsg->fetchAll();

        echo json_encode(["status"=>"success","chat_id"=> $chat['id'],"messages"=> $messages
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action ==='send') {
        $phone = trim($input['phone'] ??'');
        $studentName = trim($input['student_name'] ??'طالب');
        $studentUni = trim($input['student_uni'] ??'جامعة في جورجيا');
        $text = trim($input['text'] ??'');
        $type = trim($input['type'] ??'text');
        $imageUrl = trim($input['image_url'] ??'');
        $quoteText = trim($input['quote_text'] ??'');
        $quoteSender = trim($input['quote_sender'] ??'');

        if (empty($phone) || (empty($text) && empty($imageUrl))) {
            echo json_encode(["status"=>"error","message"=>"النص أو رقم الهاتف مفقود"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $lastMsgText = !empty($text) ? $text : ($type ==='video'?'فيديو مرفق':'صورة مرفقة');

        $stmt = $conn->prepare("SELECT id FROM chats WHERE phone = ?");
        $stmt->execute([$phone]);
        $chat = $stmt->fetch();

        if ($chat) {
            $chatId = $chat['id'];
            $conn->prepare("UPDATE chats SET last_msg = ?, status ='رسالة جديدة'WHERE id = ?")->execute([$lastMsgText, $chatId]);
        } else {
            $insertChat = $conn->prepare("INSERT INTO chats (student_name, student_uni, phone, last_msg, status) VALUES (?, ?, ?, ?,'رسالة جديدة')");
            $insertChat->execute([$studentName, $studentUni, $phone, $lastMsgText]);
            $chatId = $conn->lastInsertId();
        }

        $insertMsg = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, text, type, image_url, quote_text, quote_sender) VALUES (?,'student', ?, ?, ?, ?, ?)");
        $insertMsg->execute([$chatId, $text, $type, !empty($imageUrl) ? $imageUrl : null, !empty($quoteText) ? $quoteText : null, !empty($quoteSender) ? $quoteSender : null]);

        echo json_encode(["status"=>"success","message"=>"تم إرسال الرسالة بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    echo json_encode(["status"=>"error","message"=>"إجراء غير معروف"], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(["status"=>"error","message"=>"خطأ في الخادم:". $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
