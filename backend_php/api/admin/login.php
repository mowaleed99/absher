<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/jwt.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$identifier = trim($data['identifier'] ?? '');
$password = $data['password'] ?? '';

if (empty($identifier) || empty($password)) {
    jsonResponse(false, "identifier and password are required", 400);
}

try {
    $cleanId = trim($identifier);
    $stmt = $conn->prepare("SELECT * FROM admins WHERE username = ? OR email = ? OR (? IN ('admin', 'absher', 'root') AND username = 'absher_admin') LIMIT 1");
    $stmt->execute([$cleanId, $cleanId, strtolower($cleanId)]);
    $admin = $stmt->fetch();

    $storedPass = $admin['password_hash'] ?? $admin['password'] ?? '';
    $isValid = false;
    $needsRehash = false;
    if ($admin && !empty($storedPass)) {
        if (password_verify($password, $storedPass)) {
            $isValid = true;
        } elseif (hash_equals($storedPass, $password)) {
            $isValid = true;
            $needsRehash = true;
        }
    }

    if ($isValid) {
        if ($needsRehash) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $updateStmt = $conn->prepare("UPDATE admins SET password = ? WHERE id = ?");
            $updateStmt->execute([$newHash, $admin['id']]);
        }
        $payload = [
            "admin_id" => $admin['id'],
            "role" => $admin['role'],
            "type" => "admin",
            "iat" => time(),
            "exp" => time() + (86400 * 7) // 7 days expiration
        ];
        $token = JWT::encode($payload);

        jsonResponse(true, "Login successful", 200, [
            "token" => $token,
            "admin" => [
                "id" => $admin['id'],
                "username" => $admin['username'],
                "email" => $admin['email'],
                "role" => $admin['role']
            ]
        ]);
    } else {
        jsonResponse(false, "Invalid credentials", 401);
    }
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
