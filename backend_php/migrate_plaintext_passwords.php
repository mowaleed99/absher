<?php
// Enforce command-line execution only
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain');
    echo "Forbidden: This script can only be run via CLI.\n";
    exit(1);
}

require_once __DIR__ . '/config/db.php';

try {
    echo "Starting password encryption migration...\n";
    $conn->beginTransaction();

    // 1. Migrate Admin Passwords
    $adminStmt = $conn->query("SELECT id, username, password FROM admins");
    $admins = $adminStmt->fetchAll();
    
    $adminUpdated = 0;
    foreach ($admins as $admin) {
        $password = $admin['password'];
        
        // Robust check using password_get_info()
        $info = password_get_info($password);
        $isHashed = ($info['algo'] !== null && $info['algoName'] !== 'unknown');
        
        if (!$isHashed) {
            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $update = $conn->prepare("UPDATE admins SET password = ? WHERE id = ?");
            $update->execute([$hashed, $admin['id']]);
            $adminUpdated++;
            echo "Admin '{$admin['username']}' password hash upgraded successfully.\n";
        }
    }

    // 2. Migrate Student Passwords
    $studentStmt = $conn->query("SELECT id, full_name, password FROM students");
    $students = $studentStmt->fetchAll();
    
    $studentUpdated = 0;
    foreach ($students as $student) {
        $password = $student['password'];
        
        // Robust check using password_get_info()
        $info = password_get_info($password);
        $isHashed = ($info['algo'] !== null && $info['algoName'] !== 'unknown');
        
        if (!$isHashed) {
            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $update = $conn->prepare("UPDATE students SET password = ? WHERE id = ?");
            $update->execute([$hashed, $student['id']]);
            $studentUpdated++;
            echo "Student record ID {$student['id']} password hash upgraded successfully.\n";
        }
    }

    $conn->commit();
    echo "Migration completed. Upgraded {$adminUpdated} admin records and {$studentUpdated} student records.\n";
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
