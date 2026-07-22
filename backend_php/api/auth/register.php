<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$fullName = trim($data['full_name'] ?? '');
$password = trim($data['password'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');

if (empty($email)) $email = null;
if (empty($phone)) $phone = null;

// Validation
if (empty($fullName) || empty($password)) {
    jsonResponse(false, "Full name and password are required.", 400);
}

if (empty($email) && empty($phone)) {
    jsonResponse(false, "At least one contact method (email or phone) is required.", 400);
}

try {
    // Check for duplicates
    $checkQuery = "SELECT id FROM students WHERE (email = :email AND email IS NOT NULL) OR (phone = :phone AND phone IS NOT NULL) LIMIT 1";
    $stmt = $conn->prepare($checkQuery);
    $stmt->execute(['email' => $email, 'phone' => $phone]);
    
    if ($stmt->fetch()) {
        jsonResponse(false, "Email or phone is already registered.", 409);
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $uni = trim($data['university'] ?? 'TSMU');

    // Insert student
    $insertQuery = "INSERT INTO students (full_name, email, phone, password, university) VALUES (:full_name, :email, :phone, :password, :university)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->execute([
        'full_name' => $fullName,
        'email' => $email,
        'phone' => $phone,
        'password' => $passwordHash,
        'university' => $uni
    ]);

    $studentId = $conn->lastInsertId();

    $payload = [
        'student_id' => (int)$studentId,
        'iat' => time(),
        'exp' => time() + (86400 * 30)
    ];
    $token = JWT::encode($payload);

    jsonResponse(true, "Registration successful.", 201, [
        "token" => $token,
        "student" => [
            "id" => $studentId,
            "full_name" => $fullName,
            "email" => $email,
            "phone" => $phone
        ]
    ]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
