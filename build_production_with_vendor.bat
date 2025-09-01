@echo off
echo 🚀 Building Production Package with Vendor for EnvisionSuite POS...

echo 🧹 Cleaning up previous build...
if exist "envision_pos_production" rmdir /s /q "envision_pos_production"
if exist "envision_pos_production.zip" del "envision_pos_production.zip"

echo 📁 Creating production directory...
mkdir "envision_pos_production"

echo 📋 Copying essential files...
xcopy "app" "envision_pos_production\app\" /E /I /Y
xcopy "bootstrap" "envision_pos_production\bootstrap\" /E /I /Y
xcopy "config" "envision_pos_production\config\" /E /I /Y
xcopy "database" "envision_pos_production\database\" /E /I /Y
xcopy "lang" "envision_pos_production\lang\" /E /I /Y 2>nul
xcopy "public" "envision_pos_production\public\" /E /I /Y
xcopy "resources" "envision_pos_production\resources\" /E /I /Y
xcopy "routes" "envision_pos_production\routes\" /E /I /Y
xcopy "storage" "envision_pos_production\storage\" /E /I /Y
xcopy "vendor" "envision_pos_production\vendor\" /E /I /Y

echo 📄 Copying essential files...
copy "artisan" "envision_pos_production\"
copy "composer.json" "envision_pos_production\"
copy "composer.lock" "envision_pos_production\"
copy ".env.production" "envision_pos_production\.env"

echo 📁 Creating necessary directories...
mkdir "envision_pos_production\storage\app\public" 2>nul
mkdir "envision_pos_production\storage\framework\cache" 2>nul
mkdir "envision_pos_production\storage\framework\sessions" 2>nul
mkdir "envision_pos_production\storage\framework\views" 2>nul
mkdir "envision_pos_production\storage\logs" 2>nul
mkdir "envision_pos_production\bootstrap\cache" 2>nul

echo 📝 Creating placeholder files...
echo. > "envision_pos_production\storage\app\public\.gitignore"
echo. > "envision_pos_production\storage\framework\cache\.gitignore"
echo. > "envision_pos_production\storage\framework\sessions\.gitignore"
echo. > "envision_pos_production\storage\framework\views\.gitignore"
echo. > "envision_pos_production\storage\logs\.gitignore"
echo. > "envision_pos_production\bootstrap\cache\.gitignore"

echo 🏗️ Building frontend assets...
call npm run build

echo 📋 Copying built assets...
xcopy "public\build" "envision_pos_production\public\build\" /E /I /Y

echo 📝 Creating proper .htaccess file...
echo RewriteEngine On > "envision_pos_production\.htaccess"
echo RewriteCond %%{REQUEST_URI} !^/build/ >> "envision_pos_production\.htaccess"
echo RewriteCond %%{REQUEST_URI} !^/storage/ >> "envision_pos_production\.htaccess"
echo RewriteCond %%{REQUEST_FILENAME} !-f >> "envision_pos_production\.htaccess"
echo RewriteCond %%{REQUEST_FILENAME} !-d >> "envision_pos_production\.htaccess"
echo RewriteRule ^ public/index.php [L] >> "envision_pos_production\.htaccess"

echo 📦 Creating ZIP package...
powershell -command "Compress-Archive -Path 'envision_pos_production\*' -DestinationPath 'envision_pos_production.zip' -Force"

echo 🧹 Cleaning up build directory...
rmdir /s /q "envision_pos_production"

echo ✅ Production package with vendor created successfully: envision_pos_production.zip
echo 🚀 Ready for upload to production server!
pause
