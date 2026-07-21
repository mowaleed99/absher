<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/db.php';

$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$action = $_GET['action'] ?? ($input['action'] ?? '');
$student_id = $input['student_id'] ?? $_GET['student_id'] ?? null;

if ($action === 'get_wallet') {
    if (!$student_id) {
        echo json_encode(["status" => "error", "message" => "student_id is required"], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    $points = 0;
    try {
        $stmt = $conn->prepare("SELECT points FROM students WHERE id = ?");
        $stmt->execute([$student_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $points = (int)$row['points'];
        }

        $notifStmt = $conn->prepare("SELECT id, title, body AS content, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS date FROM notifications WHERE student_id = ? ORDER BY created_at DESC");
        $notifStmt->execute([$student_id]);
        $notifications = $notifStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "points" => $points, "notifications" => $notifications], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "points" => 0, "notifications" => []], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

if ($action === 'get_universities') {
    try {
        $stmt = $conn->query("SELECT id, name FROM universities ORDER BY id DESC");
        $universities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "universities" => $universities], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "universities" => []], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

if ($action === 'get_districts') {
    try {
        $stmt = $conn->query("SELECT id, name FROM districts ORDER BY id DESC");
        $districts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "districts" => $districts], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "districts" => []], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

if ($action === 'pay_with_points') {
    if (!$student_id) {
        echo json_encode(["status" => "error", "message" => "student_id is required"], JSON_UNESCAPED_UNICODE);
        exit();
    }
    $amount = (int)($input['amount'] ?? 0);
    $serviceTitle = $input['service_title'] ?? 'خدمة';
    
    if ($amount <= 0) {
        echo json_encode(["status" => "error", "message" => "Invalid amount"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    try {
        $conn->beginTransaction();

        $updateStmt = $conn->prepare("UPDATE students SET points = points - ? WHERE id = ? AND points >= ?");
        $updateStmt->execute([$amount, $student_id, $amount]);

        if ($updateStmt->rowCount() > 0) {
            $notifTitle = 'سحب نقاط';
            $notifText = "تم خصم {$amount} نقطة من محفظتك. السبب: سداد رسوم {$serviceTitle}";
            
            $insertNotif = $conn->prepare("INSERT INTO notifications (student_id, title, body, created_at) VALUES (?, ?, ?, NOW())");
            $insertNotif->execute([$student_id, $notifTitle, $notifText]);

            $insertTx = $conn->prepare("INSERT INTO wallet_transactions (student_id, amount, type, description, created_at) VALUES (?, ?, 'خصم', ?, NOW())");
            $insertTx->execute([$student_id, $amount, $notifText]);

            $conn->commit();
            echo json_encode(["status" => "success", "message" => "تم الخصم والدفع بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            $conn->rollBack();
            // Check if student doesn't exist or just insufficient balance
            $checkStmt = $conn->prepare("SELECT id FROM students WHERE id = ?");
            $checkStmt->execute([$student_id]);
            if ($checkStmt->rowCount() > 0) {
                echo json_encode(["status" => "error", "message" => "رصيد النقاط غير كافٍ"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status" => "error", "message" => "الطالب غير موجود"], JSON_UNESCAPED_UNICODE);
            }
        }
    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        echo json_encode(["status" => "error", "message" => "حدث خطأ أثناء الدفع"], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

echo json_encode(["status" => "error", "message" => "Unknown action"], JSON_UNESCAPED_UNICODE);
?>
