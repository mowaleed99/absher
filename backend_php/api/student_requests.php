<?php
// ملف استقبال طلبات الطلاب والحجوزات (Service & Booking Requests API)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$action = $_GET['action'] ?? ($input['action'] ?? 'submit');

$jsonFile = __DIR__ . '/../admin/database.json';
if (!file_exists($jsonFile)) {
    echo json_encode(["status" => "error", "message" => "قاعدة البيانات غير متوفرة"], JSON_UNESCAPED_UNICODE);
    exit();
}
$dbData = json_decode(file_get_contents($jsonFile), true);
if (!isset($dbData['requests'])) $dbData['requests'] = [];
if (!isset($dbData['chats'])) $dbData['chats'] = [];

if ($action === 'get_news') {
    echo json_encode(["status" => "success", "news" => $dbData['news'] ?? []], JSON_UNESCAPED_UNICODE);
    exit();
}

if ($action === 'get_notifications') {
    echo json_encode(["status" => "success", "notifications" => $dbData['notifications'] ?? []], JSON_UNESCAPED_UNICODE);
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

    $newId = count($dbData['requests']) > 0 ? max(array_column($dbData['requests'], 'id')) + 1 : 1;

    // 1. تسجيل الطلب
    $newRequest = [
        "id" => $newId,
        "student_name" => $studentName,
        "student_phone" => $studentPhone,
        "student_info" => "الجامعة: " . $studentUni . " | الجنسية: أخرى",
        "type" => $serviceTitle,
        "details" => $details,
        "status" => "قيد المراجعة"
    ];
    array_push($dbData['requests'], $newRequest);

    // 2. تحديث الشات
    if (!empty($studentPhone)) {
        $chatFound = false;
        $msgText = "📋 تم تقديم طلب جديد (#" . $newId . "): " . $serviceTitle . "\nالتفاصيل: \n" . $details;
        $replyText = "شكراً لاختياركم أبشر 🌟، نتطلع لخدمتكم وسيتم التواصل معك في خلال وقت قصير جداً للتنسيق والمتابعة.";
        $now = date('h:i A');

        foreach ($dbData['chats'] as &$c) {
            if ($c['phone'] === $studentPhone) {
                $c['last_msg'] = $replyText;
                $c['status'] = 'طلب جديد 🟡';
                $c['time'] = $now;
                if(!isset($c['messages'])) $c['messages'] = [];
                array_push($c['messages'], ["sender" => "student", "text" => $msgText, "time" => $now]);
                array_push($c['messages'], ["sender" => "admin", "text" => $replyText, "time" => $now]);
                $chatFound = true;
                break;
            }
        }

        if (!$chatFound) {
            $newChatId = count($dbData['chats']) > 0 ? max(array_column($dbData['chats'], 'id')) + 1 : 1;
            $newChat = [
                "id" => $newChatId,
                "student_name" => $studentName,
                "student_uni" => $studentUni,
                "phone" => $studentPhone,
                "last_msg" => $replyText,
                "status" => 'طلب جديد 🟡',
                "time" => $now,
                "messages" => [
                    ["sender" => "student", "text" => $msgText, "time" => $now],
                    ["sender" => "admin", "text" => $replyText, "time" => $now]
                ]
            ];
            array_push($dbData['chats'], $newChat);
        }
    }

    file_put_contents($jsonFile, json_encode($dbData, JSON_UNESCAPED_UNICODE));

    echo json_encode([
        "status" => "success",
        "message" => "تم استلام طلبك بنجاح وجاري المراجعة",
        "request_id" => $newId
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

echo json_encode(["status" => "error", "message" => "إجراء غير معروف"], JSON_UNESCAPED_UNICODE);
?>
