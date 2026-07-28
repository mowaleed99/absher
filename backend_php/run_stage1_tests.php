<?php
// Enforce command-line execution only
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain');
    echo "Forbidden: This script can only be run via CLI.\n";
    exit(1);
}

// PHP Script to test Track 4 Backend Endpoints & Security Scenarios
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config/db.php';

$baseUrl = "http://127.0.0.1:8000/api";

echo "=== STARTING PROFILE OVERHAUL BACKEND TESTS ===\n\n";

function makePostRequest($url, $data = [], $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    $defaultHeaders = ['Content-Type: application/json'];
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($defaultHeaders, $headers));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $httpCode, 'body' => json_decode($response, true), 'raw' => $response];
}

function makeGetRequest($url, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $httpCode, 'body' => json_decode($response, true), 'raw' => $response];
}

function makeMultipartPostRequest($url, $filePath, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    
    $cfile = new CURLFile($filePath, 'image/jpeg', 'avatar.jpg');
    $data = ['image' => $cfile];
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $httpCode, 'body' => json_decode($response, true), 'raw' => $response];
}

$uniq = time() . "_" . rand(10, 99);
$testName = "Test User " . $uniq;
$testEmail = "test_" . $uniq . "@absher.ge";
$testPhone = "+995555" . rand(100000, 999999);
$testPass = "securePassword123";

// --- SECTION I: REGISTRATION & GENERAL PROFILE VALIDATIONS ---

// 1. Test registration with password policy failure (< 8 chars)
echo "1. Testing password policy limit (< 8 characters)... ";
$res = makePostRequest("$baseUrl/auth/register.php", [
    'full_name' => $testName,
    'email' => $testEmail,
    'phone' => $testPhone,
    'password' => "short1",
    'university' => 'TSMU'
]);
if ($res['code'] === 400 && $res['body']['success'] === false) {
    echo "PASS (Returned 400, message: {$res['body']['message']})\n";
} else {
    echo "FAIL (Code: {$res['code']}, Body: " . json_encode($res['body']) . ")\n";
    exit(1);
}

// 2. Test valid registration
echo "2. Testing valid registration... ";
$res = makePostRequest("$baseUrl/auth/register.php", [
    'full_name' => $testName,
    'email' => $testEmail,
    'phone' => $testPhone,
    'password' => $testPass,
    'university' => 'جامعة تبليسي الطبية (TSMU)'
]);
if ($res['code'] === 201 && isset($res['body']['data']['token'])) {
    $token = $res['body']['data']['token'];
    $registeredStudentId = (int)$res['body']['data']['student']['id'];
    echo "PASS (Successfully registered, JWT issued)\n";
} else {
    echo "FAIL (Code: {$res['code']}, Body: " . json_encode($res['body']) . ")\n";
    exit(1);
}

// 3. Test duplicate registration (Email/Phone uniqueness)
echo "3. Testing registration duplicate uniqueness check... ";
$res2 = makePostRequest("$baseUrl/auth/register.php", [
    'full_name' => "Another Name",
    'email' => $testEmail,
    'phone' => $testPhone,
    'password' => $testPass,
    'university' => 'TSMU'
]);
if ($res2['code'] === 409 && $res2['body']['success'] === false) {
    echo "PASS (Returned 409 Conflict, message: {$res2['body']['message']})\n";
} else {
    echo "FAIL (Code: {$res2['code']}, Body: " . json_encode($res2['body']) . ")\n";
    exit(1);
}

// 4. Test student login
echo "4. Testing student login... ";
$loginRes = makePostRequest("$baseUrl/auth/login.php", [
    'identifier' => $testEmail,
    'password' => $testPass
]);
if ($loginRes['code'] === 200 && isset($loginRes['body']['data']['token'])) {
    echo "PASS (Successfully authenticated)\n";
} else {
    echo "FAIL (Code: {$loginRes['code']}, Body: " . json_encode($loginRes['body']) . ")\n";
    exit(1);
}

