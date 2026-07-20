<?php
// واجهة برمجة تطبيقات إنشاء حساب طالب جديد (Register API Endpoint)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (($_SERVER['REQUEST_METHOD'] ?? '') == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->full_name) && !empty($data->email) && !empty($data->phone) && !empty($data->password)) {
    $full_name = trim($data->full_name);
    $email = trim($data->email);
    $phone = trim($data->phone);
    $university = !empty($data->university) ? trim($data->university) : 'جامعة في جورجيا';
    
    $jsonFile = __DIR__ . '/../admin/database.json';
    if (!file_exists($jsonFile)) {
        // Create an empty database template
        file_put_contents($jsonFile, json_encode([
            "apartments" => [],
            "services" => [],
            "students" => [],
            "requests" => [],
            "reviews" => [],
            "chats" => [],
            "news" => [],
            "notifications" => [],
            "universities" => [],
            "districts" => []
        ], JSON_UNESCAPED_UNICODE));
    }
    
    $dbData = json_decode(file_get_contents($jsonFile), true);
    if (!isset($dbData['students'])) $dbData['students'] = [];
    
    // Check existing
    foreach ($dbData['students'] as $student) {
        if ($student['email'] == $email || $student['phone'] == $phone) {
            echo json_encode([
                "status" => "error",
                "message" => "البريد الإلكتروني أو رقم الهاتف مسجل بالفعل في نظام أبشر"
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
    
    // Add new
    $new_id = time(); // Use timestamp as ID
    $dbData['students'][] = [
        "id" => $new_id,
        "full_name" => $full_name,
        "email" => $email,
        "phone" => $phone,
        "university" => $university,
        "created_at" => date("Y-m-d H:i")
    ];
    
    file_put_contents($jsonFile, json_encode($dbData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        "status" => "success",
        "message" => "تم إنشاء حسابك بنجاح في تطبيق أبشر",
        "user" => [
            "id" => $new_id,
            "name" => $full_name,
            "email" => $email,
            "phone" => $phone,
            "uni" => $university,
            "is_guest" => false
        ]
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "يرجى تعبئة كافة الحقول المطلوبة"
    ], JSON_UNESCAPED_UNICODE);
}
?>
