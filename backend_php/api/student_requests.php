<?php
// ملف استقبال طلبات الطلاب والحجوزات (Service & Booking Requests API)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/middleware/auth.php'; // Optional auth if needed

$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$action = $_GET['action'] ?? ($input['action'] ?? 'submit');

if ($action === 'get_news') {
    echo json_encode(["status" => "success", "news" => []], JSON_UNESCAPED_UNICODE);
    exit();
}

if ($action === 'get_notifications') {
    try {
        // Fetch all notifications (global + user specific if authenticated)
        // Since Flutter might not pass auth for this legacy endpoint, fetch all for now
        $stmt = $conn->query("SELECT id, title, body as content, created_at as date FROM notifications ORDER BY created_at DESC LIMIT 50");
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "notifications" => $notifications], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(["status" => "success", "notifications" => []], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

if ($action === 'submit') {
    $studentName = trim($input['student_name'] ?? 'طالب أبشر');
    $studentPhone = trim($input['student_phone'] ?? '');
    $studentUni = trim($input['student_uni'] ?? 'جامعة في جورجيا');
    $serviceTitle = trim($input['service_title'] ?? 'طلب خدمة');
    $details = trim($input['details'] ?? '');

    if (empty($studentName) || empty($serviceTitle)) {
        echo json_encode(["status" => "error", "message" => "البيانات المطلوبة غير مكتملة"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    try {
        $stmt = $conn->prepare("INSERT INTO service_requests (student_name, student_phone, service_title, details, status, created_at) VALUES (?, ?, ?, ?, 'قيد المراجعة', NOW())");
        $stmt->execute([$studentName, $studentPhone, $serviceTitle, "الجامعة: " . $studentUni . "\nالتفاصيل: " . $details]);
        
        echo json_encode(["status" => "success", "message" => "تم استلام الطلب بنجاح وسيتم التواصل معك قريباً."], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "حدث خطأ أثناء حفظ الطلب."], JSON_UNESCAPED_UNICODE);
    }
    exit();
}
