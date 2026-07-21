<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$student_id = AuthMiddleware::$currentUserId;

if (!$student_id) {
    jsonResponse(false, "Authentication required", 401);
}

try {
    // Get student info
    $stuStmt = $conn->prepare("SELECT full_name, phone, university FROM students WHERE id = ?");
    $stuStmt->execute([$student_id]);
    $student = $stuStmt->fetch(PDO::FETCH_ASSOC);

    $phone = $student['phone'] ?? '';
    $name = $student['full_name'] ?? 'طالب';
    $uni = $student['university'] ?? 'جامعة في جورجيا';

    // Check if an open chat already exists by student_id or phone
    $stmt = $conn->prepare("SELECT id, student_id FROM chats WHERE (student_id = ? OR (phone = ? AND phone != '')) AND status != 'محظور' AND status != 'مؤرشفة' LIMIT 1");
    $stmt->execute([$student_id, $phone]);
    $chat = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($chat) {
        if ($chat['student_id'] === null) {
            $updateStmt = $conn->prepare("UPDATE chats SET student_id = ? WHERE id = ?");
            $updateStmt->execute([$student_id, $chat['id']]);
        }
        $chatId = (int)$chat['id'];
        echo json_encode([
            "success" => true,
            "status" => "success",
            "message" => "Chat already exists",
            "chat_id" => $chatId,
            "data" => ["chat_id" => $chatId]
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Create new chat
    $insertStmt = $conn->prepare("INSERT INTO chats (student_id, student_name, student_uni, phone, last_msg, status) VALUES (?, ?, ?, ?, ?, 'رسالة جديدة')");
    $insertStmt->execute([
        $student_id,
        $name,
        $uni,
        $phone,
        'مرحباً، أهلاً بك في الدعم الفني المباشر لأبشر'
    ]);
    $chat_id = (int)$conn->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "status" => "success",
        "message" => "Chat created",
        "chat_id" => $chat_id,
        "data" => ["chat_id" => $chat_id]
    ], JSON_UNESCAPED_UNICODE);
    exit();
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        jsonResponse(false, "Invalid student_id or duplicate entry", 400);
    }
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
