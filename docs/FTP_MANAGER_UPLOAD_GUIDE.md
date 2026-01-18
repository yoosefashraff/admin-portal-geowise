# FTP Manager Upload & Deployment Guide

## Overview

This guide shows you how to upload and deploy your Next.js application using the FTP Manager web interface at `http://8.213.23.175:5660/`.

**Current Server Path:** `D:\Data\ftp\frontend\`

---

## Step 1: Build the Application

**On your local machine, run:**

```bash
npm run build
```

This creates:
- `.next/standalone/` - Self-contained Node.js application
- `.next/static/` - Static assets
- `public/` - Public files

---

## Step 2: Prepare Files for Upload

**You need to upload these folders:**
- `.next/standalone/` (entire folder)
- `.next/static/` (entire folder)  
- `public/` (entire folder)
- `.env` file (create this - see Step 6)

**Option A: Create ZIP file (Recommended)**

1. **Create a new folder** (e.g., `frontend-deploy`)

2. **Copy these folders into it:**
   ```
   frontend-deploy/
   ├── .next/
   │   ├── standalone/
   │   └── static/
   ├── public/
   └── .env          ← Create this file (see Step 6)
   ```

3. **Create `.env` file** in the `frontend-deploy` folder (see Step 6 for content)

4. **Create a ZIP file** of the `frontend-deploy` folder
   - Name it: `frontend-deploy.zip`
   - **Important:** ZIP the folder, not individual files

**Option B: Upload folders individually** (if ZIP is too large)

You can upload each folder separately, but ZIP is easier.

---

## Step 3: Upload via FTP Manager

### 3.1 Access Upload Section

1. **Go to:** `http://8.213.23.175:5660/`
2. **Log in** with:
   - Username: `ftpuser`
   - Password: `5cn@123`

3. **You'll see the "Upload Files" section** at the top

### 3.2 Upload the ZIP File

**Method 1: Drag & Drop**
1. Open File Explorer on your computer
2. Find your `frontend-deploy.zip` file
3. **Drag and drop** it into the "Drag & Drop files here" area

**Method 2: Browse Files**
1. Click **"Browse Files"** button
2. Select your `frontend-deploy.zip` file
3. Click **"Upload File"** button

**⚠️ Important:**
- Maximum file size: 1GB
- Only ZIP files are supported
- Wait for upload to complete (progress indicator will show)

---

## Step 4: Extract the ZIP File

**After upload completes:**

1. **Look in the "Files" section** - you should see `frontend-deploy.zip`

2. **Click on the ZIP file** to open/extract it

   **OR**

3. **If there's an "Extract" button/option:**
   - Right-click the ZIP file
   - Select "Extract" or "Extract Here"
   - This will create the folder structure

4. **Verify the structure:**
   - You should see `.next/` folder
   - Inside `.next/` should be `standalone/` and `static/`
   - You should see `public/` folder

---

## Step 5: Organize Files (If Needed)

**If files are in a subfolder (e.g., `frontend-deploy/.next/`):**

1. **Navigate into the extracted folder** (click "Open" on the folder)

2. **Move files to root level:**
   - Move `.next/` folder to root: `D:\Data\ftp\frontend\.next\`
   - Move `public/` folder to root: `D:\Data\ftp\frontend\public\`

**Final structure should be:**
```
D:\Data\ftp\frontend\
├── .next/
│   ├── standalone/
│   └── static/
├── public/
└── (other files)
```

---

## Step 6: Create Environment File

**⚠️ Note:** FTP Manager doesn't support creating files/folders directly. Use one of these methods:

### Method 1: Include `.env` in ZIP (Recommended)

**Before creating the ZIP file:**

1. **Create `.env` file locally** in your `frontend-deploy` folder:

   ```
   frontend-deploy/
   ├── .next/
   │   ├── standalone/
   │   └── static/
   ├── public/
   └── .env          ← Add this file
   ```

2. **Add this content to `.env`:**
   ```
   NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
   PORT=3000
   NODE_ENV=production
   ```

3. **Include `.env` when creating the ZIP file**

4. **After extraction**, `.env` will be in the correct location

**⚠️ Important:** Replace `your_google_maps_key_here` with your actual Google Maps API key.

### Method 2: Upload `.env` Separately (If ZIP Already Created)

1. **Create `.env` file on your local machine** with the content above

2. **Upload it via FTP Manager** (same as ZIP upload)

3. **It will appear in the "Files" section** after upload

### Method 3: Backend Developer Creates It (If You Don't Have Access)

**Share this with the backend developer:**

**They need to create:** `D:\Data\ftp\frontend\.env`

**Content:**
```
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
PORT=3000
NODE_ENV=production
```

**They can create it via:**
- SSH/command line: `echo "content" > D:\Data\ftp\frontend\.env`
- Or any text editor with server access

---

## Step 7: Server Configuration

**The backend developer needs to:**

1. **Install Node.js 18+** (if not already installed)
   ```bash
   # Check if installed
   node --version
   
   # If not, install Node.js 18+
   ```

2. **Install PM2** (process manager)
   ```bash
   npm install -g pm2
   ```

3. **Start the application:**
   ```bash
   cd D:\Data\ftp\frontend
   pm2 start .next\standalone\server.js --name frontend
   pm2 save
   ```

4. **Configure reverse proxy** (Nginx/Apache) to point to `http://localhost:3000`

---

## Troubleshooting

### Upload Fails

**Error: "File too large"**
- ZIP file must be under 1GB
- Try uploading folders individually instead

**Error: "Invalid file type"**
- Only ZIP files are supported
- Make sure you're uploading a `.zip` file, not `.rar` or other formats

### Files Not Appearing

**After upload, file doesn't show:**
- Refresh the page
- Check "Files" section (not just "Directories")
- Wait a few seconds for processing

### Extraction Issues

**ZIP won't extract:**
- Make sure ZIP file is not corrupted
- Try re-uploading
- Check file permissions on server

### App Won't Start

**Check:**
- All folders uploaded correctly (`.next/standalone/` exists)
- `.env` file created with correct values
- Node.js 18+ installed
- Port 3000 not in use

---

## Quick Checklist

- [ ] Built application: `npm run build`
- [ ] Created ZIP file with `.next/standalone/`, `.next/static/`, and `public/`
- [ ] Uploaded ZIP via FTP Manager
- [ ] Extracted ZIP file
- [ ] Verified folder structure is correct
- [ ] Created `.env` file with environment variables
- [ ] Backend developer installed Node.js 18+ and PM2
- [ ] Backend developer started app with PM2
- [ ] Backend developer configured reverse proxy
- [ ] Tested application in browser

---

## Next Steps

1. **Share the frontend URL** with the development team
2. **Development team configures backend CORS** to allow requests from your frontend domain
3. **Test the application** - login and verify all features work

---

## Notes

- **Server Path:** `D:\Data\ftp\frontend\` (Windows server)
- **Upload Limit:** 1GB per file
- **Supported Format:** ZIP files only
- **Current Directories:** `.next`, `deploy`, `public` already exist (from previous uploads)

If you need to replace existing files, you can:
- Delete old folders first (if FTP Manager allows)
- Or upload new files with same names (may overwrite)
