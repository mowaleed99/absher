<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/fcm_service.php';

function sendStudentNotification($studentId, $title, $body, $typeOrTitleEn = null, $dataOrBodyEn = []) {
    global $conn;
    $studentId = intval($studentId);
    if ($studentId <= 0) return false;

    $titleAr = $title;
    $bodyAr  = $body;
    $titleEn = '';
    $bodyEn  = '';
    $type    = 'general';
    $payloadData = [];

    // Check whether 4th and 5th parameters are (titleEn, bodyEn) or (type, dataArray)
    if (is_array($dataOrBodyEn)) {
        $payloadData = $dataOrBodyEn;
        if (is_string($typeOrTitleEn) && !empty($typeOrTitleEn)) {
            $type = $typeOrTitleEn;
        }
    } elseif (is_string($typeOrTitleEn) || is_string($dataOrBodyEn)) {
        $titleEn = is_string($typeOrTitleEn) ? $typeOrTitleEn : '';
        $bodyEn  = is_string($dataOrBodyEn) ? $dataOrBodyEn : '';
    }

    if (!isset($payloadData['type'])) {
        $payloadData['type'] = $type;
    }

    // 1. Insert into MySQL in-app notifications table
    try {
        if (!empty($titleEn) || !empty($bodyEn)) {
            $stmt = $conn->prepare("INSERT INTO notifications (student_id, title, body, title_ar, title_en, body_ar, body_en, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([$title, $body, $titleAr, $titleEn, $bodyAr, $bodyEn]);
        } else {
            $stmt = $conn->prepare("INSERT INTO notifications (student_id, title, body, created_at) VALUES (?, ?, ?, NOW())");
            $stmt->execute([$studentId, $title, $body]);
        }
    } catch (PDOException $e) {
        error_log("Failed to insert in-app notification: " . $e->getMessage());
    }

    // 2. Send Push Notification to all active devices of student via FCM HTTP v1
    try {
        FcmService::sendToStudent($studentId, $title, $body, $payloadData);
    } catch (Throwable $e) {
        error_log("Failed to send FCM push notification: " . $e->getMessage());
    }

    return true;
}
