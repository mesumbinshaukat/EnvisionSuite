# 🚀 EnvisionSuite POS - Production Deployment Guide

## 📋 Prerequisites

- **Server Access**: SSH access to `82.29.157.140:65002`
- **Database**: MySQL database `u308096205_pos` with credentials provided
- **Domain**: `pos.envisionxperts.com` pointing to `/domains/envisionxperts.com/public_html/pos/`
- **PHP Version**: 8.2+ (Laravel 12 requirement)
- **Composer**: Available on server
- **Unzip**: Available on server

## 🔧 Local Preparation (Windows)

### 1. Build Production Package
```bash
# Run the production build script
build_production.bat
```

This will create `envision_pos_production.zip` containing:
- ✅ All application code
- ✅ Built frontend assets
- ✅ Production environment file
- ✅ Deployment scripts
- ✅ Database migrations

### 2. Verify Package Contents
The ZIP should contain:
```
envision_pos_production/
├── app/
├── bootstrap/
├── config/
├── database/
├── lang/
├── public/
├── resources/
├── routes/
├── storage/
├── artisan
├── composer.json
├── .env.production
├── deploy_production.sh
└── .gitignore.production
```

## 🚀 Server Deployment

### 1. Connect to Server
```bash
ssh -p 65002 u308096205@82.29.157.140
```

### 2. Upload Deployment Package
```bash
# Create temporary directory
mkdir -p /tmp/envision_pos_deploy

# Upload the ZIP file to this directory
# (Use your preferred method: SCP, SFTP, or web upload)
```

### 3. Run Deployment Script
```bash
# Make script executable
chmod +x /tmp/envision_pos_deploy/deploy_production.sh

# Run deployment
/tmp/envision_pos_deploy/deploy_production.sh
```

## 🔍 Post-Deployment Verification

### 1. Check Application Status
```bash
# Test main page
curl -I https://pos.envisionxperts.com

# Test API endpoints
curl -I https://pos.envisionxperts.com/api/health

# Check Laravel logs
tail -f /domains/envisionxperts.com/public_html/pos/storage/logs/laravel.log
```

### 2. Verify Database Connection
```bash
# Test database connection
cd /domains/envisionxperts.com/public_html/pos
php artisan tinker
# Try: DB::connection()->getPdo();
```

### 3. Check File Permissions
```bash
# Verify permissions
ls -la /domains/envisionxperts.com/public_html/pos/
ls -la /domains/envisionxperts.com/public_html/pos/storage/
ls -la /domains/envisionxperts.com/public_html/pos/bootstrap/cache/
```

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### 1. Permission Denied
```bash
# Fix ownership
chown -R u308096205:u308096205 /domains/envisionxperts.com/public_html/pos/

# Fix permissions
chmod -R 755 /domains/envisionxperts.com/public_html/pos/
chmod -R 644 /domains/envisionxperts.com/public_html/pos/.env
```

#### 2. Database Connection Failed
```bash
# Check database credentials in .env
# Verify database exists and user has permissions
# Test connection manually
```

#### 3. Storage Issues
```bash
# Create storage symlink
php artisan storage:link

# Fix storage permissions
chmod -R 775 storage/
chmod -R 775 bootstrap/cache/
```

#### 4. Composer Issues
```bash
# Clear composer cache
composer clear-cache

# Reinstall dependencies
composer install --no-dev --optimize-autoloader
```

## 📊 Monitoring & Maintenance

### 1. Log Monitoring
```bash
# Monitor Laravel logs
tail -f storage/logs/laravel.log

# Monitor error logs
tail -f storage/logs/laravel-$(date +%Y-%m-%d).log
```

### 2. Performance Optimization
```bash
# Cache configurations
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize autoloader
composer install --optimize-autoloader --no-dev
```

### 3. Backup Strategy
```bash
# Database backup
mysqldump -u u308096205_envisionxpert -p u308096205_pos > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /domains/envisionxperts.com/public_html/pos/
```

## 🔒 Security Considerations

### 1. Environment Variables
- ✅ `.env` file has restricted permissions (644)
- ✅ Production debug mode is disabled
- ✅ Log level set to error only
- ✅ Session encryption enabled

### 2. File Permissions
- ✅ Application files: 755
- ✅ Configuration files: 644
- ✅ Storage directories: 755
- ✅ Cache directories: 755

### 3. Database Security
- ✅ Database user has limited permissions
- ✅ Connection uses localhost only
- ✅ Strong password implementation

## 📞 Support & Rollback

### Rollback Procedure
```bash
# Restore from backup
rm -rf /domains/envisionxperts.com/public_html/pos/*
cp -r /domains/envisionxperts.com/public_html/pos_backup_YYYYMMDD_HHMMSS/* /domains/envisionxperts.com/public_html/pos/

# Restore environment
cp /domains/envisionxperts.com/public_html/pos_backup_YYYYMMDD_HHMMSS/.env /domains/envisionxperts.com/public_html/pos/

# Restart services if needed
```

### Contact Information
- **Deployment Issues**: Check logs first
- **Database Issues**: Verify credentials and permissions
- **Application Issues**: Check Laravel logs and error reporting

---

## 🎯 Success Checklist

- [ ] Production package built successfully
- [ ] Package uploaded to server
- [ ] Deployment script executed without errors
- [ ] Application accessible at https://pos.envisionxperts.com
- [ ] Database connection working
- [ ] All routes responding correctly
- [ ] File permissions set correctly
- [ ] Storage symlinks created
- [ ] Caches cleared and rebuilt
- [ ] Logs accessible and writable

**🎉 Deployment Complete!**
