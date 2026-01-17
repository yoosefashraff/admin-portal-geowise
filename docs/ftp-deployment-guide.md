# FTP Deployment Guide - Company Server

## Overview

This guide covers deploying the Next.js frontend application to the company server via FTP.

**FTP Server Details:**
- **Server IP:** `8.213.23.175`
- **Port:** `21`
- **Username:** `ftpuser`
- **Password:** `012022037055116080071`
- **Passive Mode:** `false` (Active mode)
- **Server Path:** `/var/www/frontend/` (FTP root `/` maps to this)

---

## Quick Start

### 1. Build and Prepare

```bash
# Build the application (uses env vars from .env)
npm run build

# Prepare files for FTP upload
npm run prepare-ftp
```

This creates `./deploy/` folder with all files ready for upload.

### 2. Upload via FTP

**Option A: Manual Upload (Recommended)**

Using SpeedCommander or FileZilla:

1. **Connect to FTP:**
   - Host: `8.213.23.175`
   - Port: `21`
   - Username: `ftpuser`
   - Password: `012022037055116080071`
   - Passive Mode: `false` (Active mode)

2. **Set Transfer Mode to BINARY** ⚠️ **CRITICAL!**
   - SpeedCommander: Right-click → Transfer Mode → Binary
   - FileZilla: Transfer → Transfer Type → Binary
   - **ASCII mode will corrupt binary files!**

3. **Upload everything from `./deploy/` folder**
   - Upload to FTP root `/` (maps to `/var/www/frontend/` on server)
   - Upload structure:
     ```
     / (FTP root)
     ├── .next/
     │   ├── standalone/
     │   └── static/
     └── public/
     ```

**Option B: Automated Upload (May have connection issues)**

```bash
npm run deploy-ftp
```

**Note:** If automated upload fails with "530 User cannot log in", use manual upload instead. The deployment package is ready in `./deploy/` folder.

---

## Server Setup

### Prerequisites

**Ask backend team to confirm:**
- [ ] Node.js 18+ installed
- [ ] PM2 installed (for process management)
- [ ] Nginx/Apache configured (reverse proxy)
- [ ] SSH access (optional, for running commands)

### Step 1: Create Environment Variables

**On server, create `.env` file:**

```bash
cd /var/www/frontend
nano .env
```

**Add:**
```bash
# Dev API URL (for company server)
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai

# Google Maps API Key (REQUIRED)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# Server port (optional, default: 3000)
PORT=3000

# Node environment
NODE_ENV=production
```

**Important:** Environment variables must match build-time variables!

### Step 2: Start the Application

**Using Node.js directly:**
```bash
cd /var/www/frontend
node .next/standalone/server.js
```

**Using PM2 (Recommended):**
```bash
cd /var/www/frontend
pm2 start .next/standalone/server.js --name frontend
pm2 save
pm2 startup  # Run once to enable auto-start on reboot
```

### Step 3: Configure Reverse Proxy

**Ask backend team to configure Nginx/Apache, or provide this config:**

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with actual domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Then restart Nginx:**
```bash
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## Files Structure

**After upload, server structure should be:**
```
/var/www/frontend/
├── .next/
│   ├── standalone/     # Main application (self-contained)
│   └── static/         # Static assets (CSS, JS, images)
├── public/             # Public assets (SVG, etc.)
├── package.json        # For reference
└── .env                # Environment variables (create on server)
```

---

## Deployment Commands

### Prepare Files Only
```bash
npm run prepare-ftp
```
Creates `./deploy/` folder ready for manual upload.

### Automated Deployment
```bash
npm run deploy-ftp
```
Prepares files and uploads automatically via FTP.

---

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Check `.env` file exists with `NEXT_PUBLIC_DEV_API_URL` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Verify `output: 'standalone'` is in `next.config.js`

### Upload Fails

**Error: Permission denied**
- Check FTP user has write permissions
- Verify upload path is correct

**Error: Connection timeout**
- Verify FTP server IP and port
- Check firewall settings
- Try passive mode if active mode fails (though backend specified active)

**Error: Files corrupted**
- ⚠️ **You used ASCII mode instead of BINARY!**
- Re-upload with BINARY transfer mode

### App Won't Start on Server

**Error: Cannot find module**
- Verify all files were uploaded (check `.next/standalone/` exists)
- Check file permissions

**Error: Port already in use**
- Change `PORT` in `.env` file
- Or stop existing process: `pm2 stop frontend`

**Error: Environment variables not found**
- Verify `.env` file exists on server
- Check `.env` file has correct variable names
- Restart app after creating `.env`

### API Calls Fail

**Error: CORS or 401 errors**
- Verify environment variables on server match build-time variables
- Check backend CORS configuration includes server domain
- Verify API URL is correct (`NEXT_PUBLIC_DEV_API_URL`)

---

## Environment Variables

### Build-Time Variables (from `.env`)

These are embedded during build:
- `NEXT_PUBLIC_DEV_API_URL` - Dev API URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

### Runtime Variables (on server `.env`)

These are read when app runs:
- `NEXT_PUBLIC_DEV_API_URL` - Must match build-time value
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Must match build-time value
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Set to `production`

**Important:** Build-time and runtime variables must match!

---

## Verification

### Check if App is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs frontend

# Or test directly
curl http://localhost:3000
```

### Access the Application

- Visit the domain configured in Nginx
- Or visit `http://8.213.23.175:3000` (if port is open)

---

## Questions for Backend Team

Before deploying, confirm:

1. ✅ **Upload path:** `/var/www/frontend/` (confirmed)
2. ❓ **Node.js version?** (should be 18+)
3. ❓ **PM2 installed?** (for process management)
4. ❓ **Nginx/Apache configured?** (reverse proxy)
5. ❓ **What port should app run on?** (default: 3000)
6. ❓ **Do I have SSH access?** (for running commands)
7. ❓ **What domain will app be accessible on?**
8. ❓ **Should I use production API or dev API?** (using dev API as specified)

---

## Next Steps

1. **Build and deploy:**
   ```bash
   npm run build
   npm run deploy-ftp
   ```

2. **On server, create `.env` and start app**

3. **Configure Nginx/Apache** (ask backend team)

4. **Verify deployment** (check logs, test pages)

5. **Set up CI/CD** (future - automate deployments)

---

**Status:** Ready for deployment. FTP credentials configured, scripts created.
