<?php
// واجهة برمجة تطبيقات لوحة التحكم (Admin API Endpoint) لـ تطبيق وموقع أبشر جورجيا
require_once'../config/db.php';

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
$action = $_GET['action'] ?? ($data['action'] ??'');

try {
    if ($action ==='get_all') {
        // جلب الإحصائيات والكافة
        $apartments = $conn->query("SELECT * FROM apartments ORDER BY id DESC")->fetchAll();
        $services = $conn->query("SELECT * FROM services ORDER BY id DESC")->fetchAll();
        $students = $conn->query("SELECT id, full_name, email, phone, university, created_at FROM students ORDER BY id DESC")->fetchAll();
        $universities = $conn->query("SELECT * FROM universities ORDER BY id DESC")->fetchAll();
        $districts = $conn->query("SELECT * FROM districts ORDER BY id DESC")->fetchAll();
        $requests = $conn->query("SELECT * FROM service_requests ORDER BY id DESC")->fetchAll();
        $reviews = $conn->query("SELECT id, student_name, uni, rating, comment, DATE_FORMAT(created_at,'%Y-%m-%d') AS date FROM reviews ORDER BY id DESC")->fetchAll();
        $news = $conn->query("SELECT *, DATE_FORMAT(created_at,'%Y-%m-%d %h:%i %p') AS date FROM news ORDER BY created_at DESC")->fetchAll();
        $notifications = $conn->query("SELECT *, DATE_FORMAT(created_at,'%Y-%m-%d %h:%i %p') AS date FROM notifications ORDER BY created_at DESC")->fetchAll();

        // جلب المحادثات ورسائل كل محادثة
        $chats = $conn->query("SELECT * FROM chats ORDER BY updated_at DESC")->fetchAll();
        foreach ($chats as &$c) {
            $stmtMsg = $conn->prepare("SELECT sender, text, type, image_url AS imageUrl, quote_text AS quoteText, quote_sender AS quoteSender, is_deleted AS deleted, DATE_FORMAT(created_at,'%h:%i %p') AS time FROM chat_messages WHERE chat_id = ? ORDER BY id ASC");
            $stmtMsg->execute([$c['id']]);
            $msgs = $stmtMsg->fetchAll();
            foreach ($msgs as &$m) {
                $m['deleted'] = ($m['deleted'] == 1 || $m['deleted'] === true);
            }
            $c['messages'] = $msgs;
            $c['time'] = !empty($msgs) ? end($msgs)['time'] :'';
        }

        // فك تشفير مصفوفات الصور والمميزات في الشقق
        foreach ($apartments as &$apt) {
            $apt['images'] = json_decode($apt['images'], true) ?? [$apt['images']];
            $apt['features'] = json_decode($apt['features'], true) ?? [$apt['features']];
            $apt['universities'] = json_decode($apt['universities'] ??'[]', true) ?? [];
        }

        echo json_encode(["status"=>"success","stats"=> ["total_apartments"=> count($apartments),"total_services"=> count($services),"total_students"=> count($students),"total_universities"=> count($universities),"total_districts"=> count($districts),"pending_requests"=> count(array_filter($requests, fn($r) => $r['status'] ==='قيد المراجعة'))
            ],"apartments"=> $apartments,"services"=> $services,"students"=> $students,"universities"=> $universities,"districts"=> $districts,"requests"=> $requests,"reviews"=> $reviews,"chats"=> $chats,"news"=> $news,"notifications"=> $notifications
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    if ($action ==='add_apartment') {
        $title = trim($data['title'] ??'');
        $price = trim($data['price'] ??'');
        $location = trim($data['location'] ??'');
        $proximity = trim($data['proximity'] ??'');
        $capacity = trim($data['capacity'] ??'3 أفراد');
        $move_in_type = trim($data['move_in_type'] ??'فوري');
        $move_in_date = trim($data['move_in_date'] ??'انتقال فوري');
        $description = trim($data['description'] ??'');
        $universities = json_encode($data['universities'] ?? [], JSON_UNESCAPED_UNICODE);
        $features = json_encode($data['features'] ?? [], JSON_UNESCAPED_UNICODE);
        $images = json_encode($data['images'] ?? ['assets/images/apt1.png'], JSON_UNESCAPED_UNICODE);

        if (!empty($title) && !empty($price)) {
            $stmt = $conn->prepare("INSERT INTO apartments (title, price, location, proximity, universities, capacity, move_in_type, move_in_date, images, features, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $price, $location, $proximity, $universities, $capacity, $move_in_type, $move_in_date, $images, $features, $description]);
            
            // إضافة تنبيه تلقائي في الإشعارات
            $stmtNotif = $conn->prepare("INSERT INTO notifications (title, content, created_at) VALUES (?, ?, NOW())");
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
            $conn->prepare("DELETE FROM apartments WHERE id = ?")->execute([$id]);
            echo json_encode(["status"=>"success","message"=>"تم حذف الشقة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الشقة غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_university') {
        $name = trim($data['name'] ??'');
        if (!empty($name)) {
            $stmt = $conn->prepare("INSERT INTO universities (name) VALUES (?)");
            $stmt->execute([$name]);
            echo json_encode(["status"=>"success","message"=>"تم إضافة الجامعة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"اسم الجامعة مطلوب"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_university') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $conn->prepare("DELETE FROM universities WHERE id = ?")->execute([$id]);
            echo json_encode(["status"=>"success","message"=>"تم حذف الجامعة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الجامعة غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_district') {
        $name = trim($data['name'] ??'');
        if (!empty($name)) {
            $stmt = $conn->prepare("INSERT INTO districts (name) VALUES (?)");
            $stmt->execute([$name]);
            echo json_encode(["status"=>"success","message"=>"تم إضافة الحي بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"اسم الحي مطلوب"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_district') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $conn->prepare("DELETE FROM districts WHERE id = ?")->execute([$id]);
            echo json_encode(["status"=>"success","message"=>"تم حذف الحي بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الحي غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_service') {
        $title = trim($data['title'] ??'');
        $description = trim($data['description'] ??'');
        $image_url = trim($data['image_url'] ??'');
        $image_url = saveBase64IfPresent($image_url);
        if (empty($image_url)) {
            $image_url ='https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80';
        }
        $has_form = isset($data['has_form']) ? (int)$data['has_form'] : 1;

        if (!empty($title)) {
            $stmt = $conn->prepare("INSERT INTO services (title, description, image_url, has_form) VALUES (?, ?, ?, ?)");
            $stmt->execute([$title, $description, $image_url, $has_form]);
            
            // إضافة تنبيه تلقائي في الإشعارات
            $stmtNotif = $conn->prepare("INSERT INTO notifications (title, content, created_at) VALUES (?, ?, NOW())");
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
            $conn->prepare("DELETE FROM services WHERE id = ?")->execute([$id]);
            echo json_encode(["status"=>"success","message"=>"تم حذف الخدمة بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الخدمة غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_news') {
        $title = trim($data['title'] ??'');
        $content = trim($data['content'] ??'');
        $image_url = trim($data['image_url'] ??'');

        if (!empty($title) && !empty($content)) {
            $stmt = $conn->prepare("INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)");
            $stmt->execute([$title, $content, $image_url]);
            echo json_encode(["status"=>"success","message"=>"تم نشر الخبر والتنبيه بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"عنوان الخبر والتفاصيل مطلوبان"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_news') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $conn->prepare("DELETE FROM news WHERE id = ?")->execute([$id]);
            echo json_encode(["status"=>"success","message"=>"تم حذف الخبر بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الخبر غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='add_notification') {
        $title = trim($data['title'] ??'');
        $content = trim($data['content'] ??'');

        if (!empty($title) && !empty($content)) {
            $stmt = $conn->prepare("INSERT INTO notifications (title, content) VALUES (?, ?)");
            $stmt->execute([$title, $content]);
            echo json_encode(["status"=>"success","message"=>"تم نشر التنبيه والإشعار بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"عنوان التنبيه والمحتوى مطلوبان"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_notification') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $conn->prepare("DELETE FROM notifications WHERE id = ?")->execute([$id]);
            echo json_encode(["status"=>"success","message"=>"تم حذف التنبيه بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف التنبيه غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='update_request_status') {
        $id = intval($data['id'] ?? 0);
        $status = trim($data['status'] ??'مكتمل');
        if ($id > 0) {
            // 1. Get the current details of this request to find the student phone
            $stmtReq = $conn->prepare("SELECT student_name, student_phone, service_title FROM service_requests WHERE id = ?");
            $stmtReq->execute([$id]);
            $reqData = $stmtReq->fetch();

            $conn->prepare("UPDATE service_requests SET status = ? WHERE id = ?")->execute([$status, $id]);

            // 2. Insert status update notification message in the chat
            if ($reqData && !empty($reqData['student_phone'])) {
                $phone = $reqData['student_phone'];
                $serviceTitle = $reqData['service_title'];

                // Find or create chat
                $stmtChat = $conn->prepare("SELECT id FROM chats WHERE phone = ?");
                $stmtChat->execute([$phone]);
                $chat = $stmtChat->fetch();

                $msgText ="تحديث الطلب (#$id): تم تغيير حالة طلبك الخاص بـ ($serviceTitle) إلى: * $status *";

                if ($chat) {
                    $chatId = $chat['id'];
                    $conn->prepare("UPDATE chats SET last_msg = ?, status ='تحديث الطلب'WHERE id = ?")->execute([$msgText, $chatId]);
                } else {
                    $conn->prepare("INSERT INTO chats (student_name, phone, last_msg, status) VALUES (?, ?, ?,'تحديث الطلب')")->execute([$reqData['student_name'] ??'طالب', $phone, $msgText]);
                    $chatId = $conn->lastInsertId();
                }

                // Insert the system notification message in chat_messages as admin
                $stmtMsg = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, text) VALUES (?,'admin', ?)");
                $stmtMsg->execute([$chatId, $msgText]);
            }

            echo json_encode(["status"=>"success","message"=>"تم تحديث حالة الطلب"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الطلب غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_student') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $conn->prepare("DELETE FROM students WHERE id = ?")->execute([$id]);
            echo json_encode(["status"=>"success","message"=>"تم حذف الحساب بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الطالب غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_request') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $conn->prepare("DELETE FROM service_requests WHERE id = ?")->execute([$id]);
            echo json_encode(["status"=>"success","message"=>"تم حذف الطلب بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف الطلب غير صالح"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    if ($action ==='delete_review') {
        $id = intval($data['id'] ?? 0);
        if ($id > 0) {
            $conn->prepare("DELETE FROM reviews WHERE id = ?")->execute([$id]);
            echo json_encode(["status"=>"success","message"=>"تم حذف التقييم بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"معرف التقييم غير صالح"], JSON_UNESCAPED_UNICODE);
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
            $stmt = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, text, type, image_url, quote_text, quote_sender) VALUES (?,'admin', ?, ?, ?, ?, ?)");
            $stmt->execute([$chatId, $text, $type, !empty($imageUrl) ? $imageUrl : null, !empty($quoteText) ? $quoteText : null, !empty($quoteSender) ? $quoteSender : null]);
            
            $conn->prepare("UPDATE chats SET last_msg = ?, status ='تم الرد ️'WHERE id = ?")->execute(['الرد:'. $text, $chatId]);
            echo json_encode(["status"=>"success","message"=>"تم إرسال الرد المرفق بنجاح"], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["status"=>"error","message"=>"البيانات المطلوبة غير مكتملة"], JSON_UNESCAPED_UNICODE);
        }
        exit();
    }

    echo json_encode(["status"=>"error","message"=>"إجراء غير محدد أو غير معروف"], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(["status"=>"error","message"=>"خطأ في الخادم:". $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
