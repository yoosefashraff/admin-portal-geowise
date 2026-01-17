# Company Server Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Next.js React application to your company server.

**What you'll receive:**
- Built application files (ready to run)
- Server configuration instructions
- Environment variable setup
- Process management setup

---

## Step 1: Build the Application

**On the development machine (before uploading):**

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Build the application
npm run build
```

**This creates:**
- `.next/standalone/` - Self-contained Node.js application (all dependencies included)
- `.next/static/` - Static assets (CSS, JavaScript, images)
- `public/` - Public files (SVG icons, etc.)

**Files to upload to server:**
```
.next/
  ├── standalone/     ← Main application (required)
  └── static/         ← Static assets (required)
public/               ← Public assets (required)
package.json         ← For reference (optional)
```

---

## Step 2: Upload Files to Server

**Upload these folders/files to your server:**

**Recommended server path:** `/var/www/frontend/` (or your preferred location)

**Upload structure:**
```
/var/www/frontend/
├── .next/
│   ├── standalone/     ← Upload entire folder
│   └── static/         ← Upload entire folder
├── public/             ← Upload entire folder
└── package.json        ← Optional (for reference)
```

**⚠️ Important:**
- Upload in **BINARY mode** (not ASCII) to avoid file corruption
- Maintain folder structure exactly as shown
- All files in `.next/standalone/` are required (it's self-contained)

---

## Step 3: Server Prerequisites

**Required software on server:**

### 3.1 Node.js

**Check if Node.js is installed:**
```bash
node --version
```

**If not installed, install Node.js 18+ (LTS recommended):**

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

**Verify installation:**
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### 3.2 PM2 (Process Manager) - Recommended

**Install PM2 globally:**
```bash
sudo npm install -g pm2
```

**PM2 benefits:**
- Auto-restart on crashes
- Auto-start on server reboot
- Process monitoring
- Log management

**Alternative:** You can run the app directly with Node.js (see Step 5)

---

## Step 4: Environment Variables

**Create `.env` file on server:**

```bash
cd /var/www/frontend
nano .env
```

**Add these variables:**

```bash
# Backend API URL (DEV environment)
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai

# Google Maps API Key (REQUIRED for maps to work)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Server port (default: 3000)
PORT=3000

# Node environment
NODE_ENV=production
```

**⚠️ Important:**
- Replace `your_google_maps_api_key_here` with your actual Google Maps API key
- These variables must match what was used during build
- File should be at: `/var/www/frontend/.env`

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## Step 5: Start the Application

### Option A: Using PM2 (Recommended)

**Start the application:**
```bash
cd /var/www/frontend
pm2 start .next/standalone/server.js --name frontend
```

**Save PM2 configuration (auto-start on reboot):**
```bash
pm2 save
pm2 startup  # Run once - follow the instructions it prints
```

**Useful PM2 commands:**
```bash
pm2 status          # Check app status
pm2 logs frontend   # View logs
pm2 restart frontend # Restart app
pm2 stop frontend   # Stop app
pm2 delete frontend # Remove from PM2
```

### Option B: Using Node.js Directly

**Start the application:**
```bash
cd /var/www/frontend
node .next/standalone/server.js
```

**⚠️ Note:** This runs in foreground. Use `Ctrl+C` to stop. For production, use PM2 (Option A).

**To run in background:**
```bash
nohup node .next/standalone/server.js > app.log 2>&1 &
```

---

## Step 6: Configure Reverse Proxy (Nginx/Apache)

**The app runs on port 3000. Configure your web server to proxy requests.**

### Nginx Configuration

**Create/edit Nginx config file:**
```bash
sudo nano /etc/nginx/sites-available/frontend
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your actual domain

    # Redirect HTTP to HTTPS (if you have SSL)
    # return 301 https://$server_name$request_uri;

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
        
        # Increase timeout for long-running requests (auto-dispatch)
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Apache Configuration

**If using Apache, add to your virtual host:**

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Increase timeout for long-running requests
    ProxyTimeout 300
</VirtualHost>
```

**Enable required modules:**
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo systemctl restart apache2
```

---

## Step 7: Verify Deployment

**1. Check if app is running:**
```bash
# If using PM2
pm2 status

# Or check port
netstat -tulpn | grep 3000
```

**2. Test locally on server:**
```bash
curl http://localhost:3000
```

**3. Test from browser:**
- Visit: `http://your-domain.com` (or your configured domain)
- Should see the login page

**4. Check logs if issues:**
```bash
# PM2 logs
pm2 logs frontend

# Or if running directly
tail -f app.log
```

---

## Step 8: Configure Backend URL

**Once the frontend is deployed, configure the backend to accept requests from the frontend domain:**

**Backend CORS configuration should include:**
```
Access-Control-Allow-Origin: http://your-domain.com
Access-Control-Allow-Credentials: true
```

**Or if using HTTPS:**
```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Credentials: true
```

---

## Troubleshooting

### App Won't Start

**Error: "Cannot find module"**
- Verify all files in `.next/standalone/` were uploaded
- Check file permissions: `chmod -R 755 /var/www/frontend`

**Error: "Port 3000 already in use"**
- Change PORT in `.env` file
- Or stop the process using port 3000: `lsof -ti:3000 | xargs kill`

**Error: "EACCES: permission denied"**
- Check file ownership: `chown -R www-data:www-data /var/www/frontend`
- Or run with appropriate user permissions

### App Starts But Shows Errors

**Check environment variables:**
```bash
cd /var/www/frontend
cat .env  # Verify all variables are set
```

**Check logs:**
```bash
pm2 logs frontend --lines 100
```

### Reverse Proxy Issues

**502 Bad Gateway:**
- Verify app is running: `pm2 status`
- Check Nginx/Apache error logs
- Verify proxy_pass URL matches app port

**504 Gateway Timeout:**
- Increase proxy timeout (already included in config above)
- Check if backend is responding

---

## File Structure Summary

**After deployment, server should have:**

```
/var/www/frontend/
├── .next/
│   ├── standalone/          # Main application (self-contained)
│   │   ├── server.js        # Entry point
│   │   ├── node_modules/    # All dependencies (included)
│   │   └── ...
│   └── static/              # Static assets
│       ├── chunks/          # JavaScript bundles
│       └── ...
├── public/                  # Public assets
│   └── ...
├── .env                     # Environment variables (create this)
└── package.json            # For reference (optional)
```

---

## Quick Reference Commands

```bash
# Navigate to app directory
cd /var/www/frontend

# Start with PM2
pm2 start .next/standalone/server.js --name frontend

# View logs
pm2 logs frontend

# Restart
pm2 restart frontend

# Stop
pm2 stop frontend

# Check status
pm2 status
```

---

## Support

**If you encounter issues:**
1. Check PM2 logs: `pm2 logs frontend`
2. Verify environment variables: `cat .env`
3. Check Node.js version: `node --version` (should be 18+)
4. Verify all files were uploaded correctly
5. Check reverse proxy configuration

**Common issues:**
- Missing environment variables → Check `.env` file
- Port conflicts → Change PORT in `.env` or stop conflicting process
- File permissions → Check ownership and permissions
- CORS errors → Configure backend CORS to allow frontend domain

---

## Next Steps

1. ✅ Upload files to server
2. ✅ Install Node.js 18+ and PM2
3. ✅ Create `.env` file with environment variables
4. ✅ Start application with PM2
5. ✅ Configure reverse proxy (Nginx/Apache)
6. ✅ Configure backend CORS to allow frontend domain
7. ✅ Test deployment

**After deployment is complete, share the frontend URL with the development team so they can configure the backend API URL and CORS settings.**
