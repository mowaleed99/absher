@echo off
echo ========================================================
echo        بدء بناء تطبيق أبشر (ABSHER) لأجهزة الأندرويد
echo ========================================================
echo.

cd ..
echo [1/4] جاري تنظيف الملفات المؤقتة السابقة (Flutter Clean)...
call flutter clean

echo [2/4] جاري تحميل وتحديث المكتبات (Flutter Pub Get)...
call flutter pub get

echo [3/4] جاري بناء نسخة الـ APK النهائية (Release APK)...
call flutter build apk --release

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   تم بناء ملف الـ APK بنجاح!
    echo   المسار: build\app\outputs\flutter-apk\app-release.apk
    echo ========================================================
    explorer "build\app\outputs\flutter-apk"
) else (
    echo [خطأ] حدث خطأ أثناء عملية البناء. يرجى مراجعة الرسائل بالأعلى.
)
pause
