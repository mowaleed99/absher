<?php
// واجهة برمجة تطبيقات تسجيل الدخول (Login API Endpoint)
require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->identifier) && !empty($data->password)) {
    $identifier = trim($data->identifier);
    $password = trim($data->password);

    try {
        // البحث بالبريد الإلكتروني أو رقم الهاتف
        $query = "SELECT id, full_name, email, phone, university, password FROM students WHERE email = :ident1 OR phone = :ident2 LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':ident1', $identifier);
        $stmt->bindParam(':ident2', $identifier);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch();
            if (password_verify($password, $row['password']) || $password === $row['password']) {
                // نجاح تسجيل الدخول
                echo json_encode([
                    "status" => "success",
                    "message" => "تم تسجيل الدخول بنجاح",
                    "user" => [
                        "id" => $row['id'],
                        "name" => $row['full_name'],
                        "email" => $row['email'],
                        "phone" => $row['phone'],
                        "uni" => $row['university'],
                        "is_guest" => false
                    ]
                ], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    "status" => "error",
                    "message" => "كلمة المرور غير صحيحة"
                ], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "الحساب غير موجود. تأكد من البريد أو رقم الهاتف أو سجل كطالب جديد."
            ], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "message" => "حدث خطأ في الخادم: " . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "البيانات المطلوبة غير مكتملة"
    ], JSON_UNESCAPED_UNICODE);
}
?>
