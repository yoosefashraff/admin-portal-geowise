# Server Setup - Quick Start Guide

## What You'll Receive

After the build is complete, you'll receive these folders/files to upload to your server:

```
.next/
  ├── standalone/     ← Main application (self-contained, includes all dependencies)
  └── static/         ← Static assets (CSS, JavaScript, images)
public/               ← Public assets (icons, etc.)
```

**Total size:** ~50-100 MB (compressed)

---

## Server Requirements

**Minimum:**
- Node.js 18+ (LTS recommended)
- 500 MB free disk space
- Port 3000 available (or configurable)

**Recommended:**
- PM2 (process manager) for auto-restart
- Nginx or Apache (reverse proxy)
- 1 GB RAM minimum

---

## Quick Setup (5 Steps)

### 1. Install Node.js 18+

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v18.x.x or higher
```

### 2. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 3. Upload Files

Upload these folders to your server (recommended path: `/var/www/frontend/`):
- `.next/standalone/` (entire folder)
- `.next/static/` (entire folder)
- `public/` (entire folder)

**⚠️ Important:** Upload in BINARY mode (not ASCII)

### 4. Create Environment File

On server, create `/var/www/frontend/.env`:

```bash
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
PORT=3000
NODE_ENV=production
```

### 5. Start Application

```bash
cd /var/www/frontend
pm2 start .next/standalone/server.js --name frontend
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

---

## Configure Reverse Proxy

**Nginx example:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
        proxy_read_timeout 300s;
    }
}
```

Then restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Verify It Works

1. Check app is running: `pm2 status`
2. Test locally: `curl http://localhost:3000`
3. Visit in browser: `http://your-domain.com`

---

## Full Documentation

See `docs/server-deployment-guide.md` for complete step-by-step instructions, troubleshooting, and detailed configuration.

---

## What Happens Next

1. **You configure the server** (using this guide)
2. **Share the frontend URL** with the development team
3. **Development team configures backend** to accept requests from your frontend domain (CORS settings)

---

## Questions?

**Common issues:**
- App won't start → Check Node.js version (must be 18+)
- Port conflict → Change PORT in `.env` file
- 502 Bad Gateway → Verify app is running: `pm2 status`
- Missing files → Re-upload `.next/standalone/` folder

**Check logs:**
```bash
pm2 logs frontend
```
