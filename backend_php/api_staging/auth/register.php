<?php
require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/register_helper.php';

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$fullName = trim($data['full_name'] ?? '');
$password = trim($data['password'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$uni = trim($data['university'] ?? 'جامعة تبليسي الطبية (TSMU)');
$nationality = trim($data['nationality'] ?? 'GE');

$result = performRegistration($conn, $fullName, $email, $phone, $password, $uni, $nationality);

$message = isset($result['message']) ? $result['message'] : '';
$dataResponse = isset($result['data']) ? $result['data'] : [];

jsonResponse($result['success'], $message, $result['code'], $dataResponse);
?>
