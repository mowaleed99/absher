<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

AuthMiddleware::requireAuth();

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$service_request_id = $data['service_request_id'] ?? null;
$student_id = AuthMiddleware::$currentUserId;

if (!$service_request_id) {
    jsonResponse(false, "service_request_id is required", 400);
}

try {
    $conn->beginTransaction();

    // 1 & 2. Verify service_request belongs to authenticated student, and get service info
    $stmt = $conn->prepare("
        SELECT sr.id as request_id, sr.status, s.price_points 
        FROM service_requests sr
        JOIN services s ON sr.service_id = s.id
        WHERE sr.id = ? AND sr.student_id = ? 
        FOR UPDATE
    ");
    $stmt->execute([$service_request_id, $student_id]);
    $requestData = $stmt->fetch();

    if (!$requestData) {
        $conn->rollBack();
        jsonResponse(false, "Service request not found or unauthorized", 404);
    }

    if ($requestData['status'] !== 'pending') {
        $conn->rollBack();
        jsonResponse(false, "Service request is already paid or processed", 400);
    }

    $price_points = (int)$requestData['price_points'];

    // 4. Lock student row & 5. Verify balance
    $stmt = $conn->prepare("SELECT points_balance FROM students WHERE id = ? FOR UPDATE");
    $stmt->execute([$student_id]);
    $studentData = $stmt->fetch();

    if (!$studentData || $studentData['points_balance'] < $price_points) {
        $conn->rollBack();
        jsonResponse(false, "Insufficient balance", 400);
    }

    // 6. Deduct points
    $new_balance = $studentData['points_balance'] - $price_points;
    $stmt = $conn->prepare("UPDATE students SET points_balance = ? WHERE id = ?");
    $stmt->execute([$new_balance, $student_id]);

    // 7. Insert wallet_transactions
    $stmt = $conn->prepare("INSERT INTO wallet_transactions (student_id, amount, transaction_type, reason, service_request_id) VALUES (?, ?, 'debit', 'Service Payment', ?)");
    $stmt->execute([$student_id, $price_points, $service_request_id]);

    // 8. Update service_request status
    $stmt = $conn->prepare("UPDATE service_requests SET status = 'in_progress' WHERE id = ?");
    $stmt->execute([$service_request_id]);

    $conn->commit();

    jsonResponse(true, "Payment successful", 200, ["new_balance" => $new_balance]);
} catch (PDOException $e) {
    $conn->rollBack();
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
