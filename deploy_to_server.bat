@echo off
echo Uploading deployment package to server...

REM Upload the zip file to server home directory first
scp -P 65002 envision_pos_production.zip u308096205@82.29.157.140:~/

echo Connecting to server to extract and configure...

REM Connect to server and execute deployment commands
ssh -p 65002 u308096205@82.29.157.140 "cd domains/envisionxperts.com/public_html/pos && rm -rf * && mv ~/envision_pos_production.zip . && unzip envision_pos_production.zip && rm envision_pos_production.zip && chmod -R 755 . && chmod -R 644 *.php && chmod -R 755 storage && chmod -R 755 bootstrap/cache && find storage -type d -exec chmod 755 {} \; && find storage -type f -exec chmod 644 {} \; && ls -la"

echo Deployment completed!
pause
