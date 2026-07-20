# دليل بناء ونشر تطبيق أبشر (Flutter Build Guide)

> [!IMPORTANT]
> تم وضع هذا الملف والسكربتات في مجلد مستقل `flutter_build_scripts` بجانب مجلد الباك اند `backend_php` مباشرة، لتسهيل إدارة عمليات البناء والنقل التلقائي للملفات.

---

## 📂 موقع الملفات في المشروع
```text
c:\Users\abc\AndroidStudioProjects\absher\
 │
 ├── backend_php\              <-- ملفات الباك اند PHP وقاعدة البيانات
 ├── flutter_build_scripts\    <-- ملفات وسكربتات الـ Build (مستقلة وبجانب الباك اند)
 │    ├── build_android_apk.bat
 │    ├── build_web_and_deploy_to_php.bat
 │    └── FLUTTER_BUILD_GUIDE.md
 └── lib\                      <-- أكواد تطبيق فلاتر
```

---

## 🛠️ كيف تقوم بعمل Build لتطبيق الموبايل (APK)؟

لتوليد ملف الـ APK النهائي الجاهز للتثبيت على أجهزة الأندرويد أو الرفع على متجر جوجل بلاي:

1. افتح المجلد `flutter_build_scripts`.
2. انقر نقراً مزدوجاً على الملف: **`build_android_apk.bat`**.
3. سيقوم السكربت تلقائياً بتنظيف الملفات المؤقتة، وتحديث المكتبات، وبناء نسخة الـ Release، ثم سيقوم بفتح المجلد الذي يحتوي على ملف الـ APK النهائي تلقائياً أمامك:
   `build\app\outputs\flutter-apk\app-release.apk`

---

## 🌐 كيف تقوم بعمل Build للويب ونقله بجانب الباك اند PHP؟

إذا كنت تريد استضافة التطبيق كـ (Web App) ليعمل على المتصفح مباشرة من نفس سيرفر الـ PHP:

1. انقر نقراً مزدوجاً على الملف: **`build_web_and_deploy_to_php.bat`**.
2. سيقوم فلاتر بضغط وتحسين ملفات الويب، وسيقوم السكربت بنسخها تلقائياً وتسكينها داخل مجلد الباك اند في المسار الجديد:
   `backend_php\app_web`
3. يمكنك الآن فتح المتصفح والدخول على عنوان السيرفر لعرض التطبيق والباك اند معاً!

---

## ⚙️ ضبط عنوان السيرفر (API Endpoint) قبل البناء
قبل إجراء عملية الـ Build النهائية، تأكد من ضبط رابط الباك اند الصحيح في ملف الخدمات:
* افتح الملف: [api_service.dart](file:///c:/Users/abc/AndroidStudioProjects/absher/lib/services/api_service.dart)
* قم بتعديل المتغير `baseUrl` ليعكس رابط سيرفرك الفعلي (سواء كان محلياً على XAMPP أو استضافة سحابية):
```dart
static const String baseUrl = 'http://your-domain.com/backend_php/api';
```
