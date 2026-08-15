<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/jwt.php';

function performRegistration($conn, $fullName, $email, $phone, $password, $uni, $nationality = null) {
    // 1. Validation Rules
    if (empty($fullName) || strlen($fullName) < 3 || strlen($fullName) > 150) {
        return ["success" => false, "message" => "Full name is required (3-150 characters).", "code" => 400];
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
        return ["success" => false, "message" => "A valid email address is required (max 150 characters).", "code" => 400];
    }

    $phone = preg_replace('/[^\+0-9]/', '', $phone);
    if (empty($phone) || !preg_match('/^\+?[0-9]{7,20}$/', $phone)) {
        return [
            "success" => false, 
            "message" => "رقم الهاتف غير صالح. يرجى إدخال رقم هاتف صحيح مع كود الدولة / Invalid phone number.", 
            "code" => 400
        ];
    }

    $passLen = strlen($password);
    if ($passLen < 8 || $passLen > 128) {
        return ["success" => false, "message" => "Password must be between 8 and 128 characters.", "code" => 400];
    }

    try {
        // 2. Uniqueness Check
        $checkQuery = "SELECT id, email, phone FROM students WHERE email = ? OR phone = ? LIMIT 1";
        $stmt = $conn->prepare($checkQuery);
        $stmt->execute([$email, $phone]);
        $dup = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($dup) {
            if (strcasecmp($dup['email'], $email) === 0) {
                return ["success" => false, "message" => "Email is already registered.", "code" => 409];
            } else {
                return ["success" => false, "message" => "Phone number is already registered.", "code" => 409];
            }
        }

        // 3. Hash Password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // 4. Insert Student
        $insertQuery = "INSERT INTO students (full_name, email, phone, password, university, nationality, points) VALUES (:full_name, :email, :phone, :password, :university, :nationality, 0)";
        $stmt = $conn->prepare($insertQuery);
        $stmt->execute([
            'full_name' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'password' => $passwordHash,
            'university' => $uni,
            'nationality' => $nationality
        ]);

        $studentId = $conn->lastInsertId();

        // 5. Generate JWT Token
        $payload = [
            'student_id' => (int)$studentId,
            'iat' => time(),
            'exp' => time() + (86400 * 30) // 30 days expiration
        ];
        $token = JWT::encode($payload);

        return [
            "success" => true,
            "code" => 201,
            "data" => [
                "token" => $token,
                "student" => [
                    "id" => (int)$studentId,
                    "full_name" => $fullName,
                    "email" => $email,
                    "phone" => $phone,
                    "university" => $uni,
                    "nationality" => $nationality,
                    "avatar_url" => null,
                    "points_balance" => 0
                ]
            ]
        ];

    } catch (PDOException $e) {
        error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
        return ["success" => false, "message" => "Database error occurred. Please try again later.", "code" => 500];
    }
}
?>
