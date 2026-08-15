# دليل التسليم والتوثيق الشامل للمطورين (Developer Handover & Architecture Guide)
# منصة أبشر جورجيا (Absher Georgia Platform)

> **تنبيه هام للمطور القادم:**
> هذا الدليل مرجع هندسي شامل يوثق بنية النظام بالكامل (الواجهات، الـ API، قواعد البيانات، والتطبيق). يُرجى قراءة هذا الملف بعناية فائقة قبل إجراء أي تعديل لتجنب كسر التوافق بين لوحة التحكم وتطبيق الهاتف وقواعد البيانات.

---

> [!CAUTION]
> ## ⛔ قواعد صارمة لا يجوز كسرها — اقرأها قبل أي شيء
>
> ### 🔴 قاعدة رقم 1 — ممنوع النشر المباشر على الإنتاج
>
> **لا تنسخ ملفات مباشرة إلى `/var/www/absher/backend_php/admin/` أو `/var/www/absher/backend_php/api/` قبل التأكد من الخطوات التالية كلها:**
>
> ```
> الخطوة 1 ← npm run typecheck        (يجب 0 أخطاء)
> الخطوة 2 ← npm run lint             (يجب 0 أخطاء)
> الخطوة 3 ← npm run build:production (ينتج dist/ جديد)
> الخطوة 4 ← scp dist/* إلى السيرفر  (هنا فقط تنشر)
> ```
>
> **لا تعمل `scp` مباشرة من ملفات الـ source أو من dist قديم.** كل تعديل حتى لو "بسيط" يستلزم build جديد كامل.
>
> ---
>
> ### 🔴 قاعدة رقم 2 — لا تعدّل `i18n.tsx` باستهتار
>
> ملف `admin_react/src/lib/i18n.tsx` يحتوي على أكثر من **500 translation key** موزعة على قاموسين (عربي وإنجليزي). قبل إضافة أي key:
>
> 1. ابحث بـ `Ctrl+F` أو `Select-String` على اسم الـ key أولاً.
> 2. إذا موجود → لا تضيفه ثانية (بيسبب `TS1117` ويوقف البيلد).
> 3. إذا مش موجود → أضفه في **الاتنين** (arTranslations + enTranslations).
>
> **مثال حقيقي من هذا المشروع:** محاولة إضافة `btn.login` وهو غير موجود أسفرت عن حذفه بالغلط بسبب خطأ في `form.saving` المجاور، فظهر الزر على الإنتاج بنص خام `btn.login` بدل "تسجيل الدخول". استغرق الإصلاح 3 محاولات بناء ونشر.
>
> ---
>
> ### 🔴 قاعدة رقم 3 — عزل البيئات تام ومطلق
>
> | ممنوع تماماً | السبب |
> | :--- | :--- |
> | نسخ ملفات من `api_staging/` إلى `api/` | اختلاف في config قاعدة البيانات |
> | استخدام `absher_georgia_staging` في الإنتاج | بيانات اختبار مزيفة |
> | نقل promo codes مثل `WELCOME20`, `FIXED25`, `FREEPASS`, `TEST_*` للإنتاج | أكواد اختبارية لا صلاحية تجارية لها |
> | حذف أو تعديل `.htaccess` في `/admin/` أو `/admin_v2/` | بيوقف React Router ويسبب 404 على كل المسارات |
>
> ---
>
> ### 🔴 قاعدة رقم 4 — عند تعديل الـ API لازم تحدّث الـ Dashboard
>
> إذا عدّلت `admin_api.php` وغيّرت اسم حقل أو أضفت حقلاً جديداً:
> - حدّث الـ TypeScript interface المقابل في `admin_react/src/`.
> - أضف Nullish Coalescing Fallback `?? 0` أو `?? ''` لأي حقل جديد.
> - انظر القسم 5 لتفاصيل كاملة.

---


## 1. نظرة عامة على المشروع وهندسة النظام (Architecture Overview)

مشروع أبشر جورجيا يتكون من ثلاثة أركان رئيسية مترابطة:

1. **تطبيق الهاتف الذكي (Mobile App):** مبني بتقنية Flutter (Android & iOS).
2. **لوحة التحكم الذكية (Admin Dashboard):** مبنية بتقنية React 18 + TypeScript + Vite + CSS النقي المطور بتصميم عصري (Dark/Light Mode) وتدعم اللغتين العربية والإنجليزية.
3. **الواجهة الخلفية (Backend API):** مكتوبة بلغة PHP 8.1 (Native/Modular) متصلة بقواعد بيانات MySQL.

