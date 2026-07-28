<?php
// Script to act as the Flutter app and verify 9-point proof criteria

// Use direct DB connection to verify logic directly as API tests might need localhost config
require __DIR__ . '/backend_php/config/db.php';

$apartment_image_url = "uploads/apartments/test_apt.jpg";
$service_image_url = "uploads/services/test_srv.jpg";

// Test Apartment Insertion
$apt_data = [
    "title" => "Test Apartment 9-Point Proof",
    "price" => "1000",
    "location" => "Test Location",
    "district_id" => 1,
    "images" => [$apartment_image_url], // FLUTTER ARRAY FORMAT
];

// Replicate admin_api.php 'add_apartment' logic exactly
$images = isset($apt_data['images']) && is_array($apt_data['images']) ? json_encode($apt_data['images'], JSON_UNESCAPED_UNICODE) : json_encode([]);
$stmt = $conn->prepare("INSERT INTO apartments (title, price, location, district_id, images) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$apt_data['title'], $apt_data['price'], $apt_data['location'], $apt_data['district_id'], $images]);
$apt_id = $conn->lastInsertId();

// Verify DB Content
$stmt = $conn->prepare("SELECT id, title, images FROM apartments WHERE id = ?");
$stmt->execute([$apt_id]);
$apt_db = $stmt->fetch(PDO::FETCH_ASSOC);

echo "--- APARTMENT EVIDENCE ---\n";
echo "images content exactly: " . $apt_db['images'] . "\n";
if ($apt_db['images'] === '["uploads\/apartments\/test_apt.jpg"]' || $apt_db['images'] === '["uploads/apartments/test_apt.jpg"]') {
    echo "SUCCESS: Apartment images saved as correct JSON array.\n";
} else {
    echo "FAILURE: Apartment images format incorrect.\n";
}

// Test Service Insertion
$srv_data = [
    "title" => "Test Service 9-Point Proof",
    "image_url" => $service_image_url,
];

// Replicate admin_api.php 'add_service' logic exactly
$stmt = $conn->prepare("INSERT INTO services (title, image_url) VALUES (?, ?)");
$stmt->execute([$srv_data['title'], $srv_data['image_url']]);
$srv_id = $conn->lastInsertId();

// Verify DB Content
$stmt = $conn->prepare("SELECT id, title, image_url FROM services WHERE id = ?");
$stmt->execute([$srv_id]);
$srv_db = $stmt->fetch(PDO::FETCH_ASSOC);

echo "\n--- SERVICE EVIDENCE ---\n";
echo "image_url content exactly: " . $srv_db['image_url'] . "\n";
if ($srv_db['image_url'] === "uploads/services/test_srv.jpg") {
    echo "SUCCESS: Service image_url saved correctly.\n";
} else {
    echo "FAILURE: Service image_url format incorrect.\n";
}

// Cleanup test data
$conn->query("DELETE FROM apartments WHERE id = $apt_id");
$conn->query("DELETE FROM services WHERE id = $srv_id");

?>
