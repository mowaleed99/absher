<?php
require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/headers.php';
require_once __DIR__ . '/../core/identity_block.php';

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$identifier = trim($data['identifier'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($identifier) || empty($password)) {
    jsonResponse(false, "Identifier (email or phone) and password are required.", 400);
}

try {
    // Check persistent blocklist for identifier
    $blocked = isSingleIdentifierBlocked($conn, $identifier);
    if ($blocked) {
        jsonResponse(false, "Account is blocked by administration.", 403);
    }

    $query = "SELECT id, full_name, email, phone, university, nationality, password, points, is_blocked FROM students WHERE (email = ? OR phone = ?) LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->execute([$identifier, $identifier]);
    
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        jsonResponse(false, "الحساب غير موجود", 401);
    }

    if (!empty($student['is_blocked']) && (int)$student['is_blocked'] === 1) {
        jsonResponse(false, "Account is blocked by administration.", 403);
    }

    $isValid = false;
    $needsRehash = false;
    if (!empty($student['password'])) {
        if (password_verify($password, $student['password'])) {
            $isValid = true;
        } elseif (hash_equals($student['password'], $password)) {
            $isValid = true;
            $needsRehash = true;
        }
    }

    if ($isValid) {
        if ($needsRehash) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $updateStmt = $conn->prepare("UPDATE students SET password = ? WHERE id = ?");
            $updateStmt->execute([$newHash, $student['id']]);
        }
        $payload = [
            'student_id' => (int)$student['id'],
            'iat' => time(),
            'exp' => time() + (86400 * 30) // 30 days expiration
        ];
        $token = JWT::encode($payload);

        unset($student['password']); // Remove hash before sending response
        unset($student['is_blocked']); // Ensure admin fields are NOT exposed
        
        jsonResponse(true, "Login successful.", 200, [
            "token" => $token,
            "student" => $student
        ]);
    } else {
        jsonResponse(false, "كلمة المرور غير صحيحة.", 401);
    }

} catch (PDOException $e) {
    jsonResponse(false, "DB Error: " . $e->getMessage(), 500);
}
