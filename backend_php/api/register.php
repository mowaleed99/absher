<?php
// Legacy registration thin wrapper
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (($_SERVER['REQUEST_METHOD'] ?? '') == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';
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
