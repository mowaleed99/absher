<?php
$db = new PDO('mysql:host=localhost;dbname=absher_georgia_db', 'root', '');
$db->query('ALTER TABLE services ADD COLUMN price_points INT DEFAULT 0 AFTER has_form');
echo "Done";
