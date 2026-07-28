<?php
require_once __DIR__ . '/config/db.php';

echo "1. Creating backup table `apartments_backup_pre_migration`...\n";
$conn->exec("CREATE TABLE IF NOT EXISTS apartments_backup_pre_migration AS SELECT * FROM apartments");

echo "2. Adding `district_id` column (INT NULL)...\n";
try {
    $conn->exec("ALTER TABLE apartments ADD COLUMN district_id INT NULL DEFAULT NULL");
    echo "Column added successfully.\n";
} catch(Exception $e) {
    echo "Column may already exist: " . $e->getMessage() . "\n";
}

echo "3. Adding foreign key constraint...\n";
try {
    $conn->exec("ALTER TABLE apartments ADD CONSTRAINT fk_apartment_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL ON UPDATE CASCADE");
    echo "Foreign key added successfully.\n";
} catch(Exception $e) {
    echo "Foreign key may already exist: " . $e->getMessage() . "\n";
}

echo "4. Backfilling data...\n";
$apts = $conn->query("SELECT id, location FROM apartments WHERE district_id IS NULL")->fetchAll(PDO::FETCH_ASSOC);
$districts = $conn->query("SELECT id, name FROM districts")->fetchAll(PDO::FETCH_ASSOC);

function normalizeStr($str) {
    $str = mb_strtolower(trim($str), 'UTF-8');
    return preg_replace('/[^\p{L}\p{N}]+/u', '', $str);
}

$updated = 0;
foreach ($apts as $apt) {
    $loc = trim($apt['location']);
    $locNorm = normalizeStr($loc);
    
    $matched_id = null;
    
    foreach ($districts as $d) {
        if ($d['name'] === $loc) {
            $matched_id = $d['id']; break;
        }
    }
    
    if (!$matched_id) {
        foreach ($districts as $d) {
            $dNorm = normalizeStr($d['name']);
            if (strpos($locNorm, $dNorm) !== false || strpos($dNorm, $locNorm) !== false) {
                $matched_id = $d['id']; break;
            }
        }
    }
    
    if ($matched_id) {
        $stmt = $conn->prepare("UPDATE apartments SET district_id = ? WHERE id = ?");
        $stmt->execute([$matched_id, $apt['id']]);
        $updated++;
    }
}

echo "Migration complete. Safely mapped $updated apartments to their district_id.\n\n";

echo "--- Schema Verification ---\n";
$info = $conn->query("SHOW CREATE TABLE apartments")->fetch(PDO::FETCH_ASSOC);
echo $info['Create Table'];
?>
