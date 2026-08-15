<?php
require_once __DIR__ . '/../../config/db_staging.php';

function sendStudentNotification($studentId, $title_ar, $body_ar, $title_en = null, $body_en = null) {
    global $conn;
    try {
        $title = $title_ar;
        $body = $body_ar;
        $t_en = !empty($title_en) ? $title_en : $title_ar;
        $b_en = !empty($body_en) ? $body_en : $body_ar;

        $stmt = $conn->prepare("INSERT INTO notifications (student_id, title, body, title_ar, title_en, body_ar, body_en, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$studentId, $title, $body, $title_ar, $t_en, $body_ar, $b_en]);
        return true;
    } catch (PDOException $e) {
        error_log("Failed to insert notification: " . $e->getMessage());
        return false;
    }
}
