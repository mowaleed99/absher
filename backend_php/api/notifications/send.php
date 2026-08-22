<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../core/fcm_service.php';
require_once __DIR__ . '/../core/notification.php';
require_once __DIR__ . '/../middleware/auth_middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Method not allowed", 405);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$studentId = isset($input['student_id']) ? intval($input['student_id']) : 0;
$title = trim($input['title'] ?? '');
$body = trim($input['body'] ?? '');
$type = trim($input['type'] ?? 'general');
$data = isset($input['data']) && is_array($input['data']) ? $input['data'] : [];

if (empty($title) || empty($body)) {
    jsonResponse(false, "Title and body are required", 400);
    exit();
}

if ($studentId > 0) {
    // Send to specific student
    $success = sendStudentNotification($studentId, $title, $body, $type, $data);
    jsonResponse($success, $success ? "Notification sent successfully" : "Failed to send notification", $success ? 200 : 500);
} else {
    // Broadcast to all students
    $result = FcmService::sendToAllStudents($title, $body, array_merge($data, ['type' => $type]));
    jsonResponse(true, "Broadcast notifications sent", 200, $result);
}
