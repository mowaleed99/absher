<?php
// Legacy registration thin wrapper
require_once __DIR__ . '/../config/db_staging.php';
require_once __DIR__ . '/auth/register_helper.php';

$data = json_decode(file_get_contents("php://input"));

$fullName = trim($data->full_name ?? '');
$email = trim($data->email ?? '');
$phone = trim($data->phone ?? '');
$password = trim($data->password ?? '');
$university = !empty($data->university) ? trim($data->university) : 'جامعة في جورجيا';

$result = performRegistration($conn, $fullName, $email, $phone, $password, $university);

if ($result['success']) {
    $student = $result['data']['student'];
    echo json_encode([
        "status" => "success",
        "message" => "تم إنشاء حسابك بنجاح في تطبيق أبشر",
        "user" => [
            "id" => $student['id'],
            "name" => $student['full_name'],
            "email" => $student['email'],
            "phone" => $student['phone'],
            "uni" => $student['university'],
            "is_guest" => false
        ]
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "status" => "error",
        "message" => $result['message']
    ], JSON_UNESCAPED_UNICODE);
}
?>
