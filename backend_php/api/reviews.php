<?php
// ملف التقييمات والآراء (Reviews API)
require_once __DIR__ . '/../config/db.php';

$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$action = $_GET['action'] ?? ($input['action'] ?? 'get');

try {
    if ($action === 'get') {
        $reviews = $conn->query("SELECT id, student_name, uni, rating, comment, DATE_FORMAT(created_at, '%Y-%m-%d') AS date FROM reviews ORDER BY id DESC")->fetchAll();
        echo json_encode(["status" => "success", "reviews" => $reviews], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'add') {
        $studentName = trim($input['student_name'] ?? 'طالب');
        $uni = trim($input['uni'] ?? 'جامعة في جورجيا');
        $rating = intval($input['rating'] ?? 5);
        $comment = trim($input['comment'] ?? '');

        if (empty($comment)) {
            echo json_encode(["status" => "error", "message" => "نص التقييم مفقود"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO reviews (student_name, uni, rating, comment) VALUES (?, ?, ?, ?)");
        $stmt->execute([$studentName, $uni, $rating, $comment]);

        echo json_encode(["status" => "success", "message" => "تم إضافة تقييمك بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    echo json_encode(["status" => "error", "message" => "إجراء غير معروف"], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "خطأ في الخادم: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
