# Comprehensive deployment test script
Write-Host "Testing EnvisionSuite POS Deployment..." -ForegroundColor Green

# Test 1: Basic connectivity
Write-Host "`n1. Testing basic website connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://pos.envisionxperts.com" -UseBasicParsing -TimeoutSec 30
    Write-Host "✓ Website accessible - Status: $($response.StatusCode)" -ForegroundColor Green
    
    # Check if it's a Laravel application
    if ($response.Content -match "Laravel|EnvisionSuite") {
        Write-Host "✓ Laravel application detected" -ForegroundColor Green
    } else {
        Write-Host "⚠ Laravel application not detected in response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Website error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "  Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test 2: Check server file structure
Write-Host "`n2. Checking server file structure..." -ForegroundColor Yellow
$serverCheck = @"
cd domains/envisionxperts.com/public_html/pos
echo "=== Root Directory ==="
ls -la | head -10
echo ""
echo "=== Index.php exists? ==="
ls -la index.php 2>/dev/null || echo "index.php not found"
echo ""
echo "=== .htaccess exists? ==="
ls -la .htaccess 2>/dev/null || echo ".htaccess not found"
echo ""
echo "=== Storage permissions ==="
ls -ld storage
echo ""
echo "=== Bootstrap cache permissions ==="
ls -ld bootstrap/cache
"@

ssh -p 65002 u308096205@82.29.157.140 $serverCheck

# Test 3: Test specific endpoints
Write-Host "`n3. Testing specific endpoints..." -ForegroundColor Yellow
$endpoints = @(
    "https://pos.envisionxperts.com",
    "https://pos.envisionxperts.com/login",
    "https://pos.envisionxperts.com/dashboard"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 15
        Write-Host "✓ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Unknown" }
        Write-Host "✗ $endpoint - Status: $statusCode" -ForegroundColor Red
    }
}

Write-Host "`nDeployment test completed!" -ForegroundColor Cyan
