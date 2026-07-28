<?php
require_once __DIR__ . '/config/db.php';
try {
    $conn->exec("CREATE TABLE IF NOT EXISTS `housing_offers` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `apartment_id` int(11) NOT NULL,
      `title` varchar(255) NOT NULL,
      `description` text NOT NULL,
      `original_price` decimal(10,2) NOT NULL,
      `offer_price` decimal(10,2) NOT NULL,
      `badge_text` varchar(100) DEFAULT NULL,
      `image_url` varchar(500) DEFAULT NULL,
      `starts_at` datetime DEFAULT NULL,
      `expires_at` datetime DEFAULT NULL,
      `is_active` tinyint(1) DEFAULT 1,
      `display_order` int(11) DEFAULT 0,
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      CONSTRAINT `fk_offer_apartment` FOREIGN KEY (`apartment_id`) 
        REFERENCES `apartments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT `chk_original_price` CHECK (`original_price` > 0),
      CONSTRAINT `chk_offer_price` CHECK (`offer_price` >= 0 AND `offer_price` < `original_price`),
      CONSTRAINT `chk_dates` CHECK (`starts_at` IS NULL OR `expires_at` IS NULL OR `starts_at` < `expires_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    echo "Successfully created housing_offers table with cascading foreign key and price/date constraints.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
