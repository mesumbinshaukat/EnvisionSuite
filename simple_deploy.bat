@echo off
echo === Testing Basic PHP Functionality ===

REM Step 1: Test basic PHP
ssh -p 65002 u308096205@82.29.157.140 "cd domains/envisionxperts.com/public_html/pos && rm -rf * && echo '<?php echo \"Hello World! PHP working on \" . date(\"Y-m-d H:i:s\"); ?>' > test.php && chmod 644 test.php"

echo Testing basic PHP...
ssh -p 65002 u308096205@82.29.157.140 "curl -s https://pos.envisionxperts.com/test.php"

echo.
echo === Deploying Laravel Application ===

REM Step 2: Upload and extract Laravel
scp -P 65002 envision_pos_production.zip u308096205@82.29.157.140:domains/envisionxperts.com/public_html/pos/
ssh -p 65002 u308096205@82.29.157.140 "cd domains/envisionxperts.com/public_html/pos && rm test.php && unzip -o envision_pos_production.zip && rm envision_pos_production.zip"

REM Step 3: Simple Laravel setup for shared hosting
ssh -p 65002 u308096205@82.29.157.140 "cd domains/envisionxperts.com/public_html/pos && mv public/* . && mv public/.htaccess . && rmdir public && chmod -R 755 storage bootstrap/cache && chmod 644 *.php .htaccess .env"

echo Testing Laravel deployment...
ssh -p 65002 u308096205@82.29.157.140 "curl -s -I https://pos.envisionxperts.com | head -3"

echo Deployment completed!
pause