```
Flutter Mobile App  ──REST API / Token──►  PHP Backend
React Admin Panel   ──REST API / JWT──►    PHP Backend
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                   absher_georgia_db   absher_georgia_staging   uploads/
                   (Production DB)       (Staging DB)        housing_offers/
```

---

## 2. خريطة المستودع والمسارات (Project Structure)

```text
absher/
├── admin_react/                 # كود لوحة تحكم الإدارة (React + TS + Vite)
│   ├── src/
│   │   ├── components/          # المكونات (Modals, Forms, Charts, Cards)
│   │   │   └── LoginOverlay.tsx # نافذة تسجيل الدخول — تستخدم t('btn.login')
│   │   ├── pages/               # الصفحات الرئيسية
│   │   ├── contexts/            # إدارة الحالة (AuthContext, ThemeContext, BadgesContext)
│   │   ├── lib/
│   │   │   └── i18n.tsx         # ⚠️ ملف الترجمة — لا تضف keys موجودة مسبقاً
│   │   └── types/               # تعريفات TypeScript ونماذج البيانات
│   ├── .env.production          # VITE_BASE_PATH=/admin/, VITE_API_ROOT=/api
│   ├── .env.staging             # VITE_BASE_PATH=/admin_v2/, VITE_API_ROOT=/api_staging
│   └── public/
│       └── .htaccess            # ⚠️ ضروري للـ SPA routing — لا تحذفه
│
├── backend_php/                 # الواجهة الخلفية وقواعد البيانات
│   ├── api/                     # مسارات الـ API للإنتاج (Production)
│   │   ├── admin_api.php        # ⚠️ المتحكم الرئيسي — عند تعديله راجع القسم 5
│   │   ├── student_requests.php # معالجة الطلبات والخصومات والاسترداد
│   │   ├── upload/image.php     # رفع وضغط الصور (GD + WebP)
│   │   └── core/                # JWT, Response, Notification, Identity Block
│   ├── api_staging/             # ⚠️ معزول بالكامل — لا تعدّله في الإنتاج
│   ├── config/
│   │   ├── db.php               # اتصال قاعدة الإنتاج
│   │   └── db_staging.php       # اتصال قاعدة الستيجينج
│   ├── admin/                   # React build للإنتاج (dist/ ← هنا)
│   ├── admin_v2/                # React build للستيجينج
│   ├── uploads/                 # صور الإنتاج
│   └── uploads_staging/         # صور الستيجينج
│
├── lib/                         # كود تطبيق Flutter
│   ├── models/                  # نماذج البيانات — حدّثها عند تغيير الـ API
│   ├── screens/                 # شاشات التطبيق
│   └── services/                # استدعاءات API والتخزين المحلي
│
├── DEVELOPER_HANDOVER.md        # هذا الملف (نسخة root)
├── docs/
│   └── DEVELOPER_HANDOVER.md   # هذا الملف (نسخة docs)
└── scratch/                     # سكربتات اختبار — مستبعدة من البيلد
```

---

## 3. بيئات العمل والروابط الحية (Environments & Live URLs)

**السيرفر:** Contabo Ubuntu 22.04 LTS — IP: `80.241.218.23` — Apache 2.4.52 — PHP 8.1 — MySQL 8.0

| البيئة | لوحة التحكم | الـ API | قاعدة البيانات | مجلد الصور |
| :--- | :--- | :--- | :--- | :--- |
| **Production** | `http://80.241.218.23/admin/` | `http://80.241.218.23/api/` | `absher_georgia_db` | `uploads/` |
| **Staging** | `http://80.241.218.23/admin_v2/` | `http://80.241.218.23/api_staging/` | `absher_georgia_staging` | `uploads_staging/` |

---

## 4. الميزات المنجزة وقواعد العمل الأساسية (Core Modules & Business Logic)

### أ. لوحة الإدارة التنفيذية — 8 مؤشرات KPI

| # | المؤشر | اسم الحقل في الـ API | ملاحظة |
| :--- | :--- | :--- | :--- |
| 1 | إجمالي الشقق | `total_apartments` | |
| 2 | إجمالي الخدمات | `total_services` | |
| 3 | إجمالي الطلاب | `total_students` | |
| 4 | الجامعات | `total_universities` | |
| 5 | المناطق | `total_districts` | |
| 6 | طلبات قيد المراجعة | `pending_requests` | |
| 7 | أكواد الخصم النشطة | `promo_codes_count` | |
| 8 | عروض السكن النشطة | `active_housing_offers_count` | `is_active=1` + شقة متاحة + ضمن الفترة الزمنية |

