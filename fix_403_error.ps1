# Script to diagnose and fix 403 error on pos.envisionxperts.com
Write-Host "Diagnosing 403 error on pos.envisionxperts.com..." -ForegroundColor Green

# First, let's check the current website status
Write-Host "Checking current website status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://pos.envisionxperts.com" -Method Head -ErrorAction Stop
    Write-Host "Website is accessible. Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Website error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# Check if we can reach the server
Write-Host "Testing server connectivity..." -ForegroundColor Yellow
$serverTest = Test-NetConnection -ComputerName "82.29.157.140" -Port 65002
if ($serverTest.TcpTestSucceeded) {
    Write-Host "Server is reachable on port 65002" -ForegroundColor Green
} else {
    Write-Host "Cannot reach server on port 65002" -ForegroundColor Red
}

Write-Host "Manual steps to fix 403 error:" -ForegroundColor Cyan
Write-Host "1. Connect to server: ssh -p 65002 u308096205@82.29.157.140" -ForegroundColor White
Write-Host "2. Navigate to: cd /domains/envisionxperts.com/public_html/pos/" -ForegroundColor White
Write-Host "3. Check current files: ls -la" -ForegroundColor White
Write-Host "4. Remove old files: rm -rf *" -ForegroundColor White
Write-Host "5. Upload and extract: unzip envision_pos_production.zip" -ForegroundColor White
Write-Host "6. Set permissions: chmod -R 755 . && chmod -R 644 *.php" -ForegroundColor White
Write-Host "7. Fix storage permissions: chmod -R 755 storage bootstrap/cache" -ForegroundColor White
