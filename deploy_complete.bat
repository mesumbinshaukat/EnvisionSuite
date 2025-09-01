@echo off
echo 🚀 Complete Production Deployment for EnvisionSuite POS
echo =====================================================

REM Build production package
echo 📦 Building production package...
call build_production.bat

if not exist "envision_pos_production.zip" (
    echo ❌ Production package not created. Exiting.
    pause
    exit /b 1
)

echo.
echo ✅ Production package created successfully!
echo 📁 File: envision_pos_production.zip
echo 📏 Size: 
dir envision_pos_production.zip | findstr "envision_pos_production.zip"

echo.
echo 🌐 DEPLOYMENT INSTRUCTIONS
echo =========================
echo.
echo 1. Upload envision_pos_production.zip to your server
echo    - Use your hosting file manager, or
echo    - Use SCP/SFTP to upload to /tmp/envision_pos_deploy/
echo.
echo 2. Connect to your server via SSH:
echo    ssh -p 65002 u308096205@82.29.157.140
echo.
echo 3. Run these commands on the server:
echo    mkdir -p /tmp/envision_pos_deploy
echo    # Upload the ZIP file to this directory
echo    chmod +x /tmp/envision_pos_deploy/deploy_production.sh
echo    /tmp/envision_pos_deploy/deploy_production.sh
echo.
echo 4. After deployment, test the application:
echo    curl -I https://pos.envisionxperts.com
echo.
echo 📧 If you need help with the deployment, check the logs:
echo    tail -f /domains/envisionxperts.com/public_html/pos/storage/logs/laravel.log
echo.
echo 🎯 Your application will be live at: https://pos.envisionxperts.com
echo.
pause
