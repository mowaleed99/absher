<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

AuthMiddleware::requireAdmin();

try {
    $dashboardData = [];

    // Active Students
    $stmt = $conn->query("SELECT COUNT(*) FROM students WHERE deleted_at IS NULL");
    $dashboardData['students']['active_count'] = $stmt->fetchColumn();

    // Active Apartments
    $stmt = $conn->query("SELECT COUNT(*) FROM apartments WHERE deleted_at IS NULL");
    $dashboardData['apartments']['active_count'] = $stmt->fetchColumn();

    // Active Services
    $stmt = $conn->query("SELECT COUNT(*) FROM services WHERE is_active = 1");
    $dashboardData['services']['active_count'] = $stmt->fetchColumn();

    // Service Requests
    $stmt = $conn->query("SELECT status, COUNT(*) as count FROM service_requests GROUP BY status");
    $requestStats = $stmt->fetchAll();
    $requestsMap = [];
    foreach ($requestStats as $stat) {
        $requestsMap[$stat['status']] = (int)$stat['count'];
    }
    $dashboardData['service_requests'] = $requestsMap;

    // Wallet Statistics
    $stmt = $conn->query("
        SELECT 
            COUNT(*) as total_transactions, 
            SUM(amount) as total_spent
        FROM wallet_transactions 
        WHERE transaction_type IN ('debit', 'deduction')
    ");
    $walletStats = $stmt->fetch();
    $dashboardData['wallet'] = [
        'total_transactions' => (int)$walletStats['total_transactions'],
        'total_points_spent' => (int)($walletStats['total_spent'] ?? 0)
    ];

    jsonResponse(true, "Dashboard stats loaded", 200, $dashboardData);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
