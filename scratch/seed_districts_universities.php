<?php
// Bulk Seeder for Districts & Universities in Production & Staging
header('Content-Type: text/plain; charset=utf-8');

$databases = ['absher_georgia_db', 'absher_georgia_staging'];

$districts = [
    ['name' => 'Akhmeteli Theatre', 'name_ar' => 'مسرح أخميتيلي (أخميتيلي تيتر)', 'name_en' => 'Akhmeteli Theatre'],
    ['name' => 'Sarajishvili', 'name_ar' => 'ساراجيشفيلي', 'name_en' => 'Sarajishvili'],
    ['name' => 'Guramishvili', 'name_ar' => 'جوراميشفيلي', 'name_en' => 'Guramishvili'],
    ['name' => 'Ghrmaghele', 'name_ar' => 'غرماغيله', 'name_en' => 'Ghrmaghele'],
    ['name' => 'Didube', 'name_ar' => 'ديدوبي', 'name_en' => 'Didube'],
    ['name' => 'Gotsiridze', 'name_ar' => 'جوتسيريدزي', 'name_en' => 'Gotsiridze'],
    ['name' => 'Nadzaladevi', 'name_ar' => 'نادزالاديفي', 'name_en' => 'Nadzaladevi'],
    ['name' => 'Station Square', 'name_ar' => 'ساحة المحطة (ستيشن سكوير)', 'name_en' => 'Station Square'],
    ['name' => 'Marjanishvili', 'name_ar' => 'مرجانيشفيلي', 'name_en' => 'Marjanishvili'],
    ['name' => 'Rustaveli', 'name_ar' => 'روستافيلي', 'name_en' => 'Rustaveli'],
    ['name' => 'Liberty Square', 'name_ar' => 'ميدان الحرية (ليبرتي سكوير)', 'name_en' => 'Liberty Square'],
    ['name' => 'Avlabari', 'name_ar' => 'أفلاباري', 'name_en' => 'Avlabari'],
    ['name' => '300 Aragveli', 'name_ar' => '300 أراغفيلي', 'name_en' => '300 Aragveli'],
    ['name' => 'Isani', 'name_ar' => 'إيساني', 'name_en' => 'Isani'],
    ['name' => 'Samgori', 'name_ar' => 'سامغوري', 'name_en' => 'Samgori'],
    ['name' => 'Varketili', 'name_ar' => 'فاركيثيلي', 'name_en' => 'Varketili'],
    ['name' => 'Tsereteli', 'name_ar' => 'تسيريتيلي', 'name_en' => 'Tsereteli'],
    ['name' => 'Technical University', 'name_ar' => 'الجامعة التقنية (تكنيكال يونيفيرسيتي)', 'name_en' => 'Technical University'],
    ['name' => 'Medical University', 'name_ar' => 'جامعة الطب (ميديكال يونيفيرسيتي)', 'name_en' => 'Medical University'],
    ['name' => 'Delisi', 'name_ar' => 'ديليسي', 'name_en' => 'Delisi'],
    ['name' => 'Vazha-Pshavela', 'name_ar' => 'فاژا بشافيلا', 'name_en' => 'Vazha-Pshavela'],
    ['name' => 'State University', 'name_ar' => 'جامعة الدولة (ستيت يونيفيرسيتي)', 'name_en' => 'State University'],
    ['name' => 'Vake', 'name_ar' => 'فاكي', 'name_en' => 'Vake'],
    ['name' => 'Saburtalo', 'name_ar' => 'سابورتالو', 'name_en' => 'Saburtalo'],
    ['name' => 'Chughureti', 'name_ar' => 'تشوغوريتي', 'name_en' => 'Chughureti'],
    ['name' => 'Dighomi Massive', 'name_ar' => 'ديغومي ماسيف', 'name_en' => 'Dighomi Massive'],
    ['name' => 'Didi Dighomi', 'name_ar' => 'ديدي ديغومي', 'name_en' => 'Didi Dighomi'],
    ['name' => 'Sanzona', 'name_ar' => 'سانزونا', 'name_en' => 'Sanzona'],
    ['name' => 'Temka', 'name_ar' => 'تيمكا', 'name_en' => 'Temka'],
    ['name' => 'Gldani', 'name_ar' => 'جلداني', 'name_en' => 'Gldani'],
    ['name' => 'Ortachala', 'name_ar' => 'أورتاشالا', 'name_en' => 'Ortachala'],
];

