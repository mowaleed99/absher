<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing MySQL Connection...\n";

$hosts = ['127.0.0.1', 'localhost', '::1'];
foreach ($hosts as $host) {
    try {
        echo "Trying host: $host ... ";
        $conn = new PDO("mysql:host=$host;charset=utf8mb4", "root", "");
        echo "SUCCESS!\n";
    } catch (PDOException $e) {
        echo "FAILED: " . $e->getMessage() . "\n";
    }
}
?>
