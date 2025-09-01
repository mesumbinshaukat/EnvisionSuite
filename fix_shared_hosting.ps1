# Fix Laravel application for shared hosting
Write-Host "Fixing Laravel application for shared hosting..." -ForegroundColor Green

# Connect to server and fix the setup
$commands = @"
cd domains/envisionxperts.com/public_html/pos
rm -f envision_pos_production.zip
chmod -R 755 storage bootstrap/cache
chmod 644 .env
find . -name '*.php' -exec chmod 644 {} \;
cp public/index.php index.php
sed -i 's|__DIR__/../|__DIR__/|g' index.php
cp public/.htaccess .htaccess
mkdir -p public/storage
ln -sf ../../storage/app/public public/storage
php artisan storage:link 2>/dev/null || echo "Storage link already exists or not needed"
ls -la index.php .htaccess
echo "Setup completed!"
"@

Write-Host "Executing server commands..." -ForegroundColor Yellow
ssh -p 65002 u308096205@82.29.157.140 $commands

Write-Host "Testing website..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://pos.envisionxperts.com" -Method Head -ErrorAction Stop
    Write-Host "SUCCESS: Website is now accessible! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Website still has issues: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
