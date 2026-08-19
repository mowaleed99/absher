<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

AuthMiddleware::requireAuth();

$studentId = AuthMiddleware::$currentUserId;
$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

$currentPassword = $data['current_password'] ?? '';
$newPassword = $data['new_password'] ?? '';

// 1. Policy & Format Validation
if (empty($currentPassword)) {
    jsonResponse(false, "يرجى إدخال كلمة المرور الحالية", 400);
}

$newPasswordLength = strlen($newPassword);
if ($newPasswordLength < 8 || $newPasswordLength > 128) {
    jsonResponse(false, "يجب أن تكون كلمة المرور الجديدة بين 8 و 128 حرفاً", 400);
}

try {
    // 2. Fetch Stored Password Hash
    $stmt = $conn->prepare("SELECT password FROM students WHERE id = ? LIMIT 1");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        jsonResponse(false, "لم يتم العثور على الحساب", 404);
    }

    $storedHash = $student['password'];
    
    // 3. Verify Current Password
    $isValid = false;
    if (password_verify($currentPassword, $storedHash)) {
        $isValid = true;
    } elseif ($currentPassword === $storedHash) {
        // Plaintext fallback for legacy
        $isValid = true;
    }

    if (!$isValid) {
        jsonResponse(false, "كلمة المرور الحالية غير صحيحة", 401);
    }

    // 4. Update with New Hashed Password
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $conn->prepare("UPDATE students SET password = ? WHERE id = ?");
    $updateStmt->execute([$newHash, $studentId]);

    jsonResponse(true, "تم تغيير كلمة المرور بنجاح", 200);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "حدث خطأ أثناء الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.", 500);
}
?>
