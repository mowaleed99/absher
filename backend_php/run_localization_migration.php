<?php
// standalone migration script to safely add translation columns and backfill Arabic data.
require_once __DIR__ . '/config/db.php';

// Define the migration config: Table => [ ColumnSuffix => Type, ... ]
$migrationConfig = [
    'services' => [
        'title_ar' => 'varchar(200) DEFAULT NULL',
        'title_en' => 'varchar(200) DEFAULT NULL',
        'description_ar' => 'text DEFAULT NULL',
        'description_en' => 'text DEFAULT NULL',
    ],
    'apartments' => [
        'title_ar' => 'varchar(255) DEFAULT NULL',
        'title_en' => 'varchar(255) DEFAULT NULL',
        'description_ar' => 'text DEFAULT NULL',
        'description_en' => 'text DEFAULT NULL',
        'location_ar' => 'varchar(255) DEFAULT NULL',
        'location_en' => 'varchar(255) DEFAULT NULL',
        'proximity_ar' => 'varchar(255) DEFAULT NULL',
        'proximity_en' => 'varchar(255) DEFAULT NULL',
        'capacity_ar' => 'varchar(100) DEFAULT NULL',
        'capacity_en' => 'varchar(100) DEFAULT NULL',
        'move_in_type_ar' => 'varchar(50) DEFAULT NULL',
        'move_in_type_en' => 'varchar(50) DEFAULT NULL',
        'move_in_date_ar' => 'varchar(100) DEFAULT NULL',
        'move_in_date_en' => 'varchar(100) DEFAULT NULL',
        'features_ar' => 'text DEFAULT NULL',
        'features_en' => 'text DEFAULT NULL',
    ],
    'districts' => [
        'name_ar' => 'varchar(255) DEFAULT NULL',
        'name_en' => 'varchar(255) DEFAULT NULL',
    ],
    'universities' => [
        'name_ar' => 'varchar(255) DEFAULT NULL',
        'name_en' => 'varchar(255) DEFAULT NULL',
    ],
    'news' => [
        'title_ar' => 'varchar(255) DEFAULT NULL',
        'title_en' => 'varchar(255) DEFAULT NULL',
        'content_ar' => 'text DEFAULT NULL',
        'content_en' => 'text DEFAULT NULL',
    ],
    'housing_offers' => [
        'title_ar' => 'varchar(255) DEFAULT NULL',
        'title_en' => 'varchar(255) DEFAULT NULL',
        'description_ar' => 'text DEFAULT NULL',
        'description_en' => 'text DEFAULT NULL',
        'badge_text_ar' => 'varchar(100) DEFAULT NULL',
        'badge_text_en' => 'varchar(100) DEFAULT NULL',
    ],
];

try {
    echo "Starting Database Localization Migration...\n";
    
    foreach ($migrationConfig as $table => $columns) {
        echo "Processing table: `$table`...\n";
        
        // 1. Get existing columns in this table
        $stmt = $conn->query("DESCRIBE `$table`");
        $existingColumns = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $existingColumns[] = strtolower($row['Field']);
        }
        
        // 2. Add columns if they do not exist
        foreach ($columns as $col => $type) {
            $colLower = strtolower($col);
            if (!in_array($colLower, $existingColumns, true)) {
                echo "  Adding column `$col` of type `$type`...\n";
                $conn->exec("ALTER TABLE `$table` ADD COLUMN `$col` $type");
            } else {
                echo "  Column `$col` already exists. Skipping.\n";
            }
        }
        
        // 3. Backfill Arabic values from legacy columns if empty
        echo "  Backfilling Arabic columns from legacy data...\n";
        foreach ($columns as $col => $type) {
            if (substr($col, -3) === '_ar') {
                $legacyCol = substr($col, 0, -3); // e.g. 'title' from 'title_ar'
                if (in_array(strtolower($legacyCol), $existingColumns, true)) {
                    $rowsAffected = $conn->exec("
                        UPDATE `$table` 
                        SET `$col` = `$legacyCol` 
                        WHERE `$col` IS NULL OR `$col` = ''
                    ");
                    echo "    Backfilled `$col` from `$legacyCol` ($rowsAffected rows updated).\n";
                }
            }
        }
    }
    
    echo "Migration completed successfully!\n";
} catch (Throwable $e) {
    echo "MIGRATION ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
