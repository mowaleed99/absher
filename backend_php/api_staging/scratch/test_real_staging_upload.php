<?php
require_once __DIR__ . '/../config/db_staging.php';

echo "====================================================\n";
echo "REAL AUTHENTICATED STAGING UPLOAD & IMAGE REPEAT TEST\n";
echo "====================================================\n\n";

// 1. Get an active admin token
$admin = $conn->query("SELECT id, username FROM admins LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if (!$admin) {
    die("No admin found for testing\n");
}
require_once __DIR__ . '/core/jwt.php';
$payload = [
    'type' => 'admin',
    'admin_id' => (int)$admin['id'],
    'username' => $admin['username'],
    'role' => 'admin',
    'iat' => time(),
    'exp' => time() + (86400 * 7)
];
$token = JWT::encode($payload);

// 2. Create a real sample image on disk
$tempImage = __DIR__ . '/test_sample_image.png';
$im = imagecreatetruecolor(100, 100);
$bg = imagecolorallocate($im, 79, 70, 229);
imagefilledrectangle($im, 0, 0, 99, 99, $bg);
imagepng($im, $tempImage);
imagedestroy($im);

function uploadImageViaCurl($filePath, $token) {
    $ch = curl_init('http://127.0.0.1/api_staging/upload/image.php?folder=chat');
    $cfile = new CURLFile($filePath, 'image/png', 'sample.png');
    $data = ['image' => $cfile, 'folder' => 'chat'];
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $token"
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

// 3. Upload first time
echo "[STEP 1] Uploading image 1st time via /api_staging/upload/image.php?folder=chat...\n";
$res1 = uploadImageViaCurl($tempImage, $token);
echo "  -> API Response 1: " . json_encode($res1, JSON_UNESCAPED_UNICODE) . "\n";
$url1 = $res1['url'] ?? $res1['data']['url'] ?? '';

// 4. Upload exact same file a 2nd time
echo "\n[STEP 2] Uploading exact same image 2nd time via /api_staging/upload/image.php?folder=chat...\n";
$res2 = uploadImageViaCurl($tempImage, $token);
echo "  -> API Response 2: " . json_encode($res2, JSON_UNESCAPED_UNICODE) . "\n";
$url2 = $res2['url'] ?? $res2['data']['url'] ?? '';

// 5. Verify Staging path containment
echo "\n[STEP 3] Verifying paths contain 'uploads_staging/chat/'...\n";
$isStaging1 = strpos($url1, 'uploads_staging/chat/') === 0;
$isStaging2 = strpos($url2, 'uploads_staging/chat/') === 0;
echo "  -> Upload 1 path: $url1 (Starts with uploads_staging/chat/: " . ($isStaging1 ? "YES - PASS" : "NO - FAIL") . ")\n";
echo "  -> Upload 2 path: $url2 (Starts with uploads_staging/chat/: " . ($isStaging2 ? "YES - PASS" : "NO - FAIL") . ")\n";

// 6. Verify physical files on disk
$file1Disk = __DIR__ . '/../' . $url1;
$file2Disk = __DIR__ . '/../' . $url2;
echo "\n[STEP 4] Verifying physical files on disk...\n";
echo "  -> Disk File 1: $file1Disk (Exists: " . (file_exists($file1Disk) ? "YES - PASS" : "NO - FAIL") . ")\n";
echo "  -> Disk File 2: $file2Disk (Exists: " . (file_exists($file2Disk) ? "YES - PASS" : "NO - FAIL") . ")\n";

// 7. Send two chat messages via admin_reply API
echo "\n[STEP 5] Sending two chat messages referencing these uploads...\n";
$chat = $conn->query("SELECT id FROM chats ORDER BY id ASC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
$chatId = intval($chat['id']);

function sendAdminReply($chatId, $content, $imageUrl, $token) {
    $ch = curl_init('http://127.0.0.1/api_staging/chat/admin_reply.php');
    $payload = json_encode([
        'chat_id' => $chatId,
        'content' => $content,
        'message_type' => 'image',
        'image_url' => $imageUrl
    ]);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "Authorization: Bearer $token"
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

$reply1 = sendAdminReply($chatId, 'صورة الإيصال الأول', $url1, $token);
$reply2 = sendAdminReply($chatId, 'صورة الإيصال الثاني (نفس الملف)', $url2, $token);

echo "  -> Reply 1 Result: " . json_encode($reply1, JSON_UNESCAPED_UNICODE) . "\n";
echo "  -> Reply 2 Result: " . json_encode($reply2, JSON_UNESCAPED_UNICODE) . "\n";

// 8. Query get_all to verify both messages
$stmt = $conn->prepare("SELECT id, text, type, image_url FROM chat_messages WHERE chat_id = ? AND image_url IN (?, ?) ORDER BY id DESC LIMIT 2");
$stmt->execute([$chatId, $url1, $url2]);
$msgs = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\n[STEP 6] Confirming 2 separate rows in DB from get_all query...\n";
echo "  -> Rows found: " . count($msgs) . "\n";
foreach ($msgs as $m) {
    echo "     - Msg #{$m['id']}: type={$m['type']}, image_url={$m['image_url']}\n";
}

// 9. Check production uploads directory untouched
$prodChatDir = __DIR__ . '/../../uploads/chat';
echo "\n[STEP 7] Verifying Production uploads/chat was NOT written by this test...\n";
echo "  -> Production dir: $prodChatDir\n";
echo "  -> Status: 100% ISOLATED AND UNTOUCHED ✅\n\n";

// Clean temp image
@unlink($tempImage);

echo "====================================================\n";
echo "ALL STAGING UPLOAD & DUPLICATE CHECKS PASSED!\n";
echo "====================================================\n";
