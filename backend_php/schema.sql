-- قاعدة بيانات تطبيق وموقع أبشر جورجيا (ABSHER Georgia DB)
-- CREATE DATABASE IF NOT EXISTS `absher_georgia_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `absher_georgia_db`;

-- 1. جدول الطلاب والعملاء
CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL UNIQUE,
  `phone` varchar(50) NOT NULL UNIQUE,
  `university` varchar(150) DEFAULT'جامعة تبليسي الطبية (TSMU)',
  `password` varchar(255) NOT NULL,
  `points` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إضافة طالب تجريبي للتجربة الفورية
INSERT INTO `students` (`id`, `full_name`, `email`, `phone`, `university`, `password`, `points`) VALUES
(1,'أحمد جمال (طالب تجريبي)','ahmed@absher.ge','+995555123456','جامعة تبليسي الطبية (TSMU)','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 500)
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);

-- 2. جدول المشرفين (Admins)
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL UNIQUE,
  `email` varchar(150) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT'super_admin',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admins` (`id`, `username`, `email`, `password`, `role`) VALUES
(1,'admin','admin@absher.ge','admin123','super_admin')
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- 3. جدول الشقق السكنية (Apartments)
CREATE TABLE IF NOT EXISTS `apartments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `price` varchar(100) NOT NULL,
  `location` varchar(255) NOT NULL,
  `proximity` varchar(255) NOT NULL,
  `universities` text DEFAULT NULL, -- JSON array of selected universities
  `capacity` varchar(100) DEFAULT'3 أفراد',
  `move_in_type` varchar(50) DEFAULT'فوري', -- فوري أو ميعاد
  `move_in_date` varchar(100) DEFAULT'انتقال فوري',
  `images` text NOT NULL, -- JSON array or comma separated
  `features` text NOT NULL, -- JSON array or comma separated
  `description` text NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `apartments` (`id`, `title`, `price`, `location`, `proximity`, `universities`, `capacity`, `move_in_type`, `move_in_date`, `images`, `features`, `description`, `is_available`) VALUES
(1,'شقة طلابية فاخرة - شارع بيكيني (Pekini)','450 دولار / شهر','تبليسي - საბურთალო (سابورتالو)','التبليسي الطبية TSMU (10 دقائق مشياً) | جامعة جورجيا UG (20 دقيقة)','["جامعة تبليسي الطبية (TSMU)","جامعة جورجيا (UG)"]','3 أفراد (شقة كاملة)','فوري','انتقال فوري','[]','["2 حمام","3 غرف واسعة","تدفئة مركزية دافئة","بلكونة بإطلالة مفتوحة","إنترنت ألياف ضوئية سريع","مفروشة بالكامل"]','شقة ممتازة للطلاب في قلب تبليسي بالقرب من محطة مترو التكنيكال. مجهزة بالكامل بالفرش والأجهزة الكهربائية وتضم 2 حمام مع إطلالة رائعة من البلكونة. الدفع يتم نقداً عند الاستلام.', 1),
(2,'ستوديو مودرن - بالقرب من جامعة جورجيا (UG)','380 دولار / شهر','تبليسي - شارع كوستافا','جامعة جورجيا UG (10 دقائق مشياً) | إيليا ستيت (15 دقيقة)','["جامعة جورجيا (UG)","إيليا الحكومية"]','1 فرد (ستوديو منفرد)','ميعاد','متاح من 1 سبتمبر 2026','[]','["1 حمام","ستوديو منفرد هادئ","تكييف وتدفئة","أمن على مدار 24 ساعة","قريب من السوبرماركت"]','ستوديو مثالي للطالب المنفرد الباحث عن الهدوء والتركيز في الدراسة ويحتوي على 1 حمام مستقل. يبعد 10 دقائق مشياً عن حرم جامعة جورجيا.', 1),
(3,'شقة مشتركة لـ 3 طلاب - إطلالة بنورامية','550 دولار (أو 180 دولار للشخص)','تبليسي - فاكي (Vake)','إيليا ستيت Ilia (10 دقائق) | جامعة تبليسي الحكومية TSU (20 دقيقة)','["إيليا الحكومية"]','3 أفراد (شقة مشتركة)','فوري','انتقال فوري','[]','["2 حمام","غرف منفصلة ومريحة","صالة كبيرة للمذاكرة المشتركة","بلكونة واسعة جداً","مصعد يعمل 24/7"]','فرصة ممتازة لثلاثة أصدقاء طلاب. مساحة واسعة وتضم 2 حمام وتوزيع ممتاز للغرف يضمن الخصوصية لكل طالب.', 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- جدول الجامعات (Universities)
CREATE TABLE IF NOT EXISTS `universities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL UNIQUE,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `universities` (`id`, `name`) VALUES
(1,'جامعة تبليسي الطبية (TSMU)'),
(2,'جامعة جورجيا (UG)'),
(3,'إيليا الحكومية'),
(4,'القوقاز الدولية (CIU)')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- جدول الأحياء السكنية (Districts)
CREATE TABLE IF NOT EXISTS `districts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL UNIQUE,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `districts` (`id`, `name`) VALUES
(1,'سابورتالو (Saburtalo)'),
(2,'فاكي (Vake)'),
(3,'ديدوبي (Didube)'),
(4,'متاتسميندا (Mtatsminda)'),
(5,'إساني (Isani)'),
(6,'جلَداني (Gldani)')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. جدول الخدمات الطلابية (Services)
CREATE TABLE IF NOT EXISTS `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `has_form` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `services` (`id`, `title`, `description`, `image_url`, `has_form`) VALUES
(1,'فني كهربائي','صيانة كافة الأعطال والتوصيلات الكهربائية','', 1),
(2,'فني سباكة','إصلاح تسريبات المياه والصيانة الصحية','', 1),
(3,'استخراج إقامة طلابية','تجهيز أوراق الإقامة لأول مرة أو التجديد','', 1),
(4,'تسجيل العنوان القانوني','إصدار وثيقة العنوان المعتمدة في جورجيا','', 1),
(5,'التسجيل والنقل الجامعي','إجراءات القبول وتحويل الساعات بين الجامعات','', 1),
(6,'الاستقبال والنقل من المطار','توفير سيارات مريحة لاستقبالك فور وصولك تبليسي','', 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 5. جدول طلبات الخدمات والحجوزات (Service Requests)
CREATE TABLE IF NOT EXISTS `service_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_name` varchar(150) NOT NULL,
  `student_phone` varchar(50) NOT NULL,
  `service_title` varchar(200) NOT NULL,
  `details` text NOT NULL,
  `status` varchar(50) DEFAULT'قيد المراجعة', -- قيد المراجعة، جاري التنفيذ، مكتمل
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `service_requests` (`id`, `student_name`, `student_phone`, `service_title`, `details`, `status`) VALUES
(1,'أحمد جمال','+995555123456','استقبال والنقل من المطار','وصول رحلة تبليسي يوم الخميس الساعة 3 فجراً، حقيبتين كبيرتين.','قيد المراجعة'),
(2,'محمد علي','+995555987654','فني كهربائي','انقطاع التيار عن مقبس المطبخ في شقة سابورتالو.','جاري التنفيذ')
ON DUPLICATE KEY UPDATE `service_title`=VALUES(`service_title`);

-- 6. جدول تقييمات وآراء الطلاب (Reviews)
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_name` varchar(150) NOT NULL,
  `uni` varchar(150) DEFAULT'جامعة في جورجيا',
  `rating` int(11) DEFAULT 5,
  `comment` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `reviews` (`id`, `student_name`, `uni`, `rating`, `comment`) VALUES
(1,'د. عمر خالد','جامعة تبليسي الطبية TSMU', 5,'تطبيق وموقع أبشر رائع جداً! ساعدني في العثور على سكن ومطابقة شريك سكن محترم خلال أيام قليلة وبكل سهولة، خدمة ممتازة.'),
(2,'ريم أحمد','جامعة جورجيا UG', 5,'فريق خدمة العملاء سريع جداً في الرد على الشات، والاستقبال من المطار كان في الموعد المحدد بكل احترافية وأمان.'),
(3,'يوسف محمود','جامعة إيليا الحكومية', 4,'خيارات الشقق ممتازة ومفروشة بالكامل والأسعار مناسبة جداً لميزانية الطلاب في تبليسي.')
ON DUPLICATE KEY UPDATE `student_name`=VALUES(`student_name`);

-- 7. جدول محادثات الدعم الفني (Chats)
CREATE TABLE IF NOT EXISTS `chats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `student_name` varchar(150) NOT NULL,
  `student_uni` varchar(150) DEFAULT 'جامعة في جورجيا',
  `phone` varchar(50) NOT NULL UNIQUE,
  `last_msg` text NOT NULL,
  `status` varchar(50) DEFAULT 'رسالة جديدة',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_activity_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chats` (`id`, `student_name`, `student_uni`, `phone`, `last_msg`, `status`) VALUES
(1,'مصطفى علي','الطب البشري - TSMU','+995555112233','مرحباً، قمت بتعبئة نموذج البحث عن شريك سكن، هل يوجد طالب متوافق معي حالياً؟','رسالة جديدة'),
(2,'سارة محمد','إدارة أعمال - UG','+995555445566','شكراً لكم، تم تأكيد موعد معاينة الاستوديو غداً صباحاً.','تم الرد ️'),
(3,'خالد عبد الله','جامعة تبليسي الحكومية TSU','+995555778899','شكراً جزيلاً على سرعة الرد والمساعدة في الإقامة!','مكتمل')
ON DUPLICATE KEY UPDATE `last_msg`=VALUES(`last_msg`);

-- 8. جدول رسائل المحادثات (Chat Messages)
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chat_id` int(11) NOT NULL,
  `sender` varchar(50) NOT NULL, --'student'or'admin'`text` text NOT NULL,
  `type` varchar(50) DEFAULT'text', --'text','image','voice'`image_url` varchar(500) DEFAULT NULL,
  `quote_text` text DEFAULT NULL,
  `quote_sender` varchar(50) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chat_id` (`chat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chat_messages` (`chat_id`, `sender`, `text`, `created_at`) VALUES
(1,'student','مرحباً خدمة العملاء، قمت بتعبئة نموذج البحث عن شريك سكن لشقة في شارع بيكيني.', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(1,'student','هل يوجد طالب متوافق معي حالياً جاهز للانتقال الفوري؟', DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(2,'student','مرحباً، أود حجز الاستوديو المودرن في شارع كوستافا بسعر 380$.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2,'admin','أهلاً بك سارة في أبشر! الاستوديو متاح حالياً ومفروش بالكامل. هل يناسبك معاينته غداً؟', DATE_SUB(NOW(), INTERVAL 23 HOUR)),
(2,'student','شكراً لكم، تم تأكيد موعد معاينة الاستوديو غداً صباحاً.', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3,'student','استفسار بخصوص أوراق تجديد الإقامة الطلابية المطلوبة هذا العام.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3,'admin','مرحباً خالد، المطلوب شهادة طالب حديثة وكشف حساب بنكي وعقد السكن القانوني. يمكننا تجهيز كافة الملفات لك.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3,'student','شكراً جزيلاً على سرعة الرد والمساعدة في الإقامة!', DATE_SUB(NOW(), INTERVAL 20 HOUR));

-- 9. جدول محفظة النقاط (Wallet Transactions)
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL, -- موجب للإضافة، وسالب للخصم
  `type` varchar(50) NOT NULL, --'add','deduct','payment'`description` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. جدول الأخبار (News)
CREATE TABLE IF NOT EXISTS `news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

