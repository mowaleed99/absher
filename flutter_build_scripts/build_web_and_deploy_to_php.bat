@echo off
echo ========================================================
echo     بناء تطبيق أبشر للويب وربطه مباشرة مع الباك اند PHP
echo ========================================================
echo.

cd ..
echo [1/3] جاري تحميل المكتبات...
call flutter pub get

echo [2/3] جاري بناء نسخة الـ Web (Release Web)...
call flutter build web --release

echo [3/3] جاري نسخ ملفات الويب إلى مجلد الباك اند PHP...
if not exist "backend_php\app_web" mkdir "backend_php\app_web"
xcopy "build\web\*.*" "backend_php\app_web\" /S /E /Y

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   تم بناء الويب ونقل الملفات بنجاح بجانب الباك اند!
    echo   المسار: backend_php\app_web
    echo ========================================================
) else (
    echo [خطأ] حدث خطأ أثناء عملية البناء أو النقل.
)
pause