$universities = [
    ['name' => 'Caucasus International University (CIU)', 'name_ar' => 'جامعة القوقاز الدولية (CIU)', 'name_en' => 'Caucasus International University (CIU)'],
    ['name' => 'Georgian National University SEU', 'name_ar' => 'جامعة جورجيا الوطنية (SEU)', 'name_en' => 'Georgian National University SEU'],
    ['name' => 'European University (EU)', 'name_ar' => 'الجامعة الأوروبية (EU)', 'name_en' => 'European University (EU)'],
    ['name' => 'Alte University', 'name_ar' => 'جامعة ألتي (Alte)', 'name_en' => 'Alte University'],
    ['name' => 'International Black Sea University (IBSU)', 'name_ar' => 'جامعة البحر الأسود الدولية (IBSU)', 'name_en' => 'International Black Sea University (IBSU)'],
    ['name' => 'Caucasus University (CU)', 'name_ar' => 'جامعة القوقاز (CU)', 'name_en' => 'Caucasus University (CU)'],
    ['name' => 'Georgian American University (GAU)', 'name_ar' => 'الجامعة الجورجية الأمريكية (GAU)', 'name_en' => 'Georgian American University (GAU)'],
    ['name' => 'University of Georgia (UG)', 'name_ar' => 'جامعة جورجيا (UG)', 'name_en' => 'University of Georgia (UG)'],
    ['name' => 'Grigol Robakidze University (GRUNI)', 'name_ar' => 'جامعة جريجول روباكيدزه (GRUNI)', 'name_en' => 'Grigol Robakidze University (GRUNI)'],
    ['name' => 'David Tvildiani Medical University (DTMU)', 'name_ar' => 'جامعة دافيد تفيلدياني الطبية (DTMU)', 'name_en' => 'David Tvildiani Medical University (DTMU)'],
    ['name' => 'New Vision University (NVU)', 'name_ar' => 'جامعة نيو فيجن (NVU)', 'name_en' => 'New Vision University (NVU)'],
    ['name' => 'Ilia State University', 'name_ar' => 'جامعة إيليا الحكومية (ISU)', 'name_en' => 'Ilia State University'],
    ['name' => 'Ivane Javakhishvili Tbilisi State University (TSU)', 'name_ar' => 'جامعة إيفاني جافاخيشفيلي تبليسي الحكومية (TSU)', 'name_en' => 'Ivane Javakhishvili Tbilisi State University (TSU)'],
    ['name' => 'Georgian Aviation University (SSU)', 'name_ar' => 'جامعة الطيران الجورجية (SSU)', 'name_en' => 'Georgian Aviation University (SSU)'],
    ['name' => 'Tbilisi State Medical University (TSMU)', 'name_ar' => 'جامعة تبليسي الطبية الحكومية (TSMU)', 'name_en' => 'Tbilisi State Medical University (TSMU)'],
];

foreach ($databases as $dbName) {
    echo "========================================\n";
    echo "Processing Database: {$dbName}\n";
    echo "========================================\n";
    
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;dbname={$dbName};charset=utf8mb4", 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        
        // 1. Process Districts
        $distStmt = $pdo->prepare("INSERT INTO districts (name, name_ar, name_en) 
                                   VALUES (:name, :name_ar, :name_en) 
                                   ON DUPLICATE KEY UPDATE name_ar = VALUES(name_ar), name_en = VALUES(name_en)");
        
        $insertedDistricts = 0;
        foreach ($districts as $d) {
            $distStmt->execute([
                ':name' => $d['name'],
                ':name_ar' => $d['name_ar'],
                ':name_en' => $d['name_en']
            ]);
            $insertedDistricts++;
        }
        echo "Districts processed: {$insertedDistricts}\n";
        
        // 2. Process Universities
        $uniStmt = $pdo->prepare("INSERT INTO universities (name, name_ar, name_en) 
                                  VALUES (:name, :name_ar, :name_en) 
                                  ON DUPLICATE KEY UPDATE name_ar = VALUES(name_ar), name_en = VALUES(name_en)");
        
        $insertedUnis = 0;
        foreach ($universities as $u) {
            $uniStmt->execute([
                ':name' => $u['name'],
                ':name_ar' => $u['name_ar'],
                ':name_en' => $u['name_en']
            ]);
            $insertedUnis++;
        }
        echo "Universities processed: {$insertedUnis}\n";
        
        // 3. Clean up test / invalid old universities if needed (e.g. 'جامعه معروفه', 'طنطا')
        $pdo->exec("DELETE FROM universities WHERE name IN ('جامعه معروفه', 'طنطا', 'تبليسي', 'ciu')");
        
        $totalD = $pdo->query("SELECT COUNT(*) FROM districts")->fetchColumn();
        $totalU = $pdo->query("SELECT COUNT(*) FROM universities")->fetchColumn();
        echo "Current totals in {$dbName} -> Districts: {$totalD}, Universities: {$totalU}\n";
        
    } catch (Exception $e) {
        echo "ERROR on {$dbName}: " . $e->getMessage() . "\n";
    }
}

echo "All Seeding Completed Successfully!\n";
