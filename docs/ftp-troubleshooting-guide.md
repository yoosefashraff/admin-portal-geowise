# FTP Upload Troubleshooting Guide

## Current Issue: High Failure Rate

**Symptoms:**
- 1200+ failed transfers
- Only 3 successful transfers
- "501 Server cannot accept argument" errors
- "550 The system cannot find the file specified" errors

## Root Causes

### 1. Network/Firewall Issues
- **Active Mode:** Server can't connect back to your private IP (192.168.1.4)
- **Passive Mode:** May also fail if server firewall blocks data ports
- **Solution:** Contact backend team to check firewall rules

### 2. Server-Side Issues
- **Disk space full?** - Check server disk space
- **Permission issues?** - Verify FTP user has write permissions
- **Server timeout too short?** - Check server FTP timeout settings

### 3. Too Many Files
- 2000+ files may overwhelm the connection
- **Solution:** Upload in smaller batches or compress first

## Solutions

### Solution 1: Upload in Smaller Batches

**Instead of uploading everything at once:**

1. **Cancel current upload** (if running)
2. **Upload one folder at a time:**
   - First: `.next/standalone/` only
   - Wait for completion
   - Then: `.next/static/` only
   - Wait for completion
   - Finally: `public/` only

**How to upload single folder:**
- In FileZilla, navigate to `./deploy/.next/standalone/`
- Select only the `standalone` folder
- Right-click → Upload
- Wait for completion before next folder

### Solution 2: Compress and Upload

**Create a ZIP file and upload:**

1. **Create ZIP of deploy folder:**
   ```bash
   # On Windows, right-click deploy folder → Send to → Compressed (zipped) folder
   # Or use PowerShell:
   Compress-Archive -Path ".\deploy\*" -DestinationPath ".\deploy.zip"
   ```

2. **Upload ZIP file via FileZilla:**
   - Upload `deploy.zip` to server
   - Much faster (1 file vs 2000+ files)

3. **Extract on server (via SSH):**
   ```bash
   cd /var/www/frontend
   unzip deploy.zip
   rm deploy.zip
   ```

### Solution 3: Check Server Issues

**Ask backend team to verify:**

1. **Disk space:**
   ```bash
   df -h /var/www/frontend
   ```

2. **FTP user permissions:**
   ```bash
   ls -la /var/www/frontend
   ```

3. **FTP server logs:**
   - Check for errors in FTP server logs
   - Look for connection/timeout issues

4. **Firewall rules:**
   - Verify FTP data ports are open
   - Check if your IP is whitelisted

### Solution 4: Alternative Deployment Methods

**If FTP continues to fail:**

1. **SSH/SCP (if available):**
   ```bash
   scp -r deploy/* user@8.213.23.175:/var/www/frontend/
   ```

2. **SFTP (if available):**
   - More reliable than FTP
   - Better error handling

3. **Ask backend team:**
   - Can they provide SSH access?
   - Can they set up SFTP instead of FTP?
   - Can they deploy from a Git repository?

## Recommended Next Steps

1. **Try Solution 1 first** (upload in batches)
   - Simplest, no server changes needed
   - More reliable for large uploads

2. **If that fails, try Solution 2** (compress and upload)
   - Fastest method
   - Requires SSH access to extract

3. **Contact backend team** for:
   - Server-side troubleshooting
   - Alternative deployment methods
   - SSH/SFTP access

## FileZilla Settings (Final Attempt)

If you want to try one more time with optimized settings:

1. **Edit → Settings**
2. **Connection → FTP:**
   - Timeout: `300` seconds (5 minutes)
   - Retry count: `10`
   - **Try both Active and Passive** (toggle and test)
3. **Transfers:**
   - Maximum simultaneous: `1`
   - Transfer timeout: `300` seconds
   - Keep alive: Checked
4. **File exists action:**
   - Set to "Overwrite" for all files

---

**Status:** FTP upload is unreliable due to network/server configuration. Recommend trying batch uploads or contacting backend team for alternative deployment method.
