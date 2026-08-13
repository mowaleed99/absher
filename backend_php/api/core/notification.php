<?php
require_once __DIR__ . '/../../config/db.php';

function sendStudentNotification($studentId, $title, $body, $type = null) {
    global $conn;
    try {
        $stmt = $conn->prepare("INSERT INTO notifications (student_id, title, body, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$studentId, $title, $body]);
        return true;
    } catch (PDOException $e) {
        error_log("Failed to insert notification: " . $e->getMessage());
        return false;
    }
}
