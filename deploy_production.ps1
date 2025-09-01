# Production Deployment Script for EnvisionSuite POS
# This script prepares and deploys the application to production server

Write-Host "Starting Production Deployment..." -ForegroundColor Green

# Step 1: Clear any cached configurations
Write-Host "Clearing cached configurations..." -ForegroundColor Yellow
if (Test-Path "bootstrap/cache/config.php") { Remove-Item "bootstrap/cache/config.php" -Force }
if (Test-Path "bootstrap/cache/routes-v7.php") { Remove-Item "bootstrap/cache/routes-v7.php" -Force }
if (Test-Path "bootstrap/cache/events.php") { Remove-Item "bootstrap/cache/events.php" -Force }

# Step 2: Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$deployFiles = @(
    "app",
    "bootstrap", 
    "config",
    "database",
    "public",
    "resources",
    "routes",
    "storage",
    "vendor",
    ".env",
    ".htaccess",
    "artisan",
    "composer.json",
    "composer.lock"
)

# Create temp directory for deployment
$tempDir = "temp_deploy"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir

# Copy files to temp directory
foreach ($file in $deployFiles) {
    if (Test-Path $file) {
        if ((Get-Item $file) -is [System.IO.DirectoryInfo]) {
            Copy-Item $file -Destination $tempDir -Recurse -Force
        } else {
            Copy-Item $file -Destination $tempDir -Force
        }
        Write-Host "Copied: $file" -ForegroundColor Cyan
    }
}

# Set proper permissions for storage directories
$storagePath = "$tempDir\storage"
if (Test-Path $storagePath) {
    Get-ChildItem $storagePath -Recurse | ForEach-Object { $_.Attributes = "Normal" }
}

# Create zip file with better compression
$zipPath = "envision_pos_production.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)
Write-Host "Created deployment package: $zipPath" -ForegroundColor Green

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

Write-Host "Production deployment package ready!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload $zipPath to your server" -ForegroundColor White
Write-Host "2. Extract to /domains/envisionxperts.com/public_html/pos/" -ForegroundColor White
Write-Host "3. Set proper file permissions (755 for directories, 644 for files)" -ForegroundColor White
