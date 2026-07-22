<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/headers.php';

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$identifier = trim($data['identifier'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($identifier) || empty($password)) {
    jsonResponse(false, "Identifier (email or phone) and password are required.", 400);
}

try {
    $query = "SELECT id, full_name, email, phone, university, password, points FROM students WHERE (email = ? OR phone = ?) LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->execute([$identifier, $identifier]);
    
    $student = $stmt->fetch();

    $isValid = false;
    if ($student && !empty($student['password'])) {
        if ($password === $student['password'] || password_verify($password, $student['password'])) {
            $isValid = true;
        }
    }

    if ($isValid) {
        $payload = [
            'student_id' => (int)$student['id'],
            'iat' => time(),
            'exp' => time() + (86400 * 30) // 30 days expiration
        ];
        $token = JWT::encode($payload);

        unset($student['password']); // Remove hash before sending response
        
        jsonResponse(true, "Login successful.", 200, [
            "token" => $token,
            "student" => $student
        ]);
    } else {
        jsonResponse(false, "Invalid credentials.", 401);
    }

} catch (PDOException $e) {
    jsonResponse(false, "DB Error: " . $e->getMessage(), 500);
}
