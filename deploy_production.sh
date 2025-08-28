#!/bin/bash

# Production Deployment Script for EnvisionSuite POS
# This script will deploy the application to pos.envisionxperts.com

echo "🚀 Starting production deployment..."

# Set variables
APP_DIR="/domains/envisionxperts.com/public_html/pos"
BACKUP_DIR="/domains/envisionxperts.com/public_html/pos_backup_$(date +%Y%m%d_%H%M%S)"
TEMP_DIR="/tmp/envision_pos_deploy"

# Create backup of current installation
echo "📦 Creating backup of current installation..."
if [ -d "$APP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "$APP_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    echo "✅ Backup created at: $BACKUP_DIR"
else
    echo "ℹ️  No existing installation found, skipping backup"
fi

# Clean up old installation
echo "🧹 Cleaning up old installation..."
rm -rf "$APP_DIR"/* 2>/dev/null || true
rm -rf "$APP_DIR"/.* 2>/dev/null || true

# Create fresh directory structure
echo "📁 Creating fresh directory structure..."
mkdir -p "$APP_DIR"

# Extract deployment package
echo "📦 Extracting deployment package..."
if [ -f "$TEMP_DIR/envision_pos_production.zip" ]; then
    unzip -q "$TEMP_DIR/envision_pos_production.zip" -d "$APP_DIR"
    echo "✅ Package extracted successfully"
else
    echo "❌ Deployment package not found at $TEMP_DIR/envision_pos_production.zip"
    exit 1
fi

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod -R 755 "$APP_DIR"
chmod -R 644 "$APP_DIR"/.env.production
chmod -R 755 "$APP_DIR"/storage
chmod -R 755 "$APP_DIR"/bootstrap/cache

# Copy production environment file
echo "⚙️  Setting up production environment..."
cp "$APP_DIR"/.env.production "$APP_DIR"/.env

# Install Composer dependencies (production only)
echo "📚 Installing Composer dependencies..."
cd "$APP_DIR"
composer install --no-dev --optimize-autoloader --no-interaction

# Clear and cache configurations
echo "🧹 Clearing and caching configurations..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run database migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Create storage symlink
echo "🔗 Creating storage symlink..."
php artisan storage:link

# Set final permissions
echo "🔐 Setting final permissions..."
chown -R u308096205:u308096205 "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod -R 644 "$APP_DIR"/.env

# Clean up temporary files
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "✅ Production deployment completed successfully!"
echo "🌐 Your application is now live at: https://pos.envisionxperts.com"
echo "📧 Check the logs if you encounter any issues: tail -f $APP_DIR/storage/logs/laravel.log"
