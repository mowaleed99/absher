<?php
// واجهة برمجة تطبيقات لوحة التحكم (Admin API Endpoint) لـ تطبيق وموقع أبشر جورجيا
require_once '../config/db.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/core/notification.php';
require_once __DIR__ . '/core/identity_block.php';

AuthMiddleware::requireAdmin();
function saveBase64IfPresent($url) {
    if (is_string($url) && preg_match('/^data:image\/(\w+);base64,/', $url, $matches)) {
        $ext = $matches[1] ?:'jpg';
        $data = base64_decode(preg_replace('/^data:image\/\w+;base64,/','', $url));
        if ($data !== false) {
            $uploadDir = __DIR__ .'/../uploads/';
            if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
            $filename ='img_'. time() .'_'. rand(1000, 9999) .'.'. $ext;
            file_put_contents($uploadDir . $filename, $data);
            return'uploads/'. $filename;
        }
    }
    return $url;
}

$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? ($data['action'] ?? '');
try {
    if ($action ==='get_all') {
        // جلب الإحصائيات والكافة
        $apartments = $conn->query("
            SELECT *, 
                   COALESCE(NULLIF(title_ar, ''), title) AS display_title,
                   COALESCE(NULLIF(description_ar, ''), description) AS display_desc,
                   COALESCE(NULLIF(location_ar, ''), location) AS display_location,
                   COALESCE(NULLIF(proximity_ar, ''), proximity) AS display_proximity,
                   COALESCE(NULLIF(capacity_ar, ''), capacity) AS display_capacity,
                   COALESCE(NULLIF(move_in_type_ar, ''), move_in_type) AS display_move_in_type,
                   COALESCE(NULLIF(move_in_date_ar, ''), move_in_date) AS display_move_in_date
            FROM apartments 
            ORDER BY id DESC
        ")->fetchAll();
        $services = $conn->query("
            SELECT *, 
                   COALESCE(NULLIF(title_ar, ''), title) AS display_title,
                   COALESCE(NULLIF(description_ar, ''), description) AS display_desc
            FROM services 
            ORDER BY id DESC
        ")->fetchAll();
        $students = $conn->query("SELECT id, full_name, email, phone, university, nationality, points, admin_status, admin_note, is_blocked, created_at FROM students ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
        $blocked_identities = $conn->query("SELECT id, identifier_type, identifier_value, normalized_value, source_student_id, reason, created_by_admin, created_at FROM blocked_identities ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
        $universities = $conn->query("
            SELECT *, 
                   COALESCE(NULLIF(name_ar, ''), name) AS display_name
            FROM universities 
            ORDER BY id DESC
        ")->fetchAll();
        $districts = $conn->query("
            SELECT *, 
                   COALESCE(NULLIF(name_ar, ''), name) AS display_name
            FROM districts 
            ORDER BY id DESC
        ")->fetchAll();
        $requests = $conn->query("SELECT * FROM service_requests ORDER BY id DESC")->fetchAll();
        // Service Reviews (all reviews for moderation list)
        $reviews = $conn->query("
            SELECT r.id, r.student_id, r.service_request_id, r.rating, r.comment, r.status,
                   COALESCE(s.full_name, r.student_name, 'طالب كريم') AS student_name,
                   COALESCE(s.university, r.uni, 'جامعة في جورجيا') AS uni,
                   DATE_FORMAT(r.created_at, '%Y-%m-%d') AS date,
                   r.reviewed_by_admin_id, r.reviewed_at
            FROM service_reviews r
            LEFT JOIN students s ON r.student_id = s.id
            ORDER BY r.id DESC
        ")->fetchAll();

        // Application Feedback (all feedback for inbox)
        $application_feedback = $conn->query("
            SELECT af.id, af.student_id, af.feedback_type, af.comment, af.status, af.reviewed_by_admin_id, af.reviewed_at,
                   DATE_FORMAT(af.created_at, '%Y-%m-%d %h:%i %p') AS date,
                   s.full_name AS student_name, s.university AS student_uni
            FROM application_feedback af
            JOIN students s ON af.student_id = s.id
            ORDER BY af.id DESC
        ")->fetchAll();

        // Expanded Analytics for Service Reviews (APPROVED ONLY, RELATIONAL REVIEWS ONLY)
        $totalReviews = $conn->query("SELECT COUNT(*) FROM service_reviews WHERE status = 'approved' AND service_request_id IS NOT NULL")->fetchColumn();
        $avgRating = $conn->query("SELECT ROUND(AVG(rating), 2) FROM service_reviews WHERE status = 'approved' AND service_request_id IS NOT NULL")->fetchColumn();
        
        $distributionStmt = $conn->query("SELECT rating, COUNT(*) AS count FROM service_reviews WHERE status = 'approved' AND service_request_id IS NOT NULL GROUP BY rating");
        $ratingDistribution = ["1" => 0, "2" => 0, "3" => 0, "4" => 0, "5" => 0];
        while ($distRow = $distributionStmt->fetch()) {
            $ratingDistribution[strval($distRow['rating'])] = (int)$distRow['count'];
        }

        $serviceAnalytics = $conn->query("
            SELECT COALESCE(sr.service_title, 'General / Testimonial') AS service_type,
                   COUNT(r.id) AS review_count,
                   ROUND(AVG(r.rating), 2) AS average_rating
            FROM service_reviews r
            LEFT JOIN service_requests sr ON r.service_request_id = sr.id
            WHERE r.status = 'approved' AND r.service_request_id IS NOT NULL
            GROUP BY service_type
            ORDER BY review_count DESC
        ")->fetchAll();

        $reviews_analytics = [
            "total_reviews" => (int)$totalReviews,
            "average_rating" => $avgRating ? floatval($avgRating) : 0.0,
            "rating_distribution" => $ratingDistribution,
            "service_analytics" => $serviceAnalytics
        ];

        $news = $conn->query("
            SELECT *, 
                   COALESCE(NULLIF(title_ar, ''), title) AS display_title,
                   COALESCE(NULLIF(content_ar, ''), content) AS display_content,
                   DATE_FORMAT(created_at,'%Y-%m-%d %h:%i %p') AS date 
            FROM news 
            ORDER BY created_at DESC
        ")->fetchAll();
        $notifications = $conn->query("
            SELECT id, student_id, title, body,
                   COALESCE(NULLIF(title_ar, ''), title) AS title_ar,
                   COALESCE(NULLIF(title_en, ''), title) AS title_en,
                   COALESCE(NULLIF(body_ar, ''), body) AS body_ar,
                   COALESCE(NULLIF(body_en, ''), body) AS body_en,
                   DATE_FORMAT(created_at,'%Y-%m-%d %h:%i %p') AS date
            FROM notifications 
            WHERE student_id = 0 
            ORDER BY created_at DESC
        ")->fetchAll();
        $housing_offers = $conn->query("
            SELECT *, 
                   COALESCE(NULLIF(title_ar, ''), title) AS display_title,
                   COALESCE(NULLIF(description_ar, ''), description) AS display_desc,
                   COALESCE(NULLIF(badge_text_ar, ''), badge_text) AS display_badge_text
            FROM housing_offers 
            ORDER BY display_order ASC, created_at DESC
        ")->fetchAll();

        // جلب المحادثات ورسائل كل محادثة مع صورة بروفايل الطالب
        $chats = $conn->query("
            SELECT c.*, s.avatar_url AS student_avatar 
            FROM chats c 
            LEFT JOIN students s ON (c.student_id = s.id OR (c.phone IS NOT NULL AND c.phone != '' AND c.phone = s.phone))
            ORDER BY COALESCE(c.updated_at, c.last_activity_at) DESC
        ")->fetchAll();
        foreach ($chats as &$c) {
            $stmtMsg = $conn->prepare("SELECT id, sender, text, type, image_url AS imageUrl, quote_text AS quoteText, quote_sender AS quoteSender, is_deleted AS deleted, DATE_FORMAT(created_at,'%h:%i %p') AS time FROM chat_messages WHERE chat_id = ? ORDER BY id ASC");
            $stmtMsg->execute([$c['id']]);
            $msgs = $stmtMsg->fetchAll();
            foreach ($msgs as &$m) {
                $m['deleted'] = ($m['deleted'] == 1 || $m['deleted'] === true);
            }
            $c['messages'] = $msgs;
            $c['time'] = !empty($msgs) ? end($msgs)['time'] :'';
        }

        // Promo Codes Summary List
        $promo_codes = $conn->query("
            SELECT pc.*, 
                   (SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = pc.id AND status = 'applied') AS applied_redemptions_count,
                   (SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = pc.id) AS total_redemptions_count,
                   (SELECT COALESCE(SUM(discount_points), 0) FROM promo_code_redemptions WHERE promo_code_id = pc.id AND status = 'applied') AS points_saved
            FROM promo_codes pc
            ORDER BY pc.id DESC
        ")->fetchAll(PDO::FETCH_ASSOC);

        foreach ($promo_codes as &$p) {
            $p['service_ids'] = [];
            if ($p['service_scope'] === 'selected') {
                $sStmt = $conn->prepare("SELECT service_id FROM promo_code_services WHERE promo_code_id = ?");
                $sStmt->execute([$p['id']]);
                $p['service_ids'] = $sStmt->fetchAll(PDO::FETCH_COLUMN);
            }
            $p['student_ids'] = [];
            if ($p['audience_scope'] === 'selected') {
                $aStmt = $conn->prepare("SELECT student_id FROM promo_code_students WHERE promo_code_id = ?");
                $aStmt->execute([$p['id']]);
                $p['student_ids'] = $aStmt->fetchAll(PDO::FETCH_COLUMN);
            }
        }
        $now = date('Y-m-d H:i:s');
        $active_housing_offers_count = (int)$conn->query("
            SELECT COUNT(*) 
            FROM housing_offers ho
            INNER JOIN apartments apt ON ho.apartment_id = apt.id
            WHERE ho.is_active = 1
              AND (ho.starts_at IS NULL OR ho.starts_at <= '$now')
              AND (ho.expires_at IS NULL OR ho.expires_at > '$now')
              AND apt.is_available = 1
        ")->fetchColumn();

        $status_reply_templates = $conn->query("SELECT * FROM status_reply_templates ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status"=>"success","stats"=> ["total_apartments"=> count($apartments),"total_services"=> count($services),"total_students"=> count($students),"total_universities"=> count($universities),"total_districts"=> count($districts),"pending_requests"=> count(array_filter($requests, fn($r) => $r['status'] ==='قيد المراجعة')),"active_housing_offers_count" => $active_housing_offers_count,"promo_codes_count" => count($promo_codes)
            ],"apartments"=> $apartments,"services"=> $services,"students"=> $students,"universities"=> $universities,"districts"=> $districts,"requests"=> $requests,"reviews"=> $reviews,"reviews_analytics"=> $reviews_analytics,"application_feedback"=> $application_feedback,"chats"=> $chats,"news"=> $news,"notifications"=> $notifications,"housing_offers"=> $housing_offers,"active_housing_offers_count" => $active_housing_offers_count,"blocked_identities"=> $blocked_identities,"promo_codes"=> $promo_codes,"status_reply_templates"=> $status_reply_templates
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'get_apartments') {
        $apartments = $conn->query("
            SELECT *, 
                   COALESCE(NULLIF(title_ar, ''), title) AS display_title,
                   COALESCE(NULLIF(description_ar, ''), description) AS display_desc,
                   COALESCE(NULLIF(location_ar, ''), location) AS display_location,
                   COALESCE(NULLIF(proximity_ar, ''), proximity) AS display_proximity,
                   COALESCE(NULLIF(capacity_ar, ''), capacity) AS display_capacity,
                   COALESCE(NULLIF(move_in_type_ar, ''), move_in_type) AS display_move_in_type,
                   COALESCE(NULLIF(move_in_date_ar, ''), move_in_date) AS display_move_in_date
            FROM apartments 
            ORDER BY id DESC
        ")->fetchAll();
        foreach ($apartments as &$apt) {
            $apt['images'] = json_decode($apt['images'], true) ?? [$apt['images']];
            $apt['features'] = json_decode($apt['features'], true) ?? [$apt['features']];
            $apt['features_ar'] = json_decode($apt['features_ar'] ?? '[]', true) ?? [];
            $apt['features_en'] = json_decode($apt['features_en'] ?? '[]', true) ?? [];
            $apt['universities'] = json_decode($apt['universities'] ?? '[]', true) ?? [];
        }
        echo json_encode(["status" => "success", "data" => ["apartments" => $apartments]], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'get_services') {
        $services = $conn->query("
            SELECT *, 
                   COALESCE(NULLIF(title_ar, ''), title) AS display_title,
                   COALESCE(NULLIF(description_ar, ''), description) AS display_desc
            FROM services 
            ORDER BY id DESC
        ")->fetchAll();
        echo json_encode(["status" => "success", "data" => ["services" => $services]], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'get_students') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, intval($_GET['limit'] ?? 20));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');
        $query = "SELECT id, full_name, email, phone, university, points, created_at FROM students";
        $params = [];
        if (!empty($search)) {
            $query .= " WHERE full_name LIKE ? OR phone LIKE ? OR email LIKE ?";
            $params = ["%$search%", "%$search%", "%$search%"];
        }
        $query .= " ORDER BY id DESC LIMIT $limit OFFSET $offset";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $students = $stmt->fetchAll();
        echo json_encode(["status" => "success", "data" => ["students" => $students]], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'get_dashboard_stats') {
        $totalApts = $conn->query("SELECT COUNT(*) FROM apartments")->fetchColumn();
        $totalSvcs = $conn->query("SELECT COUNT(*) FROM services")->fetchColumn();
        $totalStds = $conn->query("SELECT COUNT(*) FROM students")->fetchColumn();
        $pendingReqs = $conn->query("SELECT COUNT(*) FROM service_requests WHERE status='قيد المراجعة'")->fetchColumn();
        $activePromos = $conn->query("SELECT COUNT(*) FROM promo_codes WHERE status='active'")->fetchColumn();
        $totalRedemptions = $conn->query("SELECT COUNT(*) FROM promo_code_redemptions WHERE status='applied'")->fetchColumn();
        $totalPointsSaved = $conn->query("SELECT COALESCE(SUM(discount_points), 0) FROM promo_code_redemptions WHERE status='applied'")->fetchColumn();
        echo json_encode(["status" => "success", "data" => [
            "total_apartments" => (int)$totalApts,
            "total_services" => (int)$totalSvcs,
            "total_students" => (int)$totalStds,
            "pending_requests" => (int)$pendingReqs,
            "active_promos" => (int)$activePromos,
            "total_redemptions" => (int)$totalRedemptions,
            "total_points_saved" => (int)$totalPointsSaved
        ]], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action ==='add_apartment') {
        $title_ar = trim($data['title_ar'] ?? '');
        $title_en = trim($data['title_en'] ?? '');
        $description_ar = trim($data['description_ar'] ?? '');
        $description_en = trim($data['description_en'] ?? '');
        $price = trim($data['price'] ?? '');
        $location_ar = trim($data['location_ar'] ?? '');
        $location_en = trim($data['location_en'] ?? '');
        $proximity_ar = trim($data['proximity_ar'] ?? '');
        $proximity_en = trim($data['proximity_en'] ?? '');
        $capacity_ar = trim($data['capacity_ar'] ?? '3 أفراد');
        $capacity_en = trim($data['capacity_en'] ?? '');
        $move_in_type_ar = trim($data['move_in_type_ar'] ?? 'فوري');
        $move_in_type_en = trim($data['move_in_type_en'] ?? '');
        $move_in_date_ar = trim($data['move_in_date_ar'] ?? 'انتقال فوري');
        $move_in_date_en = trim($data['move_in_date_en'] ?? '');
        
        $features_ar_raw = $data['features_ar'] ?? [];
        $features_en_raw = $data['features_en'] ?? [];
        $features_ar = json_encode($features_ar_raw, JSON_UNESCAPED_UNICODE);
        $features_en = json_encode($features_en_raw, JSON_UNESCAPED_UNICODE);

        // Legacy values for backwards compatibility
        $title = $title_ar;
        $description = $description_ar;
        $location = $location_ar;
        $proximity = $proximity_ar;
        $capacity = $capacity_ar;
        $move_in_type = $move_in_type_ar;
        $move_in_date = $move_in_date_ar;
        $features = $features_ar;

        $universities = json_encode($data['universities'] ?? [], JSON_UNESCAPED_UNICODE);
        $imagesArray = $data['images'] ?? [];
        $images = empty($imagesArray) ? '[]' : json_encode($imagesArray, JSON_UNESCAPED_UNICODE);
        
        // is_available: controls whether apartment shows in student public list
        $is_available = isset($data['is_available']) ? (intval($data['is_available']) ? 1 : 0) : 1;
        $district_id = isset($data['district_id']) && $data['district_id'] !== '' ? intval($data['district_id']) : null;
        $rental_type = !empty($data['rental_type']) ? trim($data['rental_type']) : 'apartment';
        $rooms_count = isset($data['rooms_count']) && $data['rooms_count'] !== '' ? intval($data['rooms_count']) : null;
        $roommate_reqs = !empty($data['roommate_reqs']) ? trim($data['roommate_reqs']) : null;
        $roommate_facilities = !empty($data['roommate_facilities']) ? trim($data['roommate_facilities']) : null;
        $owner_phone = !empty($data['owner_phone']) ? trim($data['owner_phone']) : null;

        if (!empty($title) && !empty($price)) {
            $stmt = $conn->prepare("INSERT INTO apartments (title, price, location, proximity, universities, capacity, move_in_type, move_in_date, images, features, description, is_available, district_id, rental_type, rooms_count, roommate_reqs, roommate_facilities, owner_phone, title_ar, title_en, description_ar, description_en, location_ar, location_en, proximity_ar, proximity_en, capacity_ar, capacity_en, move_in_type_ar, move_in_type_en, move_in_date_ar, move_in_date_en, features_ar, features_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $price, $location, $proximity, $universities, $capacity, $move_in_type, $move_in_date, $images, $features, $description, $is_available, $district_id, $rental_type, $rooms_count, $roommate_reqs, $roommate_facilities, $owner_phone, $title_ar, $title_en, $description_ar, $description_en, $location_ar, $location_en, $proximity_ar, $proximity_en, $capacity_ar, $capacity_en, $move_in_type_ar, $move_in_type_en, $move_in_date_ar, $move_in_date_en, $features_ar, $features_en]);
            
            // إضافة تنبيه تلقائي في الإشعارات
            $stmtNotif = $conn->prepare("INSERT INTO notifications (student_id, title, body, created_at) VALUES (0, ?, ?, NOW())");
            $stmtNotif->execute(["شقة سكنية جديدة معروضة للإيجار","تمت إضافة شقة سكنية جديدة للإيجار في حي:". $location ."بسعر". $price .". تصفح شاشات السكن للاطلاع على الصور والتفاصيل كاملة."]);
            
            echo json_encode(["status"=>"success","message"=>"تم إضافة الشقة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"عنوان الشقة والسعر مطلوبان"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_apartment') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM apartments WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف الشقة بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على العنصر أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الشقة غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='update_apartment') {
        $id = intval($data['id'] ?? 0);
        $title_ar = trim($data['title_ar'] ?? '');
        $title_en = trim($data['title_en'] ?? '');
        $description_ar = trim($data['description_ar'] ?? '');
        $description_en = trim($data['description_en'] ?? '');
        $price = trim($data['price'] ?? '');
        $location_ar = trim($data['location_ar'] ?? '');
        $location_en = trim($data['location_en'] ?? '');
        $proximity_ar = trim($data['proximity_ar'] ?? '');
        $proximity_en = trim($data['proximity_en'] ?? '');
        $capacity_ar = trim($data['capacity_ar'] ?? '3 أفراد');
        $capacity_en = trim($data['capacity_en'] ?? '');
        $move_in_type_ar = trim($data['move_in_type_ar'] ?? 'فوري');
        $move_in_type_en = trim($data['move_in_type_en'] ?? '');
        $move_in_date_ar = trim($data['move_in_date_ar'] ?? 'انتقال فوري');
        $move_in_date_en = trim($data['move_in_date_en'] ?? '');
        
        $features_ar_raw = $data['features_ar'] ?? [];
        $features_en_raw = $data['features_en'] ?? [];
        $features_ar = json_encode($features_ar_raw, JSON_UNESCAPED_UNICODE);
        $features_en = json_encode($features_en_raw, JSON_UNESCAPED_UNICODE);

        // Legacy values for backwards compatibility
        $title = $title_ar;
        $description = $description_ar;
        $location = $location_ar;
        $proximity = $proximity_ar;
        $capacity = $capacity_ar;
        $move_in_type = $move_in_type_ar;
        $move_in_date = $move_in_date_ar;
        $features = $features_ar;

        $universities = json_encode($data['universities'] ?? [], JSON_UNESCAPED_UNICODE);
        $imagesArray = $data['images'] ?? [];
        $images = empty($imagesArray) ? '[]' : json_encode($imagesArray, JSON_UNESCAPED_UNICODE);
        
        // is_available: controls whether apartment shows in student public list
        $is_available = isset($data['is_available']) ? (intval($data['is_available']) ? 1 : 0) : 1;
        $district_id = isset($data['district_id']) && $data['district_id'] !== '' ? intval($data['district_id']) : null;
        $rental_type = !empty($data['rental_type']) ? trim($data['rental_type']) : 'apartment';
        $rooms_count = isset($data['rooms_count']) && $data['rooms_count'] !== '' ? intval($data['rooms_count']) : null;
        $roommate_reqs = !empty($data['roommate_reqs']) ? trim($data['roommate_reqs']) : null;
        $roommate_facilities = !empty($data['roommate_facilities']) ? trim($data['roommate_facilities']) : null;
        $owner_phone = !empty($data['owner_phone']) ? trim($data['owner_phone']) : null;

        if ($id > 0 && !empty($title) && !empty($price)) {
            $stmt = $conn->prepare("UPDATE apartments SET title=?, price=?, location=?, proximity=?, universities=?, capacity=?, move_in_type=?, move_in_date=?, images=?, features=?, description=?, is_available=?, district_id=?, rental_type=?, rooms_count=?, roommate_reqs=?, roommate_facilities=?, owner_phone=?, title_ar=?, title_en=?, description_ar=?, description_en=?, location_ar=?, location_en=?, proximity_ar=?, proximity_en=?, capacity_ar=?, capacity_en=?, move_in_type_ar=?, move_in_type_en=?, move_in_date_ar=?, move_in_date_en=?, features_ar=?, features_en=? WHERE id=?");
            $stmt->execute([$title, $price, $location, $proximity, $universities, $capacity, $move_in_type, $move_in_date, $images, $features, $description, $is_available, $district_id, $rental_type, $rooms_count, $roommate_reqs, $roommate_facilities, $owner_phone, $title_ar, $title_en, $description_ar, $description_en, $location_ar, $location_en, $proximity_ar, $proximity_en, $capacity_ar, $capacity_en, $move_in_type_ar, $move_in_type_en, $move_in_date_ar, $move_in_date_en, $features_ar, $features_en, $id]);
            echo json_encode(["status"=>"success","message"=>"تم تعديل الشقة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الشقة، العنوان، والسعر مطلوبان"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_university') {
        $name_ar = trim($data['name_ar'] ?? '');
        $name_en = trim($data['name_en'] ?? '');
        $name = $name_ar; // Legacy column fallback
        if (!empty($name)) {
            try {
                $stmt = $conn->prepare("INSERT INTO universities (name, name_ar, name_en) VALUES (?, ?, ?)");
                $stmt->execute([$name, $name_ar, $name_en]);
                echo json_encode(["status"=>"success","message"=>"تم إضافة الجامعة بنجاح"], JSON_UNESCAPED_UNICODE);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000 || strpos($e->getMessage(), '1062') !== false) {
                    echo json_encode(["status"=>"error","message"=>"هذه الجامعة مضافة مسبقاً."], JSON_UNESCAPED_UNICODE);
                } else {
                    throw $e;
                }
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"اسم الجامعة مطلوب"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_university') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM universities WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف الجامعة بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على العنصر أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الجامعة غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='update_university') {
        $id = intval($data['id'] ?? 0);
        $name_ar = trim($data['name_ar'] ?? '');
        $name_en = trim($data['name_en'] ?? '');
        $name = $name_ar; // Legacy column fallback
        if ($id > 0 && !empty($name)) {
            try {
                $conn->prepare("UPDATE universities SET name=?, name_ar=?, name_en=? WHERE id=?")->execute([$name, $name_ar, $name_en, $id]);
                echo json_encode(["status"=>"success","message"=>"تم تعديل الجامعة بنجاح"], JSON_UNESCAPED_UNICODE);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000 || strpos($e->getMessage(), '1062') !== false) {
                    echo json_encode(["status"=>"error","message"=>"هذا الاسم مستخدم لجامعة أخرى مسبقاً."], JSON_UNESCAPED_UNICODE);
                } else {
                    throw $e;
                }
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"البيانات غير مكتملة"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_district') {
        $name_ar = trim($data['name_ar'] ?? '');
        $name_en = trim($data['name_en'] ?? '');
        $name = $name_ar; // Legacy column fallback
        if (!empty($name)) {
            try {
                $stmt = $conn->prepare("INSERT INTO districts (name, name_ar, name_en) VALUES (?, ?, ?)");
                $stmt->execute([$name, $name_ar, $name_en]);
                echo json_encode(["status"=>"success","message"=>"تم إضافة الحي بنجاح"], JSON_UNESCAPED_UNICODE);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000 || strpos($e->getMessage(), '1062') !== false) {
                    echo json_encode(["status"=>"error","message"=>"هذا الحي مضاف مسبقاً."], JSON_UNESCAPED_UNICODE);
                } else {
                    throw $e;
                }
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"اسم الحي مطلوب"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_district') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM districts WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف الحي بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على العنصر أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الحي غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='update_district') {
        $id = intval($data['id'] ?? 0);
        $name_ar = trim($data['name_ar'] ?? '');
        $name_en = trim($data['name_en'] ?? '');
        $name = $name_ar; // Legacy column fallback
        if ($id > 0 && !empty($name)) {
            try {
                $conn->prepare("UPDATE districts SET name=?, name_ar=?, name_en=? WHERE id=?")->execute([$name, $name_ar, $name_en, $id]);
                echo json_encode(["status"=>"success","message"=>"تم تعديل الحي بنجاح"], JSON_UNESCAPED_UNICODE);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000 || strpos($e->getMessage(), '1062') !== false) {
                    echo json_encode(["status"=>"error","message"=>"هذا الاسم مستخدم لحي آخر مسبقاً."], JSON_UNESCAPED_UNICODE);
                } else {
                    throw $e;
                }
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"البيانات غير مكتملة"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_service') {
        $title_ar = trim($data['title_ar'] ?? '');
        $title_en = trim($data['title_en'] ?? '');
        $description_ar = trim($data['description_ar'] ?? '');
        $description_en = trim($data['description_en'] ?? '');
        
        $title = $title_ar;
        $description = $description_ar;

        $image_url = trim($data['image_url'] ??'');
        $image_url = saveBase64IfPresent($image_url);
        $has_form = isset($data['has_form']) ? (int)$data['has_form'] : 1;
        $price_points = isset($data['price_points']) ? (int)$data['price_points'] : 0;

        if (!empty($title)) {
            $stmt = $conn->prepare("INSERT INTO services (title, description, image_url, has_form, price_points, title_ar, title_en, description_ar, description_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $description, $image_url, $has_form, $price_points, $title_ar, $title_en, $description_ar, $description_en]);
            
            // إضافة تنبيه تلقائي في الإشعارات
            $stmtNotif = $conn->prepare("INSERT INTO notifications (student_id, title, body, created_at) VALUES (0, ?, ?, NOW())");
            $stmtNotif->execute(["️ خدمة طلابية جديدة متوفرة الآن","تمت إضافة خدمة طلابية جديدة:". $title .". تصفح قسم الخدمات للطلب والاستفسار مباشرة."]);
            
            echo json_encode(["status"=>"success","message"=>"تم إضافة الخدمة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"عنوان الخدمة مطلوب"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_service') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM services WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف الخدمة بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على العنصر أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الخدمة غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='update_service') {
        $id = intval($data['id'] ?? 0);
        $title_ar = trim($data['title_ar'] ?? '');
        $title_en = trim($data['title_en'] ?? '');
        $description_ar = trim($data['description_ar'] ?? '');
        $description_en = trim($data['description_en'] ?? '');
        
        $title = $title_ar;
        $description = $description_ar;

        $image_url = trim($data['image_url'] ?? '');
        $image_url = saveBase64IfPresent($image_url);
        $has_form = isset($data['has_form']) ? (int)$data['has_form'] : 1;
        $price_points = isset($data['price_points']) ? (int)$data['price_points'] : 0;

        if ($id > 0 && !empty($title)) {
            $stmt = $conn->prepare("UPDATE services SET title=?, description=?, image_url=?, has_form=?, price_points=?, title_ar=?, title_en=?, description_ar=?, description_en=? WHERE id=?");
            $stmt->execute([$title, $description, $image_url, $has_form, $price_points, $title_ar, $title_en, $description_ar, $description_en, $id]);
            echo json_encode(["status"=>"success","message"=>"تم تعديل الخدمة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الخدمة والعنوان مطلوبان"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_news') {
        $title_ar = trim($data['title_ar'] ?? '');
        $title_en = trim($data['title_en'] ?? '');
        $content_ar = trim($data['content_ar'] ?? '');
        $content_en = trim($data['content_en'] ?? '');

        $title = !empty($title_ar) ? $title_ar : $title_en;
        $content = !empty($content_ar) ? $content_ar : $content_en;
        $image_url = trim($data['image_url'] ?? $data['image'] ?? '');
        $image_url = saveBase64IfPresent($image_url);

        if (!empty($title) && !empty($content)) {
            $stmt = $conn->prepare("INSERT INTO news (title, content, image_url, title_ar, title_en, content_ar, content_en) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $content, $image_url, $title_ar, $title_en, $content_ar, $content_en]);
            echo json_encode(["status"=>"success","message"=>"تم نشر الخبر بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"عنوان الخبر والتفاصيل مطلوبان"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='update_news') {
        $id = intval($data['id'] ?? 0);
        $title_ar = trim($data['title_ar'] ?? '');
        $title_en = trim($data['title_en'] ?? '');
        $content_ar = trim($data['content_ar'] ?? '');
        $content_en = trim($data['content_en'] ?? '');

        $title = !empty($title_ar) ? $title_ar : $title_en;
        $content = !empty($content_ar) ? $content_ar : $content_en;
        $image_url = trim($data['image_url'] ?? $data['image'] ?? '');

        if ($id > 0 && !empty($title) && !empty($content)) {
            // Check existing image to preserve if no new image uploaded
            $curr = $conn->prepare("SELECT image_url FROM news WHERE id = ?");
            $curr->execute([$id]);
            $currRow = $curr->fetch();
            if (empty($image_url) && $currRow && !empty($currRow['image_url']) && empty($data['remove_image'])) {
                $image_url = $currRow['image_url'];
            } else {
                $image_url = saveBase64IfPresent($image_url);
            }

            $stmt = $conn->prepare("UPDATE news SET title=?, content=?, image_url=?, title_ar=?, title_en=?, content_ar=?, content_en=? WHERE id=?");
            $stmt->execute([$title, $content, $image_url, $title_ar, $title_en, $content_ar, $content_en, $id]);
            echo json_encode(["status"=>"success","message"=>"تم تعديل الخبر بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"بيانات الخبر غير مكتملة"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_news') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM news WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف الخبر بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على العنصر أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الخبر غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_notification') {
        $title_ar = trim($data['title_ar'] ?? ($data['title'] ?? ''));
        $title_en = trim($data['title_en'] ?? '');
        $body_ar = trim($data['body_ar'] ?? ($data['body'] ?? ($data['content'] ?? '')));
        $body_en = trim($data['body_en'] ?? '');

        $title = !empty($title_ar) ? $title_ar : $title_en;
        $body = !empty($body_ar) ? $body_ar : $body_en;

        if (!empty($title) && !empty($body)) {
            $stmt = $conn->prepare("INSERT INTO notifications (student_id, title, body, title_ar, title_en, body_ar, body_en) VALUES (0, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $body, $title_ar, $title_en, $body_ar, $body_en]);
            echo json_encode(["status"=>"success","message"=>"تم نشر التنبيه والإشعار بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"عنوان التنبيه والمحتوى مطلوبان"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_notification') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM notifications WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف التنبيه بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على العنصر أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف التنبيه غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='update_request_status') {
        $id = intval($data['id'] ?? 0);
        $status = trim($data['status'] ?? 'مكتمل');
        $cancellationReason = trim($data['cancellation_reason'] ?? '');
        $customMessage = trim($data['custom_message'] ?? '');
        $sendChat = isset($data['send_chat']) ? filter_var($data['send_chat'], FILTER_VALIDATE_BOOLEAN) : true;
        $msgLang = trim($data['msg_lang'] ?? 'ar'); // 'ar', 'en', 'both'
        $adminId = intval(AuthMiddleware::$payload['admin_id'] ?? 0);

        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الطلب غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        try {
            $conn->beginTransaction();

            // 1. Lock request row FOR UPDATE
            $stmtReq = $conn->prepare("
                SELECT sr.*, s.title_ar, s.title_en
                FROM service_requests sr
                LEFT JOIN services s ON sr.service_id = s.id
                WHERE sr.id = ?
                FOR UPDATE
            ");
            $stmtReq->execute([$id]);
            $reqData = $stmtReq->fetch(PDO::FETCH_ASSOC);

            if (!$reqData) {
                $conn->rollBack();
                echo json_encode(["status" => "error", "message" => "لم يتم العثور على الطلب"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            $currentStatus = $reqData['status'] ?? '';

            // Handle Cancellation Flow
            if ($status === 'ملغي') {
                if (empty($cancellationReason)) {
                    $conn->rollBack();
                    http_response_code(400);
                    echo json_encode(["status" => "error", "error_code" => "MISSING_REASON", "message" => "يرجى توضيح سبب إلغاء الطلب"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                if ($currentStatus === 'مكتمل') {
                    $conn->rollBack();
                    http_response_code(400);
                    echo json_encode(["status" => "error", "error_code" => "CANNOT_CANCEL_COMPLETED", "message" => "لا يمكن إلغاء طلب مكتمل"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Idempotent return if already cancelled
                if ($currentStatus === 'ملغي') {
                    $conn->rollBack();
                    echo json_encode([
                        "status" => "success",
                        "message" => "الطلب ملغي مسبقاً",
                        "data" => [
                            "id" => $id,
                            "status" => "ملغي",
                            "points_refunded" => 0,
                            "promo_reversed" => false,
                            "refund_status" => $reqData['refund_status'] ?? 'none'
                        ]
                    ], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Lock redemption record if exists
                $stmtRed = $conn->prepare("SELECT * FROM promo_code_redemptions WHERE service_request_id = ? AND status = 'applied' FOR UPDATE");
                $stmtRed->execute([$id]);
                $redemption = $stmtRed->fetch(PDO::FETCH_ASSOC);

                // Lock promo code row if redemption exists
                $promoCodeId = $redemption ? intval($redemption['promo_code_id']) : intval($reqData['promo_code_id'] ?? 0);
                if ($promoCodeId > 0) {
                    $conn->prepare("SELECT id FROM promo_codes WHERE id = ? FOR UPDATE")->execute([$promoCodeId]);
                }

                $pointsCharged = intval($reqData['points_charged'] ?? 0);
                $studentId = intval($reqData['student_id'] ?? 0);
                $refundStatus = 'not_applicable';
                $pointsRefunded = 0;
                $promoReversed = false;

                // Automatic Wallet Refund
                if ($reqData['payment_method'] === 'wallet' && $pointsCharged > 0 && $studentId > 0) {
                    // Lock student wallet FOR UPDATE
                    $stmtStd = $conn->prepare("SELECT points FROM students WHERE id = ? FOR UPDATE");
                    $stmtStd->execute([$studentId]);
                    $stdRow = $stmtStd->fetch(PDO::FETCH_ASSOC);

                    if ($stdRow) {
                        $conn->prepare("UPDATE students SET points = points + ? WHERE id = ?")->execute([$pointsCharged, $studentId]);

                        $svcTitle = $reqData['service_title'] ?? 'خدمة';
                        $txDesc = "استرجاع نقاط لطلب ملغي (#$id): " . $svcTitle . " - السبب: " . $cancellationReason;
                        
                        $stmtTx = $conn->prepare("INSERT INTO wallet_transactions (student_id, service_request_id, amount, type, description, created_at) VALUES (?, ?, ?, 'استرجاع', ?, NOW())");
                        $stmtTx->execute([$studentId, $id, $pointsCharged, $txDesc]);

                        $pointsRefunded = $pointsCharged;
                        $refundStatus = 'refunded';

                        // Notification
                        $notifTitleAr = "استرجاع نقاط";
                        $notifBodyAr = "تم استرجاع $pointsCharged نقطة إلى محفظتك بسبب إلغاء الطلب (#$id): $cancellationReason";
                        $notifTitleEn = "Points Refund";
                        $notifBodyEn = "Your $pointsCharged points have been refunded due to request cancellation (#$id): $cancellationReason";
                        sendStudentNotification($studentId, $notifTitleAr, $notifBodyAr, $notifTitleEn, $notifBodyEn);
                    }
                }

                // Promo Redemption Reversal
                if ($redemption) {
                    $upRed = $conn->prepare("UPDATE promo_code_redemptions SET status = 'reversed', reversed_at = NOW(), reversed_reason = ? WHERE id = ? AND status = 'applied'");
                    $upRed->execute([$cancellationReason, $redemption['id']]);
                    if ($upRed->rowCount() > 0 && $promoCodeId > 0) {
                        $conn->prepare("UPDATE promo_codes SET used_count = GREATEST(0, used_count - 1) WHERE id = ?")->execute([$promoCodeId]);
                        $promoReversed = true;
                    }
                }

                // Verify admin exists for FK safety
                $adminValidId = null;
                if ($adminId > 0) {
                    $aCheck = $conn->prepare("SELECT id FROM admins WHERE id = ?");
                    $aCheck->execute([$adminId]);
                    if ($aCheck->fetch()) {
                        $adminValidId = $adminId;
                    }
                }

                // Update service request status and audit fields
                $conn->prepare("
                    UPDATE service_requests 
                    SET status = 'ملغي', cancelled_at = NOW(), cancelled_by_admin_id = ?, cancellation_reason = ?, refund_status = ? 
                    WHERE id = ?
                ")->execute([$adminValidId, $cancellationReason, $refundStatus, $id]);

            } else {
                // Non-cancellation status transition (e.g. قيد التنفيذ, مكتمل)
                if ($currentStatus === 'ملغي') {
                    $conn->rollBack();
                    http_response_code(400);
                    echo json_encode(["status" => "error", "error_code" => "CANNOT_REOPEN_CANCELLED", "message" => "لا يمكن إعادة فتح أو تغيير حالة طلب ملغي"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $conn->prepare("UPDATE service_requests SET status = ? WHERE id = ?")->execute([$status, $id]);
            }

            // Notification mappings & chat message
            $statusMapAr = ['جديد' => 'جديد', 'قيد المراجعة' => 'قيد المراجعة', 'قيد التنفيذ' => 'قيد التنفيذ', 'مكتمل' => 'مكتمل', 'ملغي' => 'ملغي'];
            $statusMapEn = ['جديد' => 'New', 'قيد المراجعة' => 'Under Review', 'قيد التنفيذ' => 'In Progress', 'مكتمل' => 'Completed', 'ملغي' => 'Cancelled'];
            $statusAr = $statusMapAr[$status] ?? $status;
            $statusEn = $statusMapEn[$status] ?? $status;
            $svcTitleAr = (!empty($reqData['title_ar'])) ? $reqData['title_ar'] : ($reqData['service_title'] ?? '');
            $svcTitleEn = (!empty($reqData['title_en'])) ? $reqData['title_en'] : ($reqData['service_title'] ?? '');

            if ($status !== 'ملغي' && !empty($reqData['student_id'])) {
                $studentId = intval($reqData['student_id']);
                $notifTitleAr = "تحديث حالة الطلب (#$id)";
                $notifBodyAr = "تم تغيير حالة طلبك الخاص بـ ($svcTitleAr) إلى: $statusAr";
                $notifTitleEn = "Request Update (#$id)";
                $notifBodyEn = "The status of your request for ($svcTitleEn) has been changed to: $statusEn";
                sendStudentNotification($studentId, $notifTitleAr, $notifBodyAr, $notifTitleEn, $notifBodyEn);
            }

            // Insert status update in chat if sendChat is enabled
            if ($sendChat && (!empty($reqData['student_id']) || !empty($reqData['student_phone']))) {
                $studentId = intval($reqData['student_id'] ?? 0);
                $phone = $reqData['student_phone'] ?? '';
                $chat = null;
                if ($studentId > 0) {
                    $stmtChat = $conn->prepare("SELECT id FROM chats WHERE student_id = ?");
                    $stmtChat->execute([$studentId]);
                    $chat = $stmtChat->fetch();
                }
                if (!$chat && !empty($phone)) {
                    $stmtChat = $conn->prepare("SELECT id FROM chats WHERE phone = ?");
                    $stmtChat->execute([$phone]);
                    $chat = $stmtChat->fetch();
                }

                if (!empty($customMessage)) {
                    $msgText = $customMessage;
                } else {
                    $stmtTpl = $conn->prepare("SELECT * FROM status_reply_templates WHERE status_key = ? AND is_enabled = 1");
                    $stmtTpl->execute([$status]);
                    $tplRow = $stmtTpl->fetch(PDO::FETCH_ASSOC);

                    if ($tplRow) {
                        $searchVals = ['{id}', '{service}', '{status}', '{reason}', '{points}'];
                        $replaceValsAr = [$id, $svcTitleAr, $statusAr, $cancellationReason, $pointsRefunded ?? 0];
                        $replaceValsEn = [$id, $svcTitleEn, $statusEn, $cancellationReason, $pointsRefunded ?? 0];

                        $renderedAr = str_replace($searchVals, $replaceValsAr, $tplRow['template_ar']);
                        $renderedEn = str_replace($searchVals, $replaceValsEn, $tplRow['template_en']);

                        if ($msgLang === 'en') {
                            $msgText = $renderedEn;
                        } elseif ($msgLang === 'both') {
                            $msgText = $renderedAr . "\n\n" . $renderedEn;
                        } else {
                            $msgText = $renderedAr;
                        }
                    } else {
                        $msgText = ($status === 'ملغي')
                            ? "تحديث الطلب (#$id): تم إلغاء طلبك الخاص بـ ($svcTitleAr).\nالسبب: $cancellationReason" . (($pointsRefunded ?? 0) > 0 ? "\n[تم استرجاع $pointsRefunded نقطة إلى محفظتك بنجاح]" : "")
                            : "تحديث الطلب (#$id): تم تغيير حالة طلبك الخاص بـ ($svcTitleAr) إلى: * $statusAr *";
                    }
                }

                if ($chat) {
                    $chatId = $chat['id'];
                    $conn->prepare("UPDATE chats SET last_msg = ?, status = 'تحديث الطلب', updated_at = NOW() WHERE id = ?")->execute([$msgText, $chatId]);
                } else {
                    $conn->prepare("INSERT INTO chats (student_id, student_name, phone, last_msg, status, updated_at) VALUES (?, ?, ?, ?, 'تحديث الطلب', NOW())")
                         ->execute([$studentId, $reqData['student_name'] ?? 'طالب', $phone, $msgText]);
                    $chatId = $conn->lastInsertId();
                }

                $stmtMsg = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, text) VALUES (?, 'admin', ?)");
                $stmtMsg->execute([$chatId, $msgText]);
            }

            $conn->commit();

            echo json_encode([
                "status" => "success",
                "message" => ($status === 'ملغي') ? "تم إلغاء الطلب ومعالجة الاسترجاع بنجاح" : "تم تحديث حالة الطلب",
                "data" => [
                    "id" => $id,
                    "status" => $status,
                    "points_refunded" => $pointsRefunded ?? 0,
                    "promo_reversed" => $promoReversed ?? false,
                    "refund_status" => $refundStatus ?? 'none'
                ]
            ], JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "فشل تحديث حالة الطلب: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'get_status_templates') {
        $templates = $conn->query("SELECT * FROM status_reply_templates ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "templates" => $templates], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'update_status_template') {
        $id = intval($data['id'] ?? 0);
        $template_ar = trim($data['template_ar'] ?? '');
        $template_en = trim($data['template_en'] ?? '');
        $is_enabled = isset($data['is_enabled']) ? (int)$data['is_enabled'] : 1;

        if ($id > 0 && !empty($template_ar)) {
            $stmt = $conn->prepare("UPDATE status_reply_templates SET template_ar = ?, template_en = ?, is_enabled = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$template_ar, $template_en, $is_enabled, $id]);
            echo json_encode(["status" => "success", "message" => "تم حفظ القالب بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status" => "error", "message" => "بيانات القالب غير صالحة"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    // ── Promo Code CRUD Actions ──────────────────────────────────────────────
    if ($action === 'add_promo_code') {
        $campaignName = trim($data['campaign_name'] ?? '');
        $code = strtoupper(trim($data['code'] ?? ''));
        $discountType = trim($data['discount_type'] ?? 'percentage');
        $discountValue = floatval($data['discount_value'] ?? 0.0);
        $maxDiscountPoints = !empty($data['max_discount_points']) ? intval($data['max_discount_points']) : null;
        $minServicePrice = intval($data['min_service_price_points'] ?? 0);
        $startAt = !empty($data['start_at']) ? trim($data['start_at']) : null;
        $expiresAt = !empty($data['expires_at']) ? trim($data['expires_at']) : null;
        $status = in_array($data['status'] ?? '', ['active', 'paused']) ? $data['status'] : 'active';
        $serviceScope = in_array($data['service_scope'] ?? '', ['all', 'selected']) ? $data['service_scope'] : 'all';
        $serviceIds = is_array($data['service_ids'] ?? null) ? $data['service_ids'] : [];
        $audienceScope = in_array($data['audience_scope'] ?? '', ['all', 'selected']) ? $data['audience_scope'] : 'all';
        $studentIds = is_array($data['student_ids'] ?? null) ? $data['student_ids'] : [];
        $totalUsageLimit = !empty($data['total_usage_limit']) ? intval($data['total_usage_limit']) : null;
        $perStudentLimit = isset($data['per_student_limit']) ? intval($data['per_student_limit']) : 1;

        if (empty($campaignName)) {
            echo json_encode(["status" => "error", "message" => "اسم الحملة مطلوب"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (empty($code) || !preg_match('/^[A-Z0-9_-]{3,50}$/', $code)) {
            echo json_encode(["status" => "error", "message" => "كود الخصم يجب أن يتكون من 3-50 حرفاً وأرقاماً إنجليزية"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (!in_array($discountType, ['percentage', 'fixed', 'free'])) {
            echo json_encode(["status" => "error", "message" => "نوع الخصم غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($discountType === 'percentage' && ($discountValue <= 0 || $discountValue > 100)) {
            echo json_encode(["status" => "error", "error_code" => "INVALID_DISCOUNT_VALUE", "message" => "نسبة الخصم يجب أن تكون بين 1 و 100%"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($discountType === 'fixed' && $discountValue <= 0) {
            echo json_encode(["status" => "error", "error_code" => "INVALID_DISCOUNT_VALUE", "message" => "قيمة الخصم الثابت يجب أن تكون أكبر من صفر"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($startAt && $expiresAt && $startAt >= $expiresAt) {
            echo json_encode(["status" => "error", "error_code" => "INVALID_DATE_RANGE", "message" => "تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($serviceScope === 'selected' && empty($serviceIds)) {
            echo json_encode(["status" => "error", "error_code" => "EMPTY_SERVICES", "message" => "يرجى تحديد خدمة واحدة على الأقل عند اختيار نطاق خدمات محددة"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($audienceScope === 'selected' && empty($studentIds)) {
            echo json_encode(["status" => "error", "error_code" => "EMPTY_STUDENTS", "message" => "يرجى تحديد طالب واحد على الأقل عند اختيار نطاق جمهور محدد"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($serviceScope === 'selected' && !empty($serviceIds)) {
            $placeholders = implode(',', array_fill(0, count($serviceIds), '?'));
            $chkSvc = $conn->prepare("SELECT COUNT(*) FROM services WHERE id IN ($placeholders)");
            $chkSvc->execute(array_map('intval', $serviceIds));
            if ((int)$chkSvc->fetchColumn() !== count($serviceIds)) {
                echo json_encode(["status" => "error", "error_code" => "INVALID_SERVICE_IDS", "message" => "بعض الخدمات المحددة غير موجودة في النظام"], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }
        if ($audienceScope === 'selected' && !empty($studentIds)) {
            $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
            $chkStd = $conn->prepare("SELECT COUNT(*) FROM students WHERE id IN ($placeholders)");
            $chkStd->execute(array_map('intval', $studentIds));
            if ((int)$chkStd->fetchColumn() !== count($studentIds)) {
                echo json_encode(["status" => "error", "error_code" => "INVALID_STUDENT_IDS", "message" => "بعض الطلاب المحددون غير موجودين في النظام"], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }
        if ($totalUsageLimit !== null && $totalUsageLimit <= 0) {
            echo json_encode(["status" => "error", "error_code" => "INVALID_TOTAL_LIMIT", "message" => "الحد الأقصى للاستخدام الكلي يجب أن يكون أكبر من صفر"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($perStudentLimit <= 0) {
            echo json_encode(["status" => "error", "error_code" => "INVALID_PER_STUDENT_LIMIT", "message" => "الحد الأقصى لكل طالب يجب أن يكون أكبر من صفر"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Check unique code
        $checkStmt = $conn->prepare("SELECT id FROM promo_codes WHERE code = ?");
        $checkStmt->execute([$code]);
        if ($checkStmt->fetch()) {
            echo json_encode(["status" => "error", "error_code" => "CODE_EXISTS", "message" => "كود الخصم مستخدم بالفعل، يرجى اختيار كود آخر"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        try {
            $conn->beginTransaction();
            $stmt = $conn->prepare("
                INSERT INTO promo_codes (
                    campaign_name, code, discount_type, discount_value, max_discount_points,
                    min_service_price_points, start_at, expires_at, status, service_scope,
                    audience_scope, total_usage_limit, per_student_limit, used_count, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
            ");
            $stmt->execute([
                $campaignName, $code, $discountType, ($discountType === 'free' ? 0.0 : $discountValue),
                $maxDiscountPoints, $minServicePrice, $startAt, $expiresAt, $status,
                $serviceScope, $audienceScope, $totalUsageLimit, $perStudentLimit
            ]);
            $promoId = $conn->lastInsertId();

            if ($serviceScope === 'selected' && !empty($serviceIds)) {
                $insSvc = $conn->prepare("INSERT IGNORE INTO promo_code_services (promo_code_id, service_id) VALUES (?, ?)");
                foreach ($serviceIds as $sId) {
                    $insSvc->execute([$promoId, intval($sId)]);
                }
            }

            if ($audienceScope === 'selected' && !empty($studentIds)) {
                $insStd = $conn->prepare("INSERT IGNORE INTO promo_code_students (promo_code_id, student_id) VALUES (?, ?)");
                foreach ($studentIds as $stId) {
                    $insStd->execute([$promoId, intval($stId)]);
                }
            }

            $conn->commit();
            echo json_encode(["status" => "success", "message" => "تم إنشاء كود الخصم بنجاح", "id" => $promoId], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            echo json_encode(["status" => "error", "message" => "فشل إنشاء كود الخصم: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'update_promo_code') {
        $id = intval($data['id'] ?? 0);
        $campaignName = trim($data['campaign_name'] ?? '');
        $code = strtoupper(trim($data['code'] ?? ''));
        $discountType = trim($data['discount_type'] ?? 'percentage');
        $discountValue = floatval($data['discount_value'] ?? 0.0);
        $maxDiscountPoints = !empty($data['max_discount_points']) ? intval($data['max_discount_points']) : null;
        $minServicePrice = intval($data['min_service_price_points'] ?? 0);
        $startAt = !empty($data['start_at']) ? trim($data['start_at']) : null;
        $expiresAt = !empty($data['expires_at']) ? trim($data['expires_at']) : null;
        $status = in_array($data['status'] ?? '', ['active', 'paused', 'archived']) ? $data['status'] : 'active';
        $serviceScope = in_array($data['service_scope'] ?? '', ['all', 'selected']) ? $data['service_scope'] : 'all';
        $serviceIds = is_array($data['service_ids'] ?? null) ? $data['service_ids'] : [];
        $audienceScope = in_array($data['audience_scope'] ?? '', ['all', 'selected']) ? $data['audience_scope'] : 'all';
        $studentIds = is_array($data['student_ids'] ?? null) ? $data['student_ids'] : [];
        $totalUsageLimit = !empty($data['total_usage_limit']) ? intval($data['total_usage_limit']) : null;
        $perStudentLimit = !empty($data['per_student_limit']) ? intval($data['per_student_limit']) : 1;

        if ($id <= 0) {
            echo json_encode(["status" => "error", "error_code" => "INVALID_ID", "message" => "معرف كود الخصم غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $exStmt = $conn->prepare("SELECT * FROM promo_codes WHERE id = ?");
        $exStmt->execute([$id]);
        $existing = $exStmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            echo json_encode(["status" => "error", "error_code" => "PROMO_NOT_FOUND", "message" => "كود الخصم غير موجود"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Immutability: If code was already used, code string cannot be modified
        if ($existing['used_count'] > 0 && $existing['code'] !== $code) {
            echo json_encode(["status" => "error", "error_code" => "CODE_IMMUTABLE", "message" => "لا يمكن تعديل رمز الكود بعد استخدامه من قبل الطلاب للحفاظ على سجلات التدقيق"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        if (empty($campaignName)) {
            echo json_encode(["status" => "error", "message" => "اسم الحملة مطلوب"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (empty($code) || !preg_match('/^[A-Z0-9_-]{3,50}$/', $code)) {
            echo json_encode(["status" => "error", "message" => "صيغة كود الخصم غير صالحة"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($startAt && $expiresAt && $startAt >= $expiresAt) {
            echo json_encode(["status" => "error", "message" => "تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        try {
            $conn->beginTransaction();
            $stmt = $conn->prepare("
                UPDATE promo_codes SET
                    campaign_name = ?, code = ?, discount_type = ?, discount_value = ?,
                    max_discount_points = ?, min_service_price_points = ?, start_at = ?,
                    expires_at = ?, status = ?, service_scope = ?, audience_scope = ?,
                    total_usage_limit = ?, per_student_limit = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $campaignName, $code, $discountType, ($discountType === 'free' ? 0.0 : $discountValue),
                $maxDiscountPoints, $minServicePrice, $startAt, $expiresAt, $status,
                $serviceScope, $audienceScope, $totalUsageLimit, $perStudentLimit, $id
            ]);

            // Sync junction tables
            $conn->prepare("DELETE FROM promo_code_services WHERE promo_code_id = ?")->execute([$id]);
            if ($serviceScope === 'selected' && !empty($serviceIds)) {
                $insSvc = $conn->prepare("INSERT INTO promo_code_services (promo_code_id, service_id) VALUES (?, ?)");
                foreach ($serviceIds as $sId) {
                    $insSvc->execute([$id, intval($sId)]);
                }
            }

            $conn->prepare("DELETE FROM promo_code_students WHERE promo_code_id = ?")->execute([$id]);
            if ($audienceScope === 'selected' && !empty($studentIds)) {
                $insStd = $conn->prepare("INSERT INTO promo_code_students (promo_code_id, student_id) VALUES (?, ?)");
                foreach ($studentIds as $stId) {
                    $insStd->execute([$id, intval($stId)]);
                }
            }

            $conn->commit();
            echo json_encode(["status" => "success", "message" => "تم تحديث كود الخصم بنجاح"], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            echo json_encode(["status" => "error", "message" => "فشل تحديث كود الخصم: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'toggle_promo_code_status') {
        $id = intval($data['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف كود الخصم غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $pStmt = $conn->prepare("SELECT id, status FROM promo_codes WHERE id = ?");
        $pStmt->execute([$id]);
        $promo = $pStmt->fetch(PDO::FETCH_ASSOC);
        if (!$promo) {
            echo json_encode(["status" => "error", "message" => "كود الخصم غير موجود"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $newStatus = ($promo['status'] === 'active') ? 'paused' : 'active';
        $conn->prepare("UPDATE promo_codes SET status = ? WHERE id = ?")->execute([$newStatus, $id]);
        echo json_encode(["status" => "success", "message" => "تم تغيير حالة الكود بنجاح", "new_status" => $newStatus], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'archive_promo_code') {
        $id = intval($data['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف كود الخصم غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $conn->prepare("UPDATE promo_codes SET status = 'archived' WHERE id = ?")->execute([$id]);
        echo json_encode(["status" => "success", "message" => "تم أرشفة كود الخصم بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'get_promo_redemptions') {
        $promoId = intval($_GET['promo_id'] ?? $data['promo_id'] ?? 0);
        $page = max(1, intval($_GET['page'] ?? $data['page'] ?? 1));
        $limit = max(1, min(100, intval($_GET['limit'] ?? $data['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        if ($promoId <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف كود الخصم غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $cntStmt = $conn->prepare("SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = ?");
        $cntStmt->execute([$promoId]);
        $total = intval($cntStmt->fetchColumn());

        $stmt = $conn->prepare("
            SELECT r.*, DATE_FORMAT(r.created_at, '%Y-%m-%d %h:%i %p') AS formatted_date,
                   DATE_FORMAT(r.reversed_at, '%Y-%m-%d %h:%i %p') AS formatted_reversed_date
            FROM promo_code_redemptions r
            WHERE r.promo_code_id = ?
            ORDER BY r.id DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->bindValue(1, $promoId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->bindValue(3, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $redemptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => [
                "redemptions" => $redemptions,
                "pagination" => [
                    "total" => $total,
                    "page" => $page,
                    "limit" => $limit,
                    "total_pages" => ceil($total / $limit)
                ]
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'ensure_support_chat') {
        $studentId = intval($data['student_id'] ?? 0);
        if ($studentId <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الطالب غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Check student exists
        $stuStmt = $conn->prepare("SELECT id, full_name, university, phone FROM students WHERE id = ?");
        $stuStmt->execute([$studentId]);
        $student = $stuStmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            echo json_encode(["status" => "error", "message" => "الطالب غير موجود"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Search by student_id first, then by phone if orphaned
        $chatStmt = $conn->prepare("SELECT id FROM chats WHERE student_id = ?");
        $chatStmt->execute([$studentId]);
        $chat = $chatStmt->fetch(PDO::FETCH_ASSOC);

        if (!$chat && !empty($student['phone'])) {
            $chatPhoneStmt = $conn->prepare("SELECT id FROM chats WHERE phone = ?");
            $chatPhoneStmt->execute([$student['phone']]);
            $chatPhone = $chatPhoneStmt->fetch(PDO::FETCH_ASSOC);
            if ($chatPhone) {
                // Link existing chat to this student_id
                $conn->prepare("UPDATE chats SET student_id = ? WHERE id = ?")->execute([$studentId, $chatPhone['id']]);
                $chat = $chatPhone;
            }
        }

        if (!$chat) {
            $ins = $conn->prepare("INSERT INTO chats (student_id, student_name, student_uni, phone, last_msg, status, updated_at) VALUES (?, ?, ?, ?, '', 'جديد', NOW())");
            $ins->execute([
                $studentId,
                $student['full_name'],
                $student['university'] ?? 'جامعة في جورجيا',
                $student['phone'] ?? ''
            ]);
            $chatId = intval($conn->lastInsertId());
        } else {
            $chatId = intval($chat['id']);
        }

        echo json_encode(["status" => "success", "data" => ["chat_id" => $chatId]], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'delete_chat') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(["status" => "error", "message" => "Method not allowed"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        $chatId = intval($data['chat_id'] ?? 0);
        if ($chatId <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف المحادثة غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        try {
            $conn->beginTransaction();

            // Delete dependent messages first (relying on lack of CASCADE in DB)
            $stmtMsgs = $conn->prepare("DELETE FROM chat_messages WHERE chat_id = ?");
            $stmtMsgs->execute([$chatId]);

            // Delete parent chat
            $stmtChat = $conn->prepare("DELETE FROM chats WHERE id = ?");
            $stmtChat->execute([$chatId]);

            if ($stmtChat->rowCount() > 0) {
                $conn->commit();
                echo json_encode(["status" => "success", "message" => "تم حذف المحادثة بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                $conn->rollBack();
                echo json_encode(["status" => "error", "message" => "لم يتم العثور على المحادثة أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } catch (PDOException $e) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            echo json_encode(["status" => "error", "message" => "حدث خطأ في قاعدة البيانات: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'add_student') {
        $fullName = trim($data['full_name'] ?? '');
        $email    = trim($data['email']     ?? '');
        $phone    = trim($data['phone']     ?? '');
        $uni         = trim($data['university'] ?? 'جامعة في جورجيا');
        $nationality = trim($data['nationality'] ?? '');
        $password    = $data['password'] ?? '12345678';

        if (empty($fullName) || strlen($fullName) < 3) {
            echo json_encode(["status"=>"error","message"=>"الاسم الكامل مطلوب (3 أحرف على الأقل)"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(["status"=>"error","message"=>"البريد الإلكتروني غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (empty($phone)) {
            echo json_encode(["status"=>"error","message"=>"رقم الهاتف مطلوب"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (empty($nationality)) {
            echo json_encode(["status"=>"error","message"=>"حقل الجنسية مطلوب"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (strlen($password) < 6) {
            $password = '12345678';
        }

        // Check persistent blocklist
        $blocked = isIdentityBlocked($conn, $email, $phone);
        if ($blocked) {
            $reasonMsg = !empty($blocked['reason']) ? " (السبب: {$blocked['reason']})" : "";
            echo json_encode(["status"=>"error","message"=>"هذا البريد أو رقم الهاتف محظور من قبل الإدارة{$reasonMsg}"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Check uniqueness
        $chk = $conn->prepare("SELECT id, email, phone FROM students WHERE email = ? OR phone = ? LIMIT 1");
        $chk->execute([$email, $phone]);
        $dup = $chk->fetch(PDO::FETCH_ASSOC);
        if ($dup) {
            $msg = strcasecmp($dup['email'], $email) === 0 ? "البريد الإلكتروني مسجل مسبقاً" : "رقم الهاتف مسجل مسبقاً";
            echo json_encode(["status"=>"error","message"=>$msg], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO students (full_name, email, phone, password, university, nationality, points, is_blocked) VALUES (?, ?, ?, ?, ?, ?, 0, 0)");
        $stmt->execute([$fullName, $email, $phone, $passwordHash, $uni, $nationality]);
        if ($stmt->rowCount() > 0) {
            echo json_encode(["status"=>"success","message"=>"تم إضافة الطالب بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"فشل في إضافة الطالب"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_student') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف الحساب بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على العنصر أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الطالب غير صالح"], JSON_UNESCAPED_UNICODE);
        }

        exit();
    }

    if ($action === 'change_student_password') {
        $id = intval($data['id'] ?? 0);
        $newPassword = trim($data['password'] ?? '');

        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الطالب غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (strlen($newPassword) < 6) {
            echo json_encode(["status" => "error", "message" => "كلمة المرور يجب أن تكون 6 أحرف على الأقل"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE students SET password = ? WHERE id = ?");
        $stmt->execute([$passwordHash, $id]);

        echo json_encode(["status" => "success", "message" => "تم تغيير كلمة المرور بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'update_student_admin_meta') {
        $id = intval($data['id'] ?? 0);
        $adminStatus = isset($data['admin_status']) ? trim($data['admin_status']) : null;
        $adminNote = isset($data['admin_note']) ? trim($data['admin_note']) : null;

        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الطالب غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $stmt = $conn->prepare("UPDATE students SET admin_status = ?, admin_note = ? WHERE id = ?");
        $stmt->execute([$adminStatus !== '' ? $adminStatus : null, $adminNote !== '' ? $adminNote : null, $id]);

        echo json_encode(["status" => "success", "message" => "تم حفظ الملاحظات والحالة بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'block_student') {
        $id = intval($data['id'] ?? 0);
        $reason = trim($data['reason'] ?? 'حظر بواسطة الإدارة');

        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الطالب غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $stuStmt = $conn->prepare("SELECT id, email, phone FROM students WHERE id = ?");
        $stuStmt->execute([$id]);
        $student = $stuStmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            echo json_encode(["status" => "error", "message" => "الطالب غير موجود"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // 1. Mark student account as blocked
        $upd = $conn->prepare("UPDATE students SET is_blocked = 1 WHERE id = ?");
        $upd->execute([$id]);

        // 2. Persist in blocked_identities
        $normEmail = normalizeIdentityEmail($student['email']);
        $normPhone = normalizeIdentityPhone($student['phone']);

        if (!empty($normEmail)) {
            $ins = $conn->prepare("INSERT INTO blocked_identities (identifier_type, identifier_value, normalized_value, source_student_id, reason, created_by_admin) VALUES ('email', ?, ?, ?, ?, 'Admin') ON DUPLICATE KEY UPDATE reason = VALUES(reason), source_student_id = VALUES(source_student_id)");
            $ins->execute([$student['email'], $normEmail, $id, $reason]);
        }

        if (!empty($normPhone)) {
            $ins = $conn->prepare("INSERT INTO blocked_identities (identifier_type, identifier_value, normalized_value, source_student_id, reason, created_by_admin) VALUES ('phone', ?, ?, ?, ?, 'Admin') ON DUPLICATE KEY UPDATE reason = VALUES(reason), source_student_id = VALUES(source_student_id)");
            $ins->execute([$student['phone'], $normPhone, $id, $reason]);
        }

        echo json_encode(["status" => "success", "message" => "تم حظر الطالب وإدراج معرفاته في قائمة الحظر بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'unblock_student') {
        $id = intval($data['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الطالب غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $stuStmt = $conn->prepare("SELECT id, email, phone FROM students WHERE id = ?");
        $stuStmt->execute([$id]);
        $student = $stuStmt->fetch(PDO::FETCH_ASSOC);

        if ($student) {
            $upd = $conn->prepare("UPDATE students SET is_blocked = 0 WHERE id = ?");
            $upd->execute([$id]);

            $normEmail = normalizeIdentityEmail($student['email']);
            $normPhone = normalizeIdentityPhone($student['phone']);

            $del = $conn->prepare("DELETE FROM blocked_identities WHERE source_student_id = ? OR (identifier_type = 'email' AND normalized_value = ?) OR (identifier_type = 'phone' AND normalized_value = ?)");
            $del->execute([$id, $normEmail, $normPhone]);
        } else {
            $del = $conn->prepare("DELETE FROM blocked_identities WHERE source_student_id = ?");
            $del->execute([$id]);
        }

        echo json_encode(["status" => "success", "message" => "تم إلغاء حظر الطالب بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'get_blocked_identities') {
        $list = $conn->query("SELECT id, identifier_type, identifier_value, normalized_value, source_student_id, reason, created_by_admin, created_at FROM blocked_identities ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => ["blocked_identities" => $list]], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'unblock_identity') {
        $id = intval($data['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الحظر غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $f = $conn->prepare("SELECT identifier_type, normalized_value, source_student_id FROM blocked_identities WHERE id = ?");
        $f->execute([$id]);
        $row = $f->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $del = $conn->prepare("DELETE FROM blocked_identities WHERE id = ?");
            $del->execute([$id]);

            // If this was linked to a student, check if they have any remaining blocks
            if (!empty($row['source_student_id'])) {
                $chk = $conn->prepare("SELECT COUNT(*) FROM blocked_identities WHERE source_student_id = ?");
                $chk->execute([$row['source_student_id']]);
                if ($chk->fetchColumn() == 0) {
                    $conn->prepare("UPDATE students SET is_blocked = 0 WHERE id = ?")->execute([$row['source_student_id']]);
                }
            }
        }

        echo json_encode(["status" => "success", "message" => "تم إلغاء الحظر بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'delete_chat_message') {
        $messageId = intval($data['message_id'] ?? 0);
        if ($messageId > 0) {
            $stmt = $conn->prepare("UPDATE chat_messages SET is_deleted = 1, text = 'تم حذف هذه الرسالة بواسطة المشرف' WHERE id = ?");
            $stmt->execute([$messageId]);
            echo json_encode(["status" => "success", "message" => "تم حذف الرسالة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status" => "error", "message" => "معرف الرسالة غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'edit_chat_message') {
        $messageId = intval($data['message_id'] ?? 0);
        $newText = trim($data['text'] ?? '');
        if ($messageId > 0 && !empty($newText)) {
            $stmt = $conn->prepare("UPDATE chat_messages SET text = ? WHERE id = ?");
            $stmt->execute([$newText, $messageId]);
            echo json_encode(["status" => "success", "message" => "تم تعديل الرسالة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status" => "error", "message" => "معرف الرسالة أو النص غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_request') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM service_requests WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف الطلب بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على العنصر أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الطلب غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'delete_review' || $action === 'delete_service_review') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM service_reviews WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف التقييم بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على العنصر أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف التقييم غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'moderate_service_review') {
        $id = intval($data['id'] ?? 0);
        $status = trim($data['status'] ?? '');
        $adminId = AuthMiddleware::$currentUserId;
        if ($id > 0 && in_array($status, ['approved', 'rejected'])) {
            // Get student_id before update
            $stmtRev = $conn->prepare("SELECT student_id FROM service_reviews WHERE id = ?");
            $stmtRev->execute([$id]);
            $revData = $stmtRev->fetch();

            $stmt = $conn->prepare("UPDATE service_reviews SET status = ?, reviewed_by_admin_id = ?, reviewed_at = NOW() WHERE id = ?");
            $stmt->execute([$status, $adminId, $id]);
            if ($stmt->rowCount() > 0) {
                if ($revData && !empty($revData['student_id'])) {
                    $studentId = intval($revData['student_id']);
                    $statusText = ($status === 'approved') ? 'مقبول ومفعّل' : 'مرفوض';
                    $notifTitle = "مراجعة التقييم";
                    $notifBody = "تم مراجعة تقييمك وحالته الآن: " . $statusText;
                    sendStudentNotification($studentId, $notifTitle, $notifBody);
                }
                echo json_encode(["status" => "success", "message" => "تم تحديث حالة التقييم بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status" => "error", "message" => "لم يتم العثور على التقييم أو لم يحدث تغيير"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "بيانات المراجعة غير صالحة"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'get_application_feedback') {
        $feedback = $conn->query("
            SELECT af.id, af.student_id, af.feedback_type, af.comment, af.status, af.reviewed_by_admin_id, af.reviewed_at,
                   DATE_FORMAT(af.created_at, '%Y-%m-%d %h:%i %p') AS date,
                   s.full_name AS student_name, s.university AS student_uni
            FROM application_feedback af
            JOIN students s ON af.student_id = s.id
            ORDER BY af.id DESC
        ")->fetchAll();
        echo json_encode(["status" => "success", "data" => ["feedback" => $feedback]], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'update_feedback_status') {
        $id = intval($data['id'] ?? 0);
        $status = trim($data['status'] ?? '');
        $adminId = AuthMiddleware::$currentUserId;
        if ($id > 0 && in_array($status, ['pending', 'reviewed', 'resolved'])) {
            // Get student_id and feedback_type before updating
            $stmtFeed = $conn->prepare("SELECT student_id, feedback_type FROM application_feedback WHERE id = ?");
            $stmtFeed->execute([$id]);
            $feedData = $stmtFeed->fetch();

            $stmt = $conn->prepare("UPDATE application_feedback SET status = ?, reviewed_by_admin_id = ?, reviewed_at = NOW() WHERE id = ?");
            $stmt->execute([$status, $adminId, $id]);
            if ($stmt->rowCount() > 0) {
                if ($feedData && !empty($feedData['student_id'])) {
                    $studentId = intval($feedData['student_id']);
                    $statusMap = ['pending' => 'قيد الانتظار', 'reviewed' => 'قيد المراجعة', 'resolved' => 'تم الحل'];
                    $statusText = $statusMap[$status] ?? $status;
                    $notifTitle = "تحديث حالة الملاحظة";
                    $notifBody = "تم تحديث حالة بلاغك/مقترحك الخاص بـ (" . $feedData['feedback_type'] . ") إلى: " . $statusText;
                    sendStudentNotification($studentId, $notifTitle, $notifBody);
                }
                echo json_encode(["status" => "success", "message" => "تم تحديث حالة البلاغ/المقترح بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status" => "error", "message" => "لم يتم العثور على البلاغ أو لم يحدث تغيير"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "بيانات البلاغ/المقترح غير صالحة"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'delete_feedback') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM application_feedback WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(["status"=>"success","message"=>"تم حذف البلاغ/المقترح بنجاح"], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(["status"=>"error","message"=>"لم يتم العثور على البلاغ أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف البلاغ غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='send_chat_reply') {
        $chatId = intval($data['chat_id'] ?? 0);
        $text = trim($data['text'] ??'');
        $type = trim($data['type'] ??'text');
        $imageUrl = trim($data['image_url'] ??'');
        $quoteText = trim($data['quote_text'] ??'');
        $quoteSender = trim($data['quote_sender'] ??'');

        if ($chatId > 0 && (!empty($text) || !empty($imageUrl))) {
            if (empty($text)) {
                $text = ($type ==='image') ?'صورة مرفقة من الإدارة': (($type ==='video') ?'فيديو مرفق من الإدارة':'رسالة مرفقة');
            }

            // Get student_id from chats
            $chatStmt = $conn->prepare("SELECT student_id FROM chats WHERE id = ?");
            $chatStmt->execute([$chatId]);
            $chatRow = $chatStmt->fetch();

            $stmt = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, text, type, image_url, quote_text, quote_sender) VALUES (?,'admin', ?, ?, ?, ?, ?)");
            $stmt->execute([$chatId, $text, $type, !empty($imageUrl) ? $imageUrl : null, !empty($quoteText) ? $quoteText : null, !empty($quoteSender) ? $quoteSender : null]);
            
            $conn->prepare("UPDATE chats SET last_msg = ?, status ='تم الرد ️'WHERE id = ?")->execute(['الرد:'. $text, $chatId]);

            if ($chatRow && !empty($chatRow['student_id'])) {
                $studentId = intval($chatRow['student_id']);
                $notifTitle = "رد جديد من الدعم الفني";
                $notifBody = "لديك رد جديد على استفسارك في الشات المباشر";
                sendStudentNotification($studentId, $notifTitle, $notifBody);
            }

            echo json_encode(["status"=>"success","message"=>"تم إرسال الرد المرفق بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"البيانات المطلوبة غير مكتملة"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'update_student_points') {
        $studentId = intval($data['student_id'] ?? 0);
        $amount    = intval($data['amount'] ?? 0);
        $operation = trim($data['operation'] ?? '');
        $reason    = trim($data['reason'] ?? '');

        // ── Input validation (before any DB work) ──────────────────────────
        if ($studentId <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الطالب غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($amount <= 0) {
            echo json_encode(["status" => "error", "message" => "المبلغ يجب أن يكون أكبر من الصفر"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (!in_array($operation, ['add', 'deduct'])) {
            echo json_encode(["status" => "error", "message" => "نوع العملية غير صالح (add أو deduct)"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        $typeLabel = ($operation === 'add') ? 'credit' : 'debit';
        $descText  = !empty($reason) ? $reason
                   : ($operation === 'add' ? 'إضافة نقاط من الإدارة' : 'خصم نقاط من الإدارة');

        try {
            $conn->beginTransaction();

            // ── Step 1: Lock the student row and read current balance ───────
            $lockStmt = $conn->prepare("SELECT id, points FROM students WHERE id = ? FOR UPDATE");
            $lockStmt->execute([$studentId]);
            $student = $lockStmt->fetch(PDO::FETCH_ASSOC);

            if (!$student) {
                $conn->rollBack();
                echo json_encode(["status" => "error", "message" => "الطالب غير موجود"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            $currentPoints = (int)$student['points'];

            // ── Step 2: For deduction — compare balance in PHP (no ambiguity) ─
            if ($operation === 'deduct' && $currentPoints < $amount) {
                $conn->rollBack();
                echo json_encode([
                    "status"  => "error",
                    "message" => "رصيد النقاط غير كافٍ (الرصيد الحالي: {$currentPoints})"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // ── Step 3: Update students.points ─────────────────────────────
            if ($operation === 'add') {
                $updateStmt = $conn->prepare("UPDATE students SET points = points + ? WHERE id = ?");
                $updateStmt->execute([$amount, $studentId]);
            } else {
                $updateStmt = $conn->prepare("UPDATE students SET points = points - ? WHERE id = ?");
                $updateStmt->execute([$amount, $studentId]);
            }

            // ── Step 4: Insert wallet_transactions ─────────────────────────
            $txStmt = $conn->prepare(
                "INSERT INTO wallet_transactions (student_id, amount, type, description, created_at)
                 VALUES (?, ?, ?, ?, NOW())"
            );
            $txStmt->execute([$studentId, $amount, $typeLabel, $descText]);

            // ── Step 4.5: Send targeted notification to the student ─────────
            $notifTitle = ($operation === 'add') ? "شحن نقاط المحفظة" : "خصم نقاط من المحفظة";
            sendStudentNotification($studentId, $notifTitle, $descText);

            $conn->commit();

            // ── Step 5: Return real balance from MySQL ─────────────────────
            $balStmt = $conn->prepare("SELECT points FROM students WHERE id = ? LIMIT 1");
            $balStmt->execute([$studentId]);
            $newBalance = (int)($balStmt->fetchColumn() ?? 0);

            echo json_encode([
                "status"      => "success",
                "message"     => "تم تحديث النقاط بنجاح",
                "new_balance" => $newBalance
            ], JSON_UNESCAPED_UNICODE);

        } catch (PDOException $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            echo json_encode(["status" => "error", "message" => "Wallet transaction failed"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    // ── Helper function for validating and normalizing dates ───────────────
    function parseAndValidateDatetime($val, $fieldName) {
        if ($val === null || trim($val) === '' || trim($val) === 'null') {
            return null;
        }
        $val = str_replace('T', ' ', trim($val));
        // Check YYYY-MM-DD HH:MM:SS
        $d1 = DateTime::createFromFormat('Y-m-d H:i:s', $val);
        if ($d1 && $d1->format('Y-m-d H:i:s') === $val) {
            return $val;
        }
        // Check YYYY-MM-DD HH:MM
        $d2 = DateTime::createFromFormat('Y-m-d H:i', $val);
        if ($d2 && $d2->format('Y-m-d H:i') === $val) {
            return $d2->format('Y-m-d H:i:00');
        }
        // Reject invalid formats
        echo json_encode(["status" => "error", "message" => "تنسيق تاريخ {$fieldName} غير صالح. يجب أن يكون YYYY-MM-DD HH:MM"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'add_housing_offer') {
        $apartment_id   = isset($data['apartment_id']) ? intval($data['apartment_id']) : 0;
        $title_ar       = isset($data['title_ar']) ? trim($data['title_ar']) : (isset($data['title']) ? trim($data['title']) : '');
        $title_en       = isset($data['title_en']) ? trim($data['title_en']) : '';
        $description_ar = isset($data['description_ar']) ? trim($data['description_ar']) : (isset($data['description']) ? trim($data['description']) : '');
        $description_en = isset($data['description_en']) ? trim($data['description_en']) : '';
        $original_price = isset($data['original_price']) ? floatval($data['original_price']) : 0.0;
        $offer_price    = isset($data['offer_price']) ? floatval($data['offer_price']) : 0.0;
        $badge_text_ar  = isset($data['badge_text_ar']) && trim($data['badge_text_ar']) !== '' ? trim($data['badge_text_ar']) : (isset($data['badge_text']) && trim($data['badge_text']) !== '' ? trim($data['badge_text']) : null);
        $badge_text_en  = isset($data['badge_text_en']) && trim($data['badge_text_en']) !== '' ? trim($data['badge_text_en']) : null;
        $image_url      = isset($data['image_url']) && trim($data['image_url']) !== '' ? trim($data['image_url']) : null;
        $is_active      = isset($data['is_active']) ? (intval($data['is_active']) ? 1 : 0) : 1;
        $display_order  = isset($data['display_order']) ? intval($data['display_order']) : 0;

        $title = $title_ar;
        $description = $description_ar;
        $badge_text = $badge_text_ar;

        $starts_at  = parseAndValidateDatetime($data['starts_at'] ?? null, 'تاريخ البدء');
        $expires_at = parseAndValidateDatetime($data['expires_at'] ?? null, 'تاريخ الانتهاء');

        // Validation checks
        if ($apartment_id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الشقة غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (empty($title)) {
            echo json_encode(["status" => "error", "message" => "عنوان العرض مطلوب"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($original_price <= 0) {
            echo json_encode(["status" => "error", "message" => "السعر الأصلي يجب أن يكون أكبر من الصفر"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($offer_price < 0) {
            echo json_encode(["status" => "error", "message" => "سعر العرض لا يمكن أن يكون سالباً"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($offer_price >= $original_price) {
            echo json_encode(["status" => "error", "message" => "يجب أن يكون سعر العرض أقل من السعر الأصلي"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($starts_at !== null && $expires_at !== null && strtotime($expires_at) <= strtotime($starts_at)) {
            echo json_encode(["status" => "error", "message" => "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Verify apartment exists
        $aptCheck = $conn->prepare("SELECT id FROM apartments WHERE id = ?");
        $aptCheck->execute([$apartment_id]);
        if (!$aptCheck->fetch()) {
            echo json_encode(["status" => "error", "message" => "الشقة المرتبطة غير موجودة"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Insert row
        $stmt = $conn->prepare("
            INSERT INTO housing_offers 
            (apartment_id, title, description, original_price, offer_price, badge_text, image_url, starts_at, expires_at, is_active, display_order, title_ar, title_en, description_ar, description_en, badge_text_ar, badge_text_en, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $apartment_id, $title, $description, $original_price, $offer_price,
            $badge_text, $image_url, $starts_at, $expires_at, $is_active, $display_order,
            $title_ar, $title_en, $description_ar, $description_en, $badge_text_ar, $badge_text_en
        ]);

        $newOfferId = intval($conn->lastInsertId());
        echo json_encode(["status" => "success", "id" => $newOfferId, "offer_id" => $newOfferId, "message" => "تم إضافة العرض بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'update_housing_offer') {
        $id = isset($data['id']) ? intval($data['id']) : 0;
        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف العرض غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Fetch existing record
        $stmtExist = $conn->prepare("SELECT * FROM housing_offers WHERE id = ?");
        $stmtExist->execute([$id]);
        $existing = $stmtExist->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            echo json_encode(["status" => "error", "message" => "العرض غير موجود"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Handle partial update merging
        $apartment_id   = isset($data['apartment_id']) ? intval($data['apartment_id']) : intval($existing['apartment_id']);
        
        $title_ar       = isset($data['title_ar']) ? trim($data['title_ar']) : $existing['title_ar'];
        $title_en       = isset($data['title_en']) ? trim($data['title_en']) : $existing['title_en'];
        $description_ar = isset($data['description_ar']) ? trim($data['description_ar']) : $existing['description_ar'];
        $description_en = isset($data['description_en']) ? trim($data['description_en']) : $existing['description_en'];
        $badge_text_ar  = array_key_exists('badge_text_ar', $data) ? (trim($data['badge_text_ar'] ?? '') !== '' ? trim($data['badge_text_ar']) : null) : $existing['badge_text_ar'];
        $badge_text_en  = array_key_exists('badge_text_en', $data) ? (trim($data['badge_text_en'] ?? '') !== '' ? trim($data['badge_text_en']) : null) : $existing['badge_text_en'];

        $original_price = isset($data['original_price']) ? floatval($data['original_price']) : floatval($existing['original_price']);
        $offer_price    = isset($data['offer_price']) ? floatval($data['offer_price']) : floatval($existing['offer_price']);
        
        $image_url      = array_key_exists('image_url', $data) ? (trim($data['image_url'] ?? '') !== '' ? trim($data['image_url']) : null) : $existing['image_url'];
        
        $is_active      = isset($data['is_active']) ? (intval($data['is_active']) ? 1 : 0) : intval($existing['is_active']);
        $display_order  = isset($data['display_order']) ? intval($data['display_order']) : intval($existing['display_order']);

        $starts_at  = array_key_exists('starts_at', $data) ? parseAndValidateDatetime($data['starts_at'] ?? null, 'تاريخ البدء') : $existing['starts_at'];
        $expires_at = array_key_exists('expires_at', $data) ? parseAndValidateDatetime($data['expires_at'] ?? null, 'تاريخ الانتهاء') : $existing['expires_at'];

        $title = $title_ar;
        $description = $description_ar;
        $badge_text = $badge_text_ar;

        // Validation checks
        if ($apartment_id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف الشقة غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if (empty($title)) {
            echo json_encode(["status" => "error", "message" => "عنوان العرض مطلوب"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($original_price <= 0) {
            echo json_encode(["status" => "error", "message" => "السعر الأصلي يجب أن يكون أكبر من الصفر"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($offer_price < 0) {
            echo json_encode(["status" => "error", "message" => "سعر العرض لا يمكن أن يكون سالباً"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($offer_price >= $original_price) {
            echo json_encode(["status" => "error", "message" => "يجب أن يكون سعر العرض أقل من السعر الأصلي"], JSON_UNESCAPED_UNICODE);
            exit();
        }
        if ($starts_at !== null && $expires_at !== null && strtotime($expires_at) <= strtotime($starts_at)) {
            echo json_encode(["status" => "error", "message" => "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Verify apartment exists if changed
        if ($apartment_id !== intval($existing['apartment_id'])) {
            $aptCheck = $conn->prepare("SELECT id FROM apartments WHERE id = ?");
            $aptCheck->execute([$apartment_id]);
            if (!$aptCheck->fetch()) {
                echo json_encode(["status" => "error", "message" => "الشقة المرتبطة غير موجودة"], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // Update row
        $stmt = $conn->prepare("
            UPDATE housing_offers 
            SET apartment_id = ?, title = ?, description = ?, original_price = ?, offer_price = ?, badge_text = ?, image_url = ?, starts_at = ?, expires_at = ?, is_active = ?, display_order = ?, title_ar = ?, title_en = ?, description_ar = ?, description_en = ?, badge_text_ar = ?, badge_text_en = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([
            $apartment_id, $title, $description, $original_price, $offer_price,
            $badge_text, $image_url, $starts_at, $expires_at, $is_active, $display_order,
            $title_ar, $title_en, $description_ar, $description_en, $badge_text_ar, $badge_text_en, $id
        ]);

        // If image_url was explicitly changed/removed, safely clean up old file if stored in managed housing_offers folder
        if ($image_url !== $existing['image_url'] && !empty($existing['image_url'])) {
            $oldClean = trim($existing['image_url']);
            if (strpos($oldClean, 'uploads/housing_offers/') === 0 || strpos($oldClean, 'uploads/housing_offers/') === 0) {
                $base = basename($oldClean);
                $paths = [
                    __DIR__ . '/../uploads/housing_offers/' . $base,
                    __DIR__ . '/../../uploads/housing_offers/' . $base,
                    __DIR__ . '/../uploads/housing_offers/' . $base,
                    __DIR__ . '/../../uploads/housing_offers/' . $base,
                ];
                foreach ($paths as $p) {
                    if (file_exists($p) && is_file($p)) {
                        @unlink($p);
                    }
                }
            }
        }

        echo json_encode(["status" => "success", "message" => "تم تعديل العرض بنجاح"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action === 'delete_housing_offer') {
        $id = isset($data['id']) ? intval($data['id']) : 0;
        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "معرف العرض غير صالح"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Fetch existing record first for image cleanup
        $stmtExist = $conn->prepare("SELECT image_url FROM housing_offers WHERE id = ?");
        $stmtExist->execute([$id]);
        $existingRow = $stmtExist->fetch(PDO::FETCH_ASSOC);

        $stmt = $conn->prepare("DELETE FROM housing_offers WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() > 0) {
            // Clean up custom offer image if stored in managed folder
            if ($existingRow && !empty($existingRow['image_url'])) {
                $oldClean = trim($existingRow['image_url']);
                if (strpos($oldClean, 'uploads/housing_offers/') === 0 || strpos($oldClean, 'uploads/housing_offers/') === 0) {
                    $base = basename($oldClean);
                    $paths = [
                        __DIR__ . '/../uploads/housing_offers/' . $base,
                        __DIR__ . '/../../uploads/housing_offers/' . $base,
                        __DIR__ . '/../uploads/housing_offers/' . $base,
                        __DIR__ . '/../../uploads/housing_offers/' . $base,
                    ];
                    foreach ($paths as $p) {
                        if (file_exists($p) && is_file($p)) {
                            @unlink($p);
                        }
                    }
                }
            }
            echo json_encode(["status" => "success", "message" => "تم حذف العرض بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status" => "error", "message" => "لم يتم العثور على العرض أو فشل الحذف"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action === 'reorder_housing_offers') {
        $orders = $data['orders'] ?? [];
        if (!is_array($orders)) {
            echo json_encode(["status" => "error", "message" => "بيانات الترتيب غير صالحة"], JSON_UNESCAPED_UNICODE);
            exit();
        }

        // Validate all IDs and display orders before updating
        foreach ($orders as $o) {
            $oid = intval($o['id'] ?? 0);
            if ($oid <= 0) {
                echo json_encode(["status" => "error", "message" => "معرف العرض غير صالح في قائمة إعادة الترتيب"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            $chk = $conn->prepare("SELECT id FROM housing_offers WHERE id = ?");
            $chk->execute([$oid]);
            if (!$chk->fetch()) {
                echo json_encode(["status" => "error", "message" => "العرض ذو المعرف {$oid} غير موجود"], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        $conn->beginTransaction();
        try {
            $stmt = $conn->prepare("UPDATE housing_offers SET display_order = ?, updated_at = NOW() WHERE id = ?");
            foreach ($orders as $o) {
                $stmt->execute([intval($o['display_order']), intval($o['id'])]);
            }
            $conn->commit();

            // Fetch final normalized order to return in response
            $finalOffers = $conn->query("SELECT id, display_order FROM housing_offers ORDER BY display_order ASC, id ASC")->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                "status" => "success",
                "message" => "تم تحديث الترتيب بنجاح",
                "orders" => $finalOffers
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode(["status" => "error", "message" => "فشل تحديث الترتيب: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }


    echo json_encode(["status"=>"error","message"=>"إجراء غير محدد أو غير معروف"], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(["status"=>"error","message"=>"خطأ في الخادم:". $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>

} catch (Throwable $e) { echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); exit; }
