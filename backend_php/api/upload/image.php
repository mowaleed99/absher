<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

AuthMiddleware::requireAnyAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Method not allowed", 405);
}

$file = $_FILES['image'] ?? $_FILES['file'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(false, "No valid image file uploaded", 400);
}

$folder = $_POST['folder'] ?? $_GET['folder'] ?? 'general';
$allowed_folders = ['apartments', 'services', 'profiles', 'chat', 'general', 'requests'];

if (!in_array($folder, $allowed_folders)) {
    $folder = 'general';
}

// 1. Check size limit: 50MB
if ($file['size'] > 50 * 1024 * 1024) {
    jsonResponse(false, "File too large. Maximum 50MB allowed.", 400);
}

// 2. MIME type validation using finfo_file
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed_mimes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif'
];

if (!array_key_exists($mime, $allowed_mimes)) {
    // If not in standard images, check if extension is allowed or fallback safely
    $ext_raw = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (in_array($ext_raw, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
        $ext = $ext_raw == 'jpeg' ? 'jpg' : $ext_raw;
    } else {
        jsonResponse(false, "Invalid file type. Only JPG, PNG, WEBP and GIF are allowed.", 400);
    }
} else {
    $ext = $allowed_mimes[$mime];
}

// 3. Generate secure random filename
$filename = uniqid() . '_' . rand(1000, 9999) . '.' . $ext;

// 4. Create directory if missing
$upload_dir = __DIR__ . '/../../uploads/' . $folder . '/';
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        jsonResponse(false, "Failed to create upload directory", 500);
    }
}

$target_file = $upload_dir . $filename;

// 5. Image Processing or safe fallback
$saved = false;
$max_dim = 1920;

if (function_exists('imagecreatefromstring') && $mime !== 'image/gif') {
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

// Fallback to move_uploaded_file if GD processing skipped or failed
if (!$saved) {
    if (!move_uploaded_file($file['tmp_name'], $target_file)) {
        jsonResponse(false, "Failed to save processed image", 500);
    }
}

chmod($target_file, 0644);

// 7. Return dual success JSON format
echo json_encode([
    "success" => true,
    "status" => "success",
    "message" => "Image uploaded successfully",
    "url" => "/uploads/$folder/$filename",
    "data" => [
        "url" => "/uploads/$folder/$filename"
    ]
], JSON_UNESCAPED_UNICODE);
exit();
