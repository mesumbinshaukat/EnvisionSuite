@echo off
echo 🚀 Building Production Package for EnvisionSuite POS...

REM Set variables
set PRODUCTION_DIR=envision_pos_production
set ZIP_FILE=envision_pos_production.zip

REM Clean up previous build
echo 🧹 Cleaning up previous build...
if exist "%PRODUCTION_DIR%" rmdir /s /q "%PRODUCTION_DIR%"
if exist "%ZIP_FILE%" del "%ZIP_FILE%"

REM Create production directory
echo 📁 Creating production directory...
mkdir "%PRODUCTION_DIR%"

REM Copy essential files and directories
echo 📦 Copying essential files...
xcopy "app" "%PRODUCTION_DIR%\app\" /E /I /Y
xcopy "bootstrap" "%PRODUCTION_DIR%\bootstrap\" /E /I /Y
xcopy "config" "%PRODUCTION_DIR%\config\" /E /I /Y
xcopy "database" "%PRODUCTION_DIR%\database\" /E /I /Y
xcopy "lang" "%PRODUCTION_DIR%\lang\" /E /I /Y
xcopy "public" "%PRODUCTION_DIR%\public\" /E /I /Y
xcopy "resources" "%PRODUCTION_DIR%\resources\" /E /I /Y
xcopy "routes" "%PRODUCTION_DIR%\routes\" /E /I /Y
xcopy "storage" "%PRODUCTION_DIR%\storage\" /E /I /Y

REM Copy essential files
copy "artisan" "%PRODUCTION_DIR%\"
copy "composer.json" "%PRODUCTION_DIR%\"
copy ".env.production" "%PRODUCTION_DIR%\"
copy "deploy_production.sh" "%PRODUCTION_DIR%\"
copy ".gitignore.production" "%PRODUCTION_DIR%\"

REM Create necessary directories
echo 📁 Creating necessary directories...
mkdir "%PRODUCTION_DIR%\storage\app\public"
mkdir "%PRODUCTION_DIR%\storage\framework\cache"
mkdir "%PRODUCTION_DIR%\storage\framework\sessions"
mkdir "%PRODUCTION_DIR%\storage\framework\views"
mkdir "%PRODUCTION_DIR%\storage\logs"
mkdir "%PRODUCTION_DIR%\bootstrap\cache"

REM Create placeholder files
echo 📝 Creating placeholder files...
echo. > "%PRODUCTION_DIR%\storage\logs\.gitkeep"
echo. > "%PRODUCTION_DIR%\storage\framework\cache\.gitkeep"
echo. > "%PRODUCTION_DIR%\storage\framework\sessions\.gitkeep"
echo. > "%PRODUCTION_DIR%\storage\framework\views\.gitkeep"
echo. > "%PRODUCTION_DIR%\bootstrap\cache\.gitkeep"

REM Build frontend assets
echo 🎨 Building frontend assets...
call npm run build

REM Copy built assets
echo 📦 Copying built assets...
xcopy "public\build" "%PRODUCTION_DIR%\public\build\" /E /I /Y

REM Create ZIP file
echo 📦 Creating ZIP package...
powershell -command "Compress-Archive -Path '%PRODUCTION_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

REM Clean up
echo 🧹 Cleaning up build directory...
rmdir /s /q "%PRODUCTION_DIR%"

echo ✅ Production package created successfully: %ZIP_FILE%
echo 📤 Ready for upload to production server!
pause