> [!IMPORTANT]
> إذا أضفت KPI جديد في `admin_api.php`، يجب أن تضيف الحقل المقابل في TypeScript Interface الـ Dashboard داخل `admin_react/src/types/` أو `admin_react/src/pages/` مع Nullish Coalescing Fallback `?? 0`.

### ب. نظام أكواد الخصم والمحفظة

- الخصم يعمل **فقط** مع `payment_method = 'wallet'` — أي محاولة مع الكاش تُرفض بـ `HTTP 400` ورمز `PROMO_WALLET_ONLY`.
- عند الإلغاء: النقاط تُسترجع تلقائياً، مع حماية من التكرار عبر الفهرس الفريد `uq_request_tx_type` على `wallet_transactions(service_request_id, type)`.

### ج. عروض السكن (Housing Offers)

- يدعم رفع الصور الحقيقية أو رابط خارجي.
- عند حذف عرض: الصورة تُحذف تلقائياً من `uploads/housing_offers/` إذا كانت محلية.
- يدعم ثنائية اللغة: `title_ar/en`, `description_ar/en`, `badge_text_ar/en`.

### د. رفع الصور

- Endpoint: `POST /api/upload/image.php?folder={folder_name}`
- يضغط تلقائياً لأقصى بُعد 1920px، يدعم JPEG/PNG/WebP بجودة 85%.

---

## 5. ⚠️ تعليمات إلزامية عند تعديل الـ API (أهم قسم — اقرأه بعناية)

### إذا عدّلت اسم حقل أو أضفت حقلاً جديداً في `admin_api.php`:

**الخطوة 1 — حدّث TypeScript types في لوحة التحكم:**
```
admin_react/src/types/         ← ابحث عن الـ Interface المقابل
admin_react/src/pages/         ← أو في بعض الأحيان inline في الـ page component
```

مثال: لو أضفت `housing_offers_revenue` في الـ API، أضفه في TypeScript:
```typescript
// قبل
interface DashboardStats {
  active_housing_offers_count: number;
}

// بعد
interface DashboardStats {
  active_housing_offers_count: number;
  housing_offers_revenue?: number; // استخدم ? مع fallback ?? 0
}
```

**الخطوة 2 — إذا أضفت نص جديد يظهر في الـ UI، أضفه في الترجمة:**
```
admin_react/src/lib/i18n.tsx
```
> [!WARNING]
> **لا تضف key موجود مسبقاً!** ابحث أولاً بـ Ctrl+F قبل الإضافة. تكرار الـ key يسبب خطأ `TS1117`.

**الخطوة 3 — شغّل الفحص الكامل قبل أي نشر:**
```bash
cd admin_react
npm run typecheck    # يجب 0 أخطاء
npm run lint         # يجب 0 أخطاء
npm run build:production
```

**الخطوة 4 — إذا مسّ التعديل الـ Flutter API:**
```bash
# حدّث lib/models/ أولاً ثم:
flutter analyze      # يجب No issues found!
flutter test         # يجب All tests passed!
```

---

## 6. إجراءات النشر (Deployment Guide)

### نشر لوحة التحكم (React Admin)

```bash
# بناء الإنتاج
cd admin_react
npm run build:production

# نشر على السيرفر
scp -r dist/* root@80.241.218.23:/var/www/absher/backend_php/admin/
scp public/.htaccess root@80.241.218.23:/var/www/absher/backend_php/admin/.htaccess
```

> [!IMPORTANT]
> ملف `.htaccess` **ضروري** في كل مجلد Admin. بدونه كل مسار عميق مثل `/admin/dashboard` يعطي 404 عند Refresh.

### نشر الـ Backend (PHP)

```bash
# ضبط الصلاحيات بعد كل نشر
ssh root@80.241.218.23 "chown -R www-data:www-data /var/www/absher/backend_php/ && chmod -R 755 /var/www/absher/backend_php/api/ && chmod -R 755 /var/www/absher/backend_php/uploads/"
```

---

## 7. فحص الجودة التلقائي (Smoke Tests)

```bash
# على السيرفر مباشرة — يفحص 20 نقطة ويتنظف تلقائياً
php /var/www/absher/scratch/smoke_test_prod.php
```

---

## 8. المستودع والحالة الحالية

- **Git:** `https://github.com/mowaleed99/absher.git` — الفرع: `main`
- **آخر حالة مُعتمدة:** Working tree نظيفة، 0 أخطاء في Flutter و React.
- **يُرجى الالتزام بـ Conventional Commits** عند رفع أي تعديلات:
  - `feat(module): وصف الميزة`
  - `fix(module): وصف الإصلاح`
  - `docs: تحديث التوثيق`
