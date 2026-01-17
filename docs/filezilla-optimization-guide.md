# FileZilla Optimization Guide for Large Uploads

## Problem
Large file uploads (2000+ files) are timing out or failing in FileZilla.

## Solution: Optimize FileZilla Settings

### Step 1: Adjust Connection Settings

1. **Edit → Settings**
2. **Connection → FTP:**
   - **Timeout:** Set to `120` seconds (or higher)
   - **Retry count:** Set to `3`
   - **Delay between failed login attempts:** `5` seconds
   - **Uncheck "Use passive mode"** (use Active mode)

### Step 2: Optimize Transfer Settings

1. **Edit → Settings**
2. **Transfers:**
   - **Maximum simultaneous transfers:** Set to `1` (one at a time)
   - **Limit number of simultaneous transfers:** Check this
   - **Transfer timeout:** Set to `120` seconds
   - **Keep alive:** Check this

### Step 3: Set Binary Transfer Mode

1. **Transfer → Transfer Type → Binary**
   - This prevents file corruption
   - Must be set before uploading

### Step 4: Retry Failed Transfers

1. Go to **"Failed transfers"** tab
2. Select all failed files (Ctrl+A)
3. Right-click → **"Reset and requeue all"**
4. FileZilla will retry with optimized settings

## Alternative: Upload in Batches

If failures persist, upload folders separately:

1. **Cancel current upload** (if running)
2. Upload `.next/standalone/` folder first
3. Then upload `.next/static/` folder
4. Finally upload `public/` folder

## Expected Results

With these settings:
- ✅ Fewer timeouts
- ✅ More reliable transfers
- ✅ Automatic retries
- ✅ Better progress tracking

## If Still Failing

Contact backend team to check:
- Server disk space
- FTP user permissions
- Firewall settings
- Server-side timeout limits
