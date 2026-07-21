<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth(); // Ensure user is authenticated

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$student_id = AuthMiddleware::$currentUserId;
$service_id = $data['service_id'] ?? null;
$details = trim($data['details'] ?? '');

if (!$student_id || !$service_id || empty($details)) {
    jsonResponse(false, "service_id and details are required", 400);
}

try {
    // Verify service exists
    $stmt = $conn->prepare("SELECT id FROM services WHERE id = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$service_id]);
    if (!$stmt->fetch()) {
        jsonResponse(false, "Service not found or inactive", 404);
    }

    $stmt = $conn->prepare("INSERT INTO service_requests (student_id, service_id, status, details) VALUES (?, ?, 'pending', ?)");
    $stmt->execute([$student_id, $service_id, $details]);
    $request_id = $conn->lastInsertId();

    $stmt = $conn->prepare("SELECT * FROM service_requests WHERE id = ?");
    $stmt->execute([$request_id]);
    $created_request = $stmt->fetch();

    jsonResponse(true, "Service request created successfully", 201, ["request" => $created_request]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) { // Integrity constraint violation
        jsonResponse(false, "Invalid student_id or service_id", 400);
    }
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
