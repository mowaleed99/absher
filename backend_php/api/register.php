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

require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->full_name) && !empty($data->email) && !empty($data->phone) && !empty($data->password)) {
    $full_name = trim($data->full_name);
    $email = trim($data->email);
    $phone = trim($data->phone);
    $university = !empty($data->university) ? trim($data->university) : 'جامعة في جورجيا';
    $password = trim($data->password);

    try {
        $checkQuery = "SELECT id, email, phone FROM students WHERE email = :email OR phone = :phone LIMIT 1";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->execute([':email' => $email, ':phone' => $phone]);

        if ($checkStmt->rowCount() > 0) {
            echo json_encode([
                "status" => "error",
                "message" => "البريد الإلكتروني أو رقم الهاتف مسجل بالفعل في نظام أبشر"
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $insertQuery = "INSERT INTO students (full_name, email, phone, university, password, points) VALUES (:full_name, :email, :phone, :university, :password, 0)";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->execute([
            ':full_name' => $full_name,
            ':email' => $email,
            ':phone' => $phone,
            ':university' => $university,
            ':password' => $hashed_password
        ]);

        $new_id = (int)$conn->lastInsertId();

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

    } catch (PDOException $e) {
        echo json_encode([
            "status" => "error",
            "message" => "خطأ في قاعدة البيانات"
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "يرجى تعبئة كافة الحقول المطلوبة"
    ], JSON_UNESCAPED_UNICODE);
}
?>
