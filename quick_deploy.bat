@echo off
echo Testing basic PHP first...

REM Test basic PHP functionality
ssh -p 65002 u308096205@82.29.157.140 "cd domains/envisionxperts.com/public_html/pos && rm -rf * && echo '<?php echo \"Hello World! PHP working on \" . date(\"Y-m-d H:i:s\"); ?>' > test.php && chmod 644 test.php"

echo Checking if basic PHP works...
ssh -p 65002 u308096205@82.29.157.140 "curl -s https://pos.envisionxperts.com/test.php"

echo.
echo Deploying Laravel application...

REM Upload Laravel files
scp -P 65002 envision_pos_production.zip u308096205@82.29.157.140:domains/envisionxperts.com/public_html/pos/

REM Extract and setup Laravel for shared hosting
ssh -p 65002 u308096205@82.29.157.140 "cd domains/envisionxperts.com/public_html/pos && rm test.php && unzip -o envision_pos_production.zip && rm envision_pos_production.zip && mv public/* . && mv public/.htaccess . 2>/dev/null || true && rmdir public && sed -i 's|__DIR__/../bootstrap|__DIR__/bootstrap|g' index.php && chmod -R 755 storage bootstrap/cache && chmod 644 *.php .htaccess .env"

echo Testing Laravel deployment...
ssh -p 65002 u308096205@82.29.157.140 "curl -s -I https://pos.envisionxperts.com | head -2"

echo Done!