// 5. Test Profile GET endpoint
echo "5. Testing profile fetching (GET /api/profile/get.php)... ";
$profileRes = makeGetRequest("$baseUrl/profile/get.php", [
    "Authorization: Bearer $token"
]);
if ($profileRes['code'] === 200 && $profileRes['body']['success'] === true && isset($profileRes['body']['data']['student'])) {
    $student = $profileRes['body']['data']['student'];
    if ($student['email'] === $testEmail && array_key_exists('avatar_url', $student)) {
        echo "PASS (Profile fields matching: {$student['full_name']})\n";
    } else {
        echo "FAIL (Incorrect fields or missing avatar_url)\n";
        exit(1);
    }
} else {
    echo "FAIL (Code: {$profileRes['code']}, Body: " . json_encode($profileRes['body']) . ")\n";
    exit(1);
}

// 6. Test Profile GET without JWT Authorization
echo "6. Testing profile fetching without token authorization... ";
$profileResNoAuth = makeGetRequest("$baseUrl/profile/get.php");
if ($profileResNoAuth['code'] === 401 && $profileResNoAuth['body']['success'] === false) {
    echo "PASS (Access denied cleanly)\n";
} else {
    echo "FAIL (Access not rejected: Code {$profileResNoAuth['code']})\n";
    exit(1);
}

// 7. Test Profile Update
echo "7. Testing profile update text fields... ";
$newTestName = $testName . " Mod";
$newTestPhone = "+995555" . rand(100000, 999999);
$updateRes = makePostRequest("$baseUrl/profile/update.php", [
    'full_name' => $newTestName,
    'email' => $testEmail,
    'phone' => $newTestPhone,
    'university' => 'جامعة جورجيا (UG)'
], ["Authorization: Bearer $token"]);
if ($updateRes['code'] === 200 && $updateRes['body']['data']['student']['full_name'] === $newTestName && $updateRes['body']['data']['student']['university'] === 'جامعة جورجيا (UG)') {
    echo "PASS (Text fields updated successfully)\n";
} else {
    echo "FAIL (Code: {$updateRes['code']}, Body: " . json_encode($updateRes['body']) . ")\n";
    exit(1);
}

// 8. Test Password Change
echo "8. Testing profile password change flow... ";
$newTestPass = "newSuperSecretPassword128";
$passRes = makePostRequest("$baseUrl/profile/change_password.php", [
    'current_password' => $testPass,
    'new_password' => $newTestPass
], ["Authorization: Bearer $token"]);
if ($passRes['code'] === 200 && $passRes['body']['success'] === true) {
    echo "PASS (Password modified successfully)\n";
} else {
    echo "FAIL (Code: {$passRes['code']}, Body: " . json_encode($passRes['body']) . ")\n";
    exit(1);
}

// 9. Verify Login with new password
echo "9. Verifying login with updated password... ";
$loginNewRes = makePostRequest("$baseUrl/auth/login.php", [
    'identifier' => $testEmail,
    'password' => $newTestPass
]);
if ($loginNewRes['code'] === 200) {
    echo "PASS (Successfully logged in with new password hash)\n";
} else {
    echo "FAIL (Could not login with new password hash)\n";
    exit(1);
}

// 10. Test legacy register thin wrapper
echo "10. Testing legacy register wrapper compatibility... ";
$legacyUniq = time() . "_" . rand(100, 999);
$legacyEmail = "legacy_" . $legacyUniq . "@absher.ge";
$legacyPhone = "+995555" . rand(100000, 999999);
$legacyRes = makePostRequest("$baseUrl/register.php", [
    'full_name' => "Legacy Wrapper User",
    'email' => $legacyEmail,
    'phone' => $legacyPhone,
    'password' => $newTestPass,
    'university' => 'جامعة القوقاز'
]);

// Cleanup the legacy student inserted
if ($legacyRes['code'] === 200 && isset($legacyRes['body']['user']['id'])) {
    $legacyId = intval($legacyRes['body']['user']['id']);
    $conn->exec("DELETE FROM students WHERE id = $legacyId");
    echo "PASS (Legacy output structure mapped successfully)\n";
} else {
    echo "FAIL (Code: {$legacyRes['code']}, Body: " . json_encode($legacyRes['body']) . ")\n";
    exit(1);
}


// --- SECTION II: TIMING-SAFE LAZY PASSWORD MIGRATION VERIFICATION ---

echo "\n--- TESTING PASSWORD LAZY MIGRATION SCENARIOS ---\n";

// 1. Legacy Student plain password verification
echo "11. Testing student legacy plain login & automatic hashing...\n";

