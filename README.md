# أبشر جورجيا | Absher Georgia 🇬🇪✈️

[![Flutter](https://img.shields.io/badge/Flutter-v3.0+-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-v3.0+-0175C2?style=for-the-badge&logo=dart&logoColor=white)](https://dart.dev)
[![PHP](https://img.shields.io/badge/PHP-v8.x-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

### [العربية] وصف المشروع 🌍
**أبشر جورجيا (Absher Georgia)** هو منصة متكاملة (تطبيق هاتف + لوحة تحكم + نظام خلفي) مصمم خصيصاً لخدمة الطلاب العرب والدوليين المستجدين والحاليين في جمهورية جورجيا. يهدف التطبيق إلى تيسير حياة الطالب وتوفير شريك السكن المناسب، البحث عن شقق سكنية قريبة من الجامعات، تيسير المعاملات والترجمة القانونية، وتقديم عروض حصرية، بالإضافة إلى نظام محفظة ونقاط تفاعلي ونظام دعم فني مباشر ومتطور.

### [English] Project Overview 🌍
**Absher Georgia** is an all-in-one platform (Flutter Mobile App + Admin Web SPA + PHP REST API) built specifically to assist Arab and international students studying in Georgia. The app streamlines student housing searches (filtering by proximity to universities and pricing), facilitates roommate matching, provides essential student services (visa support, legal translation, airport pick-up), aggregates local student news, offers exclusive discounts, and features a points-based wallet and live technical support chat.

---

## 🎨 الهوية البصرية والألوان | Visual Identity & Color Palette

الألوان الرسمية للتطبيق مستوحاة مباشرة من شعار **أبشر** لتعزيز الهوية والاحترافية:

| اللون (Color) | الرمز (Hex) | الاستخدام (Usage) |
| :--- | :---: | :--- |
| **Navy/Deep Blue (كحلي عميق)** | `#11364F` | اللون الأساسي لخلفيات الشاشات واللوجو (`AppColors.primary`) |
| **Accent Gold (ذهبي ساطع)** | `#FBB03B` | لون اللكنة، أيقونة الطائرة، الأزرار والتنبيهات المتميزة (`AppColors.accent`) |
| **Accent Light (ذهبي ناعم)** | `#FFF8E7` | خلفيات التنبيهات، كوبونات الخصم، وبطاقات العروض الحصرية |
| **Success Emerald (أخضر)** | `#10B981` | تأكيد الحجوزات، الدفع الناجح، والمؤشرات الإيجابية |
| **Slate Dark (نص داكن)** | `#0F172A` | النصوص الرئيسية والعناوين لسهولة القراءة |

---

## 🚀 الميزات الرئيسية | Key Features

### 1. 🏠 السكن الطلابي وعروض الإيجار (Student Housing & Exclusive Offers)
* تصفح قائمة الشقق المتوفرة للإيجار مع تفاصيل شاملة (السعر، السعة، الحي، المسافة من الجامعات).
* إمكانية الفرز والبحث بحسب الجامعات القريبة أو تصفية النتائج بناءً على نوع السكن (شقة كاملة، غرفة مشتركة، استوديو).
* **عروض السكن الحصرية (`housing_offers`):** عروض إيجار مخفضة لفترات محدودة مع شريط تنبيهات وعروض تفاعلية.

### 2. 👥 شريك السكن (Roommate Matcher)
* يساعد الطلاب في العثور على شركاء سكن متوافقين بناءً على الاهتمامات المشتركة والجامعة والميزانية المقترحة.

### 3. 🛠️ الخدمات الطلابية (Student Services & Requests)
* تقديم طلبات الحصول على خدمات مثل: الاستقبال من المطار، فتح حساب بنكي، الترجمة المحلفة للوثائق، المساعدة في الإقامة الطلابية.
* إمكانية الدفع نقداً أو باستخدام **محفظة النقاط**.

### 4. 💬 الدعم الفني المباشر (Interactive Support Chat)
* نظام محادثة فوري يربط الطالب بإدارة التطبيق مباشرة.
* يدعم إرسال النصوص، الصور، الرسائل الصوتية، وحذف الرسائل والاقتباس المباشر (Quoting).

### 5. 💰 محفظة النقاط (Wallet System)
* يحصل الطلاب على نقاط ترحيبية أو مكافآت داخل التطبيق، ويمكنهم استخدامها لدفع قيمة الخدمات الطلابية.

### 6. 📰 أخبار جورجيا (Georgia Student News)
* تغطية إخبارية مستمرة تهم الطالب المغترب (تحديثات الإقامات والفيزا، مواعيد الجامعات، أخبار تبليسي وباتومي).

### 7. 👑 لوحة تحكم الإدارة (Responsive Admin Web SPA)
* لوحة تحكم متكاملة مبنية بـ HTML/JS/CSS خفيفة وسريعة وتدعم تعدد اللغات (العربية والإنجليزية).
* تتيح للمسؤولين: إدارة الشقق والجامعات، مراجعة طلبات الطلاب وتحديث حالتها، شحن المحفظة، الرد الفوري على شات الدعم، وإقرار التقييمات.

---

## 📂 هيكلية المشروع | Project Directory Structure

```text
absher/
├── lib/                             # كود تطبيق فلاتر (Flutter Mobile App)
│   ├── core/                        # الثوابت والإعدادات المشتركة
│   ├── models/                      # نماذج البيانات (Models)
│   ├── screens/                     # واجهات وشاشات التطبيق (20+ شاشة تفاعلية)
│   ├── services/                    # خدمات الاتصال بالـ API وإدارة اللغات والترجمة
│   ├── theme/                       # الهوية البصرية ونظام الألوان (AppColors)
│   └── main.dart                    # نقطة انطلاق التطبيق وإعدادات البداية
│
├── backend_php/                     # النظام الخلفي ولوحة التحكم (PHP Backend & Admin Dashboard)
│   ├── admin/                       # لوحة تحكم المشرفين (HTML, CSS, JS Single Page Application)
│   │   ├── js/                      # سكربتات التحكم وإرسال البيانات
│   │   ├── lang.js                  # محرك الترجمة متعدد اللغات للوحة التحكم
│   │   ├── index.html               # الواجهة الرئيسية للوحة التحكم
│   │   └── style.css                # التنسيقات البصرية للوحة الإدارة
│   ├── api/                         # واجهات برمجة التطبيقات (RESTful API Endpoints)
│   │   ├── auth/                    # التسجيل وتسجيل الدخول والتحقق
│   │   ├── apartments/              # عمليات جلب وإضافة وتحديث الشقق
│   │   ├── chat/                    # معالجة رسائل الشات والردود
│   │   ├── core/                    # إعدادات البيئة (env) والهيدرز والردود
│   │   ├── services/                # إدارة الخدمات الطلابية وحجوزاتها
│   │   └── wallet/                  # عمليات المحفظة وإدارة النقاط
│   ├── config/                      # ملفات الربط بقاعدة البيانات (db.php)
│   ├── database/                    # مخططات وتفريغات قاعدة البيانات (schema.sql)
│   ├── uploads/                     # مجلد حفظ المرفقات والصور المرفوعة
│   └── *.php                        # سكربتات الاختبارات والترحيل (Migrations & Unit Tests)
```

---

## ⚙️ التثبيت والتشغيل المحلي | Installation & Local Setup

### المتطلبات الأساسية (Prerequisites)
* تثبيت بيئة **Flutter SDK** (نسخة 3.0 فما فوق).
* خادم محلي مثل **XAMPP / Laragon** يدعم **PHP 8.x** وخادم قاعدة بيانات **MySQL**.

---

### أولاً: إعداد النظام الخلفي وقاعدة البيانات (PHP Backend Setup)

1. **نسخ ملف الإعدادات البيئية:**
   قم بإنشاء ملف `.env` داخل المجلد `backend_php` بناءً على ملف `.env.example`:
   ```bash
   cp backend_php/.env.example backend_php/.env
   ```
2. **تحديث إعدادات قاعدة البيانات:**
   افتح ملف `.env` وقم بتعديل بيانات الاتصال بقاعدة بياناتك المحلية:
   ```env
   DB_HOST=127.0.0.1
   DB_NAME=absher_georgia_db
   DB_USER=root
   DB_PASS=your_mysql_password
   JWT_SECRET=secure_secret_key_here
   ALLOWED_ORIGINS=http://localhost,http://127.0.0.1
   ```
3. **استيراد قاعدة البيانات:**
   قم بإنشاء قاعدة بيانات فارغة باسم `absher_georgia_db` بترميز `utf8mb4_unicode_ci` ثم قم باستيراد ملف السكيم الرئيسي:
   * الملف المستهدف: `backend_php/schema.sql` (أو `database/schema.sql` في حال توفره).
4. **تشغيل سكربتات الترحيل والتغذية (Seeders):**
   لتجهيز البيانات التجريبية والأحياء السكنية والجامعات الافتراضية، قم بتشغيل السكربتات التالية عبر المتصفح أو موجه الأوامر:
   ```bash
   php backend_php/setup_uni.php
   php backend_php/setup_districts.php
   php backend_php/run_migration.php
   ```
5. **بيانات الدخول الافتراضية للمشرف (Default Admin):**
   * اسم المستخدم: `absher_admin`
   * البريد الإلكتروني: `admin@absher.ge`
   * كلمة المرور: `SecureAdminPass2026!`

---

### ثانياً: إعداد وتشغيل تطبيق الجوال (Flutter Setup)

1. **تنزيل حزم الاعتماديات (Dependencies):**
   من المجلد الرئيسي للمشروع، قم بتشغيل الأمر التالي:
   ```bash
   flutter pub get
   ```
2. **تهيئة واجهة الاتصال بالـ API:**
   تأكد من تعديل عنوان الـ API (مثل `BASE_URL`) في ملف `lib/services/api_service.dart` ليشير إلى خادمك المحلي (مثال: `http://localhost/absher/backend_php/` أو عنوان IP الخاص بجهازك عند التجربة على جهاز جوال حقيقي).
3. **تحديث وتوليد الأيقونات (اختياري):**
   إذا قمت بتغيير الشعار وتريد إعادة توليد أيقونات التطبيق:
   ```bash
   flutter pub run flutter_launcher_icons
   ```
4. **تشغيل التطبيق:**
   * للتشغيل على محاكي أو جهاز حقيقي:
     ```bash
     flutter run
     ```
   * للتشغيل على الويب:
     ```bash
     flutter run -d chrome
     ```

---

## 🧪 نظام الاختبارات الذاتي | Backend Testing Suite

يحتوي النظام الخلفي على بيئة اختبارات شاملة للتأكد من سلامة كود الـ API والـ database constraints:

* **اختبار شامل للنظام الخلفي:**
  ```bash
  php backend_php/run_tests.php
  ```
* **اختبارات المرحلة الأولى (Authentication & DB Schema Verification):**
  ```bash
  php backend_php/run_stage1_tests.php
  ```
* **اختبارات إضافية متطورة (Advanced APIs & Endpoints Verification):**
  ```bash
  php backend_php/run_new_tests.php
  ```

---

## 🚢 دليل النشر على السيرفر | VPS Deployment Guide

يحتوي المشروع على سكربت أتمتة لضغط ونشر التحديثات البرمجية مباشرة إلى خادم الـ VPS الخاص بالتطبيق:

1. **سكربت النشر:** [`deploy_vps.ps1`](file:///c:/Users/moham/Desktop/absher/deploy_vps.ps1)
2. **آلية العمل:**
   * يقوم السكربت بإنشاء حزمة مضغوطة `update.zip` تحتوي فقط على الملفات المعدلة (مثل ملفات لوحة التحكم `admin/` والـ APIs الأساسية والـ `student_requests`).
   * يرفع الحزمة عبر بروتوكول `SCP` إلى خادم التطبيق ذو العنوان IP التالي: `80.241.218.23`.
   * يقوم بفك الضغط تلقائياً في المسار المحدد بالسيرفر `/var/www/absher/backend_php/` وينظف الملفات المؤقتة.
3. **طريقة التشغيل (PowerShell):**
   ```powershell
   ./deploy_vps.ps1
   ```

---

## 📝 الترخيص | License

هذا المشروع مرخص بموجب رخصة **MIT**. لمزيد من التفاصيل راجع ملف الترخيص.

---
*تم التطوير بكل ❤️ لخدمة الطلاب المغتربين في جورجيا.*
