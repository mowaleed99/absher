<?php
require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

AuthMiddleware::requireAuth();

$studentId = AuthMiddleware::$currentUserId;
$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$fullName = trim($data['full_name'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$university = trim($data['university'] ?? '');

// 1. Inputs Validation
if (empty($fullName) || strlen($fullName) < 3 || strlen($fullName) > 150) {
    jsonResponse(false, "Full name is required (3-150 characters).", 400);
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
    jsonResponse(false, "A valid email address is required (max 150 characters).", 400);
}

$phone = preg_replace('/[^\+0-9]/', '', $phone);
if (empty($phone) || !preg_match('/^\+?[0-9]{7,20}$/', $phone)) {
    jsonResponse(false, "رقم الهاتف غير صالح. يرجى إدخال رقم هاتف صحيح مع كود الدولة / Invalid phone number.", 400);
}

if (strlen($university) > 150) {
    jsonResponse(false, "University name is too long (max 150 characters).", 400);
}

try {
    // 2. Uniqueness Checks
    $dupStmt = $conn->prepare("SELECT id, email, phone FROM students WHERE (email = ? OR phone = ?) AND id != ? LIMIT 1");
    $dupStmt->execute([$email, $phone, $studentId]);
    $dup = $dupStmt->fetch(PDO::FETCH_ASSOC);

    if ($dup) {
        if (strcasecmp($dup['email'], $email) === 0) {
            jsonResponse(false, "Email is already registered.", 409);
        } else {
            jsonResponse(false, "Phone number is already registered.", 409);
        }
    }

    // 3. Perform Database Update
    $updateStmt = $conn->prepare("UPDATE students SET full_name = ?, email = ?, phone = ?, university = ? WHERE id = ?");
    $updateStmt->execute([$fullName, $email, $phone, $university, $studentId]);

    // Fetch the updated student profile to return
    $fetchStmt = $conn->prepare("SELECT id, full_name, email, phone, university, avatar_url, points AS points_balance, created_at FROM students WHERE id = ? LIMIT 1");
    $fetchStmt->execute([$studentId]);
    $updatedStudent = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    if ($updatedStudent) {
        $updatedStudent['points_balance'] = (int)$updatedStudent['points_balance'];
        $updatedStudent['id'] = (int)$updatedStudent['id'];
    }

    jsonResponse(true, "Profile updated successfully.", 200, ['student' => $updatedStudent]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
?>
