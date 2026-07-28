<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

AuthMiddleware::requireAuth();

$studentId = AuthMiddleware::$currentUserId;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Method not allowed", 405);
}

$file = $_FILES['image'] ?? $_FILES['file'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(false, "No valid image file uploaded.", 400);
}

// 1. File size verification: 5MB limit
if ($file['size'] > 5 * 1024 * 1024) {
    jsonResponse(false, "File too large. Maximum 5MB allowed.", 400);
}

// 2. MIME type verification
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed_mimes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp'
];

if (!array_key_exists($mime, $allowed_mimes)) {
    jsonResponse(false, "Invalid file type. Only JPG, PNG, and WEBP are allowed.", 400);
}
$ext = $allowed_mimes[$mime];

// 3. Prepare target directories and filenames
$filename = uniqid('avatar_') . '_' . rand(1000, 9999) . '.' . $ext;
$upload_dir = __DIR__ . '/../../uploads/profiles/';

if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        jsonResponse(false, "Failed to create upload directory.", 500);
    }
}
$target_file = $upload_dir . $filename;

// 4. Save new file to disk (with optional GD scaling to keep avatars small: max 800px)
$saved = false;
$max_dim = 800;

if (function_exists('imagecreatefromstring')) {
    list($width, $height) = @getimagesize($file['tmp_name']) ?: [0, 0];
    if ($width > 0 && $height > 0) {
        $ratio = 1;
        if ($width > $max_dim || $height > $max_dim) {
            $ratio = min($max_dim / $width, $max_dim / $height);
        }
        $new_width = round($width * $ratio);
        $new_height = round($height * $ratio);

        $src_img = @imagecreatefromstring(file_get_contents($file['tmp_name']));
        if ($src_img !== false) {
            $dst_img = imagecreatetruecolor($new_width, $new_height);
            
            // Retain transparency for PNG/WEBP
            if ($mime == 'image/png' || $mime == 'image/webp') {
                imagealphablending($dst_img, false);
                imagesavealpha($dst_img, true);
                $transparent = imagecolorallocatealpha($dst_img, 255, 255, 255, 127);
                imagefilledrectangle($dst_img, 0, 0, $new_width, $new_height, $transparent);
            }
            
            imagecopyresampled($dst_img, $src_img, 0, 0, 0, 0, $new_width, $new_height, $width, $height);

            if ($mime == 'image/jpeg') {
                $saved = @imagejpeg($dst_img, $target_file, 85);
            } elseif ($mime == 'image/png') {
                $saved = @imagepng($dst_img, $target_file, 8);
            } elseif ($mime == 'image/webp') {
                $saved = @imagewebp($dst_img, $target_file, 85);
            }
            imagedestroy($src_img);
            imagedestroy($dst_img);
        }
    }
}

// Fallback to simple move if GD fails or is missing
if (!$saved) {
    if (!move_uploaded_file($file['tmp_name'], $target_file)) {
        jsonResponse(false, "Failed to save avatar file.", 500);
    }
    $saved = true;
}

chmod($target_file, 0644);

// 5. Verify upload succeeded and exists on disk
if (!$saved || !file_exists($target_file) || filesize($target_file) === 0) {
    if (file_exists($target_file)) {
        unlink($target_file);
    }
    jsonResponse(false, "Image upload verification failed.", 500);
}

// 6. DB transaction / safe update & clean old avatar
$new_avatar_url = "uploads/profiles/" . $filename;
try {
    // Query database for old avatar path
    $stmt = $conn->prepare("SELECT avatar_url FROM students WHERE id = ? LIMIT 1");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    $old_avatar_url = $student ? $student['avatar_url'] : null;

    // Update database record to point to new avatar URL
    $updateStmt = $conn->prepare("UPDATE students SET avatar_url = ? WHERE id = ?");
    $updateStmt->execute([$new_avatar_url, $studentId]);

    // Success! Database updated. We can now safely clean up the old file
    if (!empty($old_avatar_url)) {
        $old_file_path = __DIR__ . '/../../' . $old_avatar_url;
        
        // Prevent directory traversal: make sure path lies within the uploads directory
        $real_old_path = realpath($old_file_path);
        $real_uploads_path = realpath(__DIR__ . '/../../uploads/');
        
        if ($real_old_path && $real_uploads_path && strpos($real_old_path, $real_uploads_path) === 0) {
            if (file_exists($real_old_path) && is_file($real_old_path)) {
                unlink($real_old_path);
            }
        }
    }

    jsonResponse(true, "Avatar uploaded successfully.", 200, [
        "avatar_url" => $new_avatar_url
    ]);

} catch (Exception $e) {
    // Cleanup the new file to keep state intact on database error
    if (file_exists($target_file)) {
        unlink($target_file);
    }
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database update failed. Image was not updated.", 500);
}
?>