$plainStudentEmail = "plain_stud_" . $uniq . "@absher.ge";
$plainStudentPhone = "+995599" . rand(100000, 999999);
$plainPasswordVal = "legacyPlainPassword123";

// Directly insert legacy plaintext student
$conn->prepare("INSERT INTO students (full_name, email, phone, password, university) VALUES (?, ?, ?, ?, ?)")
     ->execute(["Legacy Plain Student", $plainStudentEmail, $plainStudentPhone, $plainPasswordVal, "TSMU"]);
$plainStudentId = $conn->lastInsertId();

// Verify stored value is plaintext (password_get_info returns algorithmName unknown)
$verifyPlain = $conn->query("SELECT password FROM students WHERE id = $plainStudentId")->fetchColumn();
$infoBefore = password_get_info($verifyPlain);
if ($infoBefore['algoName'] !== 'unknown') {
    echo "   [FAIL] Seeded password is not plaintext.\n";
    exit(1);
}
echo "   - Plaintxt check pre-login: OK (Stored: $verifyPlain)\n";

// Attempt login using legacy plain credential (triggers timing-safe hash-on-login)
$legacyLoginRes = makePostRequest("$baseUrl/auth/login.php", [
    'identifier' => $plainStudentEmail,
    'password' => $plainPasswordVal
]);

if ($legacyLoginRes['code'] !== 200) {
    echo "   [FAIL] Plain login failed (Code: {$legacyLoginRes['code']})\n";
    exit(1);
}
echo "   - Plain password login request: OK (HTTP 200)\n";

// Query DB to verify it upgraded to a valid hash
$verifyHashed = $conn->query("SELECT password FROM students WHERE id = $plainStudentId")->fetchColumn();
$infoAfter = password_get_info($verifyHashed);
if ($infoAfter['algoName'] === 'unknown') {
    echo "   [FAIL] Password did not get hashed on successful login.\n";
    exit(1);
}
echo "   - Upgraded password check: OK (Algorithm: {$infoAfter['algoName']})\n";

// Log in again - should succeed via password_verify() flow
$legacyLoginRes2 = makePostRequest("$baseUrl/auth/login.php", [
    'identifier' => $plainStudentEmail,
    'password' => $plainPasswordVal
]);
if ($legacyLoginRes2['code'] !== 200) {
    echo "   [FAIL] Second login failed with the upgraded hash.\n";
    exit(1);
}
echo "   - Second login request: OK (HTTP 200)\n";

// Verify hash remained identical (was not re-hashed)
$verifyHashedAgain = $conn->query("SELECT password FROM students WHERE id = $plainStudentId")->fetchColumn();
if ($verifyHashed !== $verifyHashedAgain) {
    echo "   [FAIL] Upgraded password got re-hashed on second login.\n";
    exit(1);
}
echo "   - Hash identity confirmation: OK (No re-hash)\n";

// Verify wrong password is rejected
$legacyLoginWrong = makePostRequest("$baseUrl/auth/login.php", [
    'identifier' => $plainStudentEmail,
    'password' => "wrongPasswordHere"
]);
if ($legacyLoginWrong['code'] !== 401) {
    echo "   [FAIL] Plain login accepted invalid credentials.\n";
    exit(1);
}
echo "   - Invalid password login request: OK (HTTP 401 Unauthorized)\n";

// Clean up plain student
$conn->exec("DELETE FROM students WHERE id = $plainStudentId");
echo "   -> Student legacy migration tests: PASS\n";


// 2. Legacy Admin plain password verification
echo "12. Testing admin legacy plain login & automatic hashing...\n";

$plainAdminUsername = "plain_adm_" . $uniq;
$plainAdminEmail = "plain_adm_" . $uniq . "@absher.ge";
$plainAdminPasswordVal = "legacyPlainAdmin123";

// Directly insert legacy plaintext admin
$conn->prepare("INSERT INTO admins (username, email, password, role) VALUES (?, ?, ?, 'super_admin')")
     ->execute([$plainAdminUsername, $plainAdminEmail, $plainAdminPasswordVal]);
$plainAdminId = $conn->lastInsertId();

