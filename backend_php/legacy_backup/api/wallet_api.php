<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$action = $_GET['action'] ?? ($input['action'] ??'');
$student_id = $input['student_id'] ?? $_GET['student_id'] ?? null;

$jsonFile = __DIR__ .'/../admin/database.json';
if (!file_exists($jsonFile)) {
    echo json_encode(["status"=>"error","message"=>"Database not found"], JSON_UNESCAPED_UNICODE);
    exit();
}
$dbData = json_decode(file_get_contents($jsonFile), true);

if ($action ==='get_wallet') {
    if (!$student_id) {
        echo json_encode(["status"=>"error","message"=>"student_id is required"], JSON_UNESCAPED_UNICODE);
        exit();
    }
    $points = 0;
    foreach ($dbData['students'] as $s) {
        if ((string)$s['id'] === (string)$student_id) {
            $points = $s['points'] ?? 0;
            break;
        }
    }

    $notifications = [];
    if (isset($dbData['notifications'])) {
        foreach ($dbData['notifications'] as $n) {
            if (!isset($n['student_id']) || (string)$n['student_id'] === (string)$student_id) {
                $notifications[] = $n;
            }
        }
    }

    echo json_encode(["status"=>"success","points"=> $points,"notifications"=> array_values($notifications)], JSON_UNESCAPED_UNICODE);
    exit();
}

if ($action ==='get_universities') {
    echo json_encode(["status"=>"success","universities"=> $dbData['universities'] ?? []], JSON_UNESCAPED_UNICODE);
    exit();
}

if ($action ==='get_districts') {
    echo json_encode(["status"=>"success","districts"=> $dbData['districts'] ?? []], JSON_UNESCAPED_UNICODE);
    exit();
}

if ($action ==='pay_with_points') {
    if (!$student_id) {
        echo json_encode(["status"=>"error","message"=>"student_id is required"], JSON_UNESCAPED_UNICODE);
        exit();
    }
    $amount = (int)($input['amount'] ?? 0);
    $serviceTitle = $input['service_title'] ??'خدمة';
    
    if ($amount <= 0) {
        echo json_encode(["status"=>"error","message"=>"Invalid amount"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $success = false;
    foreach ($dbData['students'] as &$s) {
        if ((string)$s['id'] === (string)$student_id) {
            $currentPoints = $s['points'] ?? 0;
            if ($currentPoints >= $amount) {
                $s['points'] = $currentPoints - $amount;
                $success = true;
                
                $notifTitle ='سحب نقاط';
                $notifText ="تم خصم {$amount} نقطة من محفظتك. السبب: سداد رسوم {$serviceTitle}";
                
                if (!isset($dbData['notifications'])) $dbData['notifications'] = [];
                array_unshift($dbData['notifications'], ["id"=> time(),"student_id"=> $student_id,"title"=> $notifTitle,"content"=> $notifText,"date"=>'الآن']);
            }
            break;
        }
    }

    if ($success) {
        file_put_contents($jsonFile, json_encode($dbData, JSON_UNESCAPED_UNICODE));
        echo json_encode(["status"=>"success","message"=>"تم الخصم والدفع بنجاح"], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(["status"=>"error","message"=>"رصيد النقاط غير كافٍ"], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

echo json_encode(["status"=>"error","message"=>"Unknown action"], JSON_UNESCAPED_UNICODE);
?>
