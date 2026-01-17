# FTP Batch Upload Guide - Step by Step

## Problem
Uploading 2000+ files at once is causing too many failures.

## Solution: Upload One Folder at a Time

This is the **most reliable method** when FTP is unstable.

---

## Step-by-Step Instructions

### Step 1: Cancel Current Upload (if running)

1. In FileZilla: **Transfer → Cancel**
2. Wait for current transfers to stop

### Step 2: Clear Failed Transfers

1. Go to **"Failed transfers"** tab
2. Right-click → **"Clear all"** (to start fresh)

### Step 3: Upload `.next/standalone/` Folder First

**This is the most important folder:**

1. **In FileZilla left panel:**
   - Navigate to: `D:\Joe\personal branding\Sites\Cursor\company-admin-portal\deploy\.next\standalone\`
   - You should see many files and folders

2. **Select the entire `standalone` folder:**
   - Click on `standalone` folder
   - Or select all contents inside it

3. **In FileZilla right panel:**
   - Make sure you're at root `/`
   - Navigate to `.next` folder (or create it if needed)

4. **Upload:**
   - Drag `standalone` folder from left to right
   - Or right-click → **Upload**

5. **Wait for completion:**
   - Monitor progress
   - This may take 10-20 minutes
   - Let it finish completely

### Step 4: Upload `.next/static/` Folder

**After `standalone` is done:**

1. **In left panel:**
   - Navigate to: `D:\Joe\personal branding\Sites\Cursor\company-admin-portal\deploy\.next\static\`

2. **In right panel:**
   - Navigate to `/.next/` folder
   - You should see `standalone` folder already there

3. **Upload `static` folder:**
   - Drag from left to right
   - Wait for completion

### Step 5: Upload `public/` Folder

**Finally:**

1. **In left panel:**
   - Navigate to: `D:\Joe\personal branding\Sites\Cursor\company-admin-portal\deploy\public\`

2. **In right panel:**
   - Navigate to root `/`

3. **Upload `public` folder:**
   - Drag from left to right
   - Wait for completion

---

## Why This Works Better

- ✅ **Fewer files per upload** = More reliable
- ✅ **Easier to monitor** = See which folder has issues
- ✅ **Can retry individual folders** = Don't need to restart everything
- ✅ **Less connection overhead** = Fewer simultaneous transfers

---

## If a Folder Still Fails

**For that specific folder:**

1. **Cancel the upload**
2. **Check FileZilla settings:**
   - Edit → Settings → Connection → FTP
   - Timeout: `300` seconds
   - Retry: `10`
3. **Try again** with just that folder

---

## Alternative: Compress and Upload

**If batch uploads still fail:**

1. **Create ZIP file:**
   - Right-click `deploy` folder → Send to → Compressed folder
   - Creates `deploy.zip`

2. **Upload ZIP file:**
   - Upload `deploy.zip` to server (1 file = fast!)

3. **Extract on server (requires SSH):**
   ```bash
   cd /var/www/frontend
   unzip deploy.zip
   rm deploy.zip
   ```

---

## Quick Checklist

- [ ] Cancel current upload
- [ ] Clear failed transfers
- [ ] Upload `.next/standalone/` folder
- [ ] Wait for completion
- [ ] Upload `.next/static/` folder
- [ ] Wait for completion
- [ ] Upload `public/` folder
- [ ] Verify all files uploaded

---

**Start with uploading just the `standalone` folder first. This is the most critical folder.**