// Verify stored value is plaintext
$verifyPlainAdmin = $conn->query("SELECT password FROM admins WHERE id = $plainAdminId")->fetchColumn();
$infoAdminBefore = password_get_info($verifyPlainAdmin);
if ($infoAdminBefore['algoName'] !== 'unknown') {
    echo "   [FAIL] Seeded admin password is not plaintext.\n";
    exit(1);
}
echo "   - Plaintxt check pre-login: OK (Stored: $verifyPlainAdmin)\n";

// Login admin using legacy plain credential (triggers timing-safe admin hash-on-login)
$legacyAdminLoginRes = makePostRequest("$baseUrl/admin/login.php", [
    'identifier' => $plainAdminUsername,
    'password' => $plainAdminPasswordVal
]);

if ($legacyAdminLoginRes['code'] !== 200) {
    echo "   [FAIL] Plain admin login failed (Code: {$legacyAdminLoginRes['code']})\n";
    exit(1);
}
echo "   - Plain password admin login: OK (HTTP 200)\n";

// Query DB to verify admin password upgraded to valid hash
$verifyHashedAdmin = $conn->query("SELECT password FROM admins WHERE id = $plainAdminId")->fetchColumn();
$infoAdminAfter = password_get_info($verifyHashedAdmin);
if ($infoAdminAfter['algoName'] === 'unknown') {
    echo "   [FAIL] Admin password did not get hashed on successful login.\n";
    exit(1);
}
echo "   - Upgraded admin password check: OK (Algorithm: {$infoAdminAfter['algoName']})\n";

// Log in admin again - should succeed via password_verify() flow
$legacyAdminLoginRes2 = makePostRequest("$baseUrl/admin/login.php", [
    'identifier' => $plainAdminUsername,
    'password' => $plainAdminPasswordVal
]);
if ($legacyAdminLoginRes2['code'] !== 200) {
    echo "   [FAIL] Second login failed with the upgraded admin hash.\n";
    exit(1);
}
echo "   - Second admin login request: OK (HTTP 200)\n";

// Verify hash remained identical (was not re-hashed)
$verifyHashedAdminAgain = $conn->query("SELECT password FROM admins WHERE id = $plainAdminId")->fetchColumn();
if ($verifyHashedAdmin !== $verifyHashedAdminAgain) {
    echo "   [FAIL] Upgraded admin password got re-hashed on second login.\n";
    exit(1);
}
echo "   - Hash identity confirmation: OK (No re-hash)\n";

// Verify wrong password is rejected
$legacyAdminLoginWrong = makePostRequest("$baseUrl/admin/login.php", [
    'identifier' => $plainAdminUsername,
    'password' => "wrongPasswordAdmin"
]);
if ($legacyAdminLoginWrong['code'] !== 401) {
    echo "   [FAIL] Admin login accepted invalid credentials.\n";
    exit(1);
}
echo "   - Invalid admin password login request: OK (HTTP 401 Unauthorized)\n";

// Clean up plain admin
$conn->exec("DELETE FROM admins WHERE id = $plainAdminId");
echo "   -> Admin legacy migration tests: PASS\n";


// --- SECTION III: FAIL-SAFE AVATAR REPLACEMENT TESTS ---

echo "\n--- TESTING FAIL-SAFE AVATAR REPLACEMENT SCENARIOS ---\n";

