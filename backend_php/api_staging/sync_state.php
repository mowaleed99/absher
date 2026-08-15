<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$studentId = intval($_GET['student_id'] ?? ($_POST['student_id'] ?? 0));
$chatId = intval($_GET['chat_id'] ?? ($_POST['chat_id'] ?? 0));

try {
    // 1. Apartments version
    $aptStmt = $conn->query("
        SELECT CONCAT(
            COUNT(*), '_',
            COALESCE(MAX(id), 0), '_',
            COALESCE(
                MAX(GREATEST(
                    COALESCE(created_at, '2026-01-01 00:00:00'),
                    COALESCE(featured_until, '2026-01-01 00:00:00')
                )), 
                '2026-01-01 00:00:00'
            )
        ) FROM apartments
    ");
    $apartmentsVersion = strval($aptStmt->fetchColumn() ?: '0');

    // 2. Services version
    $srvStmt = $conn->query("
        SELECT CONCAT(
            COUNT(*), '_',
            COALESCE(MAX(id), 0), '_',
            COALESCE(MAX(price_points), 0), '_',
            COALESCE(MAX(created_at), '2026-01-01 00:00:00')
        ) FROM services
    ");
    $servicesVersion = strval($srvStmt->fetchColumn() ?: '0');

    // 3. Housing offers version
    $offStmt = $conn->query("
        SELECT CONCAT(
            COUNT(*), '_',
            COALESCE(MAX(id), 0), '_',
            COALESCE(MAX(COALESCE(updated_at, created_at)), '2026-01-01 00:00:00')
        ) FROM housing_offers
    ");
    $offersVersion = strval($offStmt->fetchColumn() ?: '0');

    // 4. News version
    $newsStmt = $conn->query("
        SELECT CONCAT(
            COUNT(*), '_',
            COALESCE(MAX(id), 0), '_',
            COALESCE(MAX(created_at), '2026-01-01 00:00:00')
        ) FROM news
    ");
    $newsVersion = strval($newsStmt->fetchColumn() ?: '0');

    // 5. Requests version
    if ($studentId > 0) {
        $reqStmt = $conn->prepare("
            SELECT CONCAT(
                COUNT(*), '_',
                COALESCE(MAX(id), 0), '_',
                COALESCE(MAX(CONCAT(id, ':', status)), '')
            ) FROM service_requests WHERE student_id = ?
        ");
        $reqStmt->execute([$studentId]);
        $requestsVersion = strval($reqStmt->fetchColumn() ?: '0');
    } else {
        $reqStmt = $conn->query("
            SELECT CONCAT(
                COUNT(*), '_',
                COALESCE(MAX(id), 0), '_',
                COALESCE(MAX(CONCAT(id, ':', status)), '')
            ) FROM service_requests
        ");
        $requestsVersion = strval($reqStmt->fetchColumn() ?: '0');
    }

    // 6. Notifications version
    if ($studentId > 0) {
        $notifStmt = $conn->prepare("
            SELECT CONCAT(
                COUNT(*), '_',
                COALESCE(MAX(id), 0), '_',
                COALESCE(MAX(created_at), '2026-01-01 00:00:00')
            ) FROM notifications WHERE student_id = 0 OR student_id = ?
        ");
        $notifStmt->execute([$studentId]);
        $notificationsVersion = strval($notifStmt->fetchColumn() ?: '0');
    } else {
        $notifStmt = $conn->query("
            SELECT CONCAT(
                COUNT(*), '_',
                COALESCE(MAX(id), 0), '_',
                COALESCE(MAX(created_at), '2026-01-01 00:00:00')
            ) FROM notifications WHERE student_id = 0
        ");
        $notificationsVersion = strval($notifStmt->fetchColumn() ?: '0');
    }

    // 7. Chat version
    $chatVersion = '0';
    if ($chatId > 0) {
        $cStmt = $conn->prepare("SELECT COALESCE(MAX(id), 0) FROM chat_messages WHERE chat_id = ?");
        $cStmt->execute([$chatId]);
        $chatVersion = strval($cStmt->fetchColumn() ?: '0');
    } elseif ($studentId > 0) {
        $cStmt = $conn->prepare("
            SELECT COALESCE(MAX(m.id), 0) 
            FROM chat_messages m
            JOIN chats c ON m.chat_id = c.id
            WHERE c.student_id = ?
        ");
        $cStmt->execute([$studentId]);
        $chatVersion = strval($cStmt->fetchColumn() ?: '0');
    }

    // 8. Student profile metadata
    $studentData = null;
    if ($studentId > 0) {
        $sStmt = $conn->prepare("SELECT points, is_blocked, admin_status FROM students WHERE id = ? LIMIT 1");
        $sStmt->execute([$studentId]);
        $sRow = $sStmt->fetch(PDO::FETCH_ASSOC);
        if ($sRow) {
            $studentData = [
                "points" => intval($sRow['points'] ?? 0),
                "is_blocked" => intval($sRow['is_blocked'] ?? 0) === 1,
                "admin_status" => $sRow['admin_status'] ?? 'نشط'
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "timestamp" => time(),
        "versions" => [
            "apartments" => $apartmentsVersion,
            "services" => $servicesVersion,
            "housing_offers" => $offersVersion,
            "news" => $newsVersion,
            "requests" => $requestsVersion,
            "notifications" => $notificationsVersion,
            "chat" => $chatVersion
        ],
        "student" => $studentData
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Sync state check failed: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
