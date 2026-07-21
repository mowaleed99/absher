<?php
// ملف رفع الوسائط والملفات (رفع الصور والفيديوهات)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uploadDir = __DIR__ . '/../uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

try {
    if (isset($_FILES['file']) && $_FILES['file']['error'] !== UPLOAD_ERR_OK && $_FILES['file']['error'] !== UPLOAD_ERR_NO_FILE) {
        $errCode = $_FILES['file']['error'];
        $errMsg = "فشل في رفع الملف (رمز الخطأ: $errCode)";
        if ($errCode === UPLOAD_ERR_INI_SIZE || $errCode === UPLOAD_ERR_FORM_SIZE) {
            $errMsg = "حجم الصورة كبير جداً وتجاوز الحد المسموح به في الخادم (2MB). يرجى اختيار صورة أصغر أو ضغطها أولاً.";
        }
        echo json_encode(["status" => "error", "message" => $errMsg], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        // إذا تم إرسال ملف كـ base64 أو عبر POST raw
        $input = json_decode(file_get_contents("php://input"), true);
        if (isset($input['base64']) && isset($input['filename'])) {
            $data = base64_decode(preg_replace('#^data:[\w/]+;base64,#i', '', $input['base64']));
            $ext = pathinfo($input['filename'], PATHINFO_EXTENSION) ?: 'png';
            $newFilename = 'upload_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
            $targetPath = $uploadDir . $newFilename;
            file_put_contents($targetPath, $data);
            
            $fileUrl = 'uploads/' . $newFilename;
            echo json_encode(["status" => "success", "url" => $fileUrl, "message" => "تم رفع الملف بنجاح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        echo json_encode(["status" => "error", "message" => "لم يتم استلام أي ملف للرفع"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $file = $_FILES['file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    $allowedImages = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $allowedVideos = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'];
    $allowedExts = array_merge($allowedImages, $allowedVideos);

    if (!in_array($ext, $allowedExts)) {
        echo json_encode(["status" => "error", "message" => "نوع الملف غير مدعوم ($ext)"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $newFilename = 'upload_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $targetPath = $uploadDir . $newFilename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $fileUrl = 'uploads/' . $newFilename;
        $isVid = in_array($ext, $allowedVideos);
        echo json_encode([
            "status" => "success",
            "url" => $fileUrl,
            "type" => $isVid ? "video" : "image",
            "message" => "تم رفع الملف بنجاح"
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(["status" => "error", "message" => "فشل حفظ الملف على الخادم"], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "خطأ أثناء الرفع: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