// Use existing test image from workspace
$tempImage = __DIR__ . '/../real_test_image.jpg';
if (!file_exists($tempImage)) {
    $tempImage = tempnam(sys_get_temp_dir(), 'avatar') . '.jpg';
    file_put_contents($tempImage, base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='));
}

// 1. Upload initial avatar (Avatar 1) - success case
echo "13. Uploading initial avatar (Avatar 1)... ";
$uploadRes1 = makeMultipartPostRequest("$baseUrl/profile/upload_avatar.php", $tempImage, [
    "Authorization: Bearer $token"
]);

if ($uploadRes1['code'] === 200 && isset($uploadRes1['body']['data']['avatar_url'])) {
    $avatarUrl1 = $uploadRes1['body']['data']['avatar_url'];
    echo "PASS (Upload 1 succeeded, avatar URL: $avatarUrl1)\n";
} else {
    echo "FAIL (Upload 1 failed: Code {$uploadRes1['code']}, Body: " . json_encode($uploadRes1['body']) . ")\n";
    exit(1);
}

// Verify Avatar 1 file exists on disk
$absoluteAvatarPath1 = __DIR__ . '/' . $avatarUrl1;
if (!file_exists($absoluteAvatarPath1)) {
    echo "FAIL (Avatar file 1 not found on disk: $absoluteAvatarPath1)\n";
    exit(1);
}

// Verify Avatar 1 path exists in database
$dbAvatar1 = $conn->query("SELECT avatar_url FROM students WHERE id = $registeredStudentId")->fetchColumn();
if ($dbAvatar1 !== $avatarUrl1) {
    echo "FAIL (Avatar 1 path not stored in database: DB says $dbAvatar1)\n";
    exit(1);
}
echo "   - Avatar 1 verified on disk and database.\n";


// 2. Forced database update failure (renaming database column)
echo "14. Forcing database error & checking failsafe rollback...\n";

// Rename column avatar_url to avatar_url_buggy to force query exceptions on update
$conn->exec("ALTER TABLE `students` CHANGE COLUMN `avatar_url` `avatar_url_buggy` VARCHAR(255) DEFAULT NULL");
echo "   - Forcing exception: column renamed to avatar_url_buggy.\n";

// Trigger Upload 2 (avatar replacement) -> failsafe sequence should intercept the DB failure
$uploadRes2 = makeMultipartPostRequest("$baseUrl/profile/upload_avatar.php", $tempImage, [
    "Authorization: Bearer $token"
]);

// Restore column avatar_url immediately to avoid database corruption for normal flows
$conn->exec("ALTER TABLE `students` CHANGE COLUMN `avatar_url_buggy` `avatar_url` VARCHAR(255) DEFAULT NULL");
echo "   - Restoring schema: column renamed back to avatar_url.\n";

// Assertions on failure response
if ($uploadRes2['code'] === 500 && $uploadRes2['body']['success'] === false) {
    echo "   - Upload 2 returned correct failsafe HTTP 500.\n";
} else {
    echo "   [FAIL] Upload 2 did not return HTTP 500 on database error. (Code: {$uploadRes2['code']}, Body: " . json_encode($uploadRes2['body']) . ")\n";
    exit(1);
}

// 1. Verify Avatar 2 was NOT saved or was cleaned up from disk.
// How to check: scan the uploads/profiles folder for any newly created avatars
$newFiles = glob(__DIR__ . '/uploads/profiles/*');
$avatar2Exists = false;
$avatar2File = '';
foreach ($newFiles as $file) {
    // If it's a file, not equal to Avatar 1, and created within the last 30 seconds, it's the orphan file
    if (is_file($file) && realpath($file) !== realpath($absoluteAvatarPath1) && (time() - filemtime($file)) < 30) {
        $avatar2Exists = true;
        $avatar2File = $file;
        break;
    }
}

if ($avatar2Exists) {
    echo "   [FAIL] Failsafe failed: Newly uploaded orphan file is still present on disk: $avatar2File\n";
    exit(1);
}
echo "   - Orphaned new file cleanup: OK (File removed from disk)\n";

// 2. Verify Avatar 1 STILL exists on disk (the previous avatar was NOT deleted).
if (file_exists($absoluteAvatarPath1)) {
    echo "   - Original file preservation: OK (Original file remains intact on disk)\n";
} else {
    echo "   [FAIL] Failsafe failed: Previous avatar file was deleted even though update failed!\n";
    exit(1);
}

// 3. Verify database student avatar_url value is still pointing to Avatar 1.
$dbAvatarFinal = $conn->query("SELECT avatar_url FROM students WHERE id = $registeredStudentId")->fetchColumn();
if ($dbAvatarFinal === $avatarUrl1) {
    echo "   - Database record protection: OK (Database still contains $avatarUrl1)\n";
} else {
    echo "   [FAIL] Database contains altered state ($dbAvatarFinal) instead of original avatar URL ($avatarUrl1)\n";
    exit(1);
}

// Clean up student test uploads
if (file_exists($absoluteAvatarPath1)) {
    unlink($absoluteAvatarPath1);
}
// Clean up registered student
$conn->exec("DELETE FROM students WHERE id = $registeredStudentId");

// Cleanup dynamically created temp files (if any fallback was written)
if (file_exists($tempImage) && strpos($tempImage, 'real_test_image.jpg') === false) {
    unlink($tempImage);
}

echo "\n=== ALL STAGE 1 BACKEND TESTS PASSED SUCCESSFULLY ===\n";
?>
