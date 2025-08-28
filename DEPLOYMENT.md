# 🚀 Production Deployment Guide

## Quick Steps

### 1. Build Production Package (Windows)
```bash
.\build_production.bat
```

### 2. Upload to Server
Upload `envision_pos_production.zip` to `/tmp/envision_pos_deploy/` on the server.

### 3. Deploy on Server
```bash
ssh -p 65002 u308096205@82.29.157.140

# Create temp directory and upload ZIP
mkdir -p /tmp/envision_pos_deploy

# Make script executable and run
chmod +x /tmp/envision_pos_deploy/deploy_production.sh
/tmp/envision_pos_deploy/deploy_production.sh
```

## Server Details
- **Host**: 82.29.157.140:65002
- **User**: u308096205
- **Path**: /domains/envisionxperts.com/public_html/pos/
- **Domain**: pos.envisionxperts.com

## Database
- **Name**: u308096205_pos
- **User**: u308096205_envisionxpert
- **Password**: f2Z/tA8to^@Z
