<?php
// واجهة برمجة تطبيقات تسجيل الدخول (Login API Endpoint)
require_once __DIR__ . '/../config/db_staging.php';
require_once __DIR__ . '/core/identity_block.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->identifier) && !empty($data->password)) {
    $identifier = trim($data->identifier);
    $password = trim($data->password);

    try {
        // البحث بالبريد الإلكتروني أو رقم الهاتف
        $query = "SELECT id, full_name, email, phone, university, password, is_blocked FROM students WHERE email = :ident1 OR phone = :ident2 LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':ident1', $identifier);
        $stmt->bindParam(':ident2', $identifier);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Block Check
            if (!empty($row['is_blocked']) && (int)$row['is_blocked'] === 1) {
                echo json_encode([
                    "status" => "error",
                    "message" => "تم حظر هذا الحساب من قبل الإدارة. يرجى التواصل مع الدعم الفني."
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Also check persistent blocklist
            $blocked = isIdentityBlocked($conn, $row['email'], $row['phone']);
            if ($blocked) {
                echo json_encode([
                    "status" => "error",
                    "message" => "تم حظر هذا الحساب من قبل الإدارة. يرجى التواصل مع الدعم الفني."
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

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
            // Even if student row is deleted, check if identifier is in persistent blocklist
            $blocked = isSingleIdentifierBlocked($conn, $identifier);
            if ($blocked) {
                echo json_encode([
                    "status" => "error",
                    "message" => "هذا الحساب محظور من قبل الإدارة."
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

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
