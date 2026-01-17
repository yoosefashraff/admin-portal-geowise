# Netlify Deployment Not Triggering - Troubleshooting Guide

## Problem
After setting `netlify` as the default branch on GitHub, Netlify didn't automatically trigger a deployment.

## Common Causes & Solutions

### 1. Netlify Still Watching Old Branch

**Issue:** Netlify may still be configured to watch `main` instead of `netlify`.

**Solution:**
1. Go to **Netlify Dashboard** → Your Site
2. **Site Settings** → **Build & deploy** → **Continuous Deployment**
3. Under **Production branch**, verify it shows `netlify`
4. If it shows `main` or another branch:
   - Click **Edit settings**
   - Change **Production branch** to `netlify`
   - Click **Save**

### 2. Webhook Not Updated

**Issue:** GitHub webhook may still point to the old default branch.

**Solution:**
1. Go to **Netlify Dashboard** → Your Site
2. **Site Settings** → **Build & deploy** → **Build hooks**
3. Check if webhook exists and is active
4. If needed, **Disconnect** and **Reconnect** the site:
   - **Site Settings** → **Build & deploy** → **Continuous Deployment**
   - Click **Disconnect** (if connected)
   - Click **Connect to Git provider**
   - Select **GitHub** → **yoosefashraff/company-admin-portal**
   - Select **netlify** branch
   - Click **Save**

### 3. Manual Trigger (Quick Fix)

**Immediate Solution:**
1. Go to **Netlify Dashboard** → Your Site
2. Click **Deploys** tab
3. Click **Trigger deploy** → **Deploy site**
4. This will deploy from the current `netlify` branch

### 4. Verify Branch Has Recent Commits

Check if the branch actually has new commits:

```bash
# Check latest commit on netlify branch
git log origin/netlify --oneline -1

# Verify the commit exists
git show origin/netlify:package.json
```

### 5. Check Netlify Build Logs

1. Go to **Netlify Dashboard** → Your Site
2. Click **Deploys** tab
3. Check the latest deploy status
4. If there's a failed deploy, click on it to see error logs

### 6. Reconnect Site (Nuclear Option)

If nothing else works:

1. **Note your environment variables** (you'll need to re-add them)
2. Go to **Site Settings** → **General** → **Site information**
3. Scroll down to **Danger zone**
4. Click **Delete site** (or disconnect if you want to keep history)
5. **Add new site** → **Import from Git**
6. Select **GitHub** → **yoosefashraff/company-admin-portal**
7. Configure:
   - **Branch to deploy:** `netlify`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
8. Add environment variables:
   - `NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here`

## Verification Checklist

After fixing, verify:

- [ ] Netlify **Production branch** is set to `netlify`
- [ ] GitHub default branch is `netlify` (already done ✅)
- [ ] Netlify webhook is active and connected
- [ ] Latest commit on `netlify` branch is visible in Netlify
- [ ] Manual deploy works (trigger deploy → deploy site)

## Testing Auto-Deploy

To test if auto-deploy works:

1. Make a small change (e.g., add a comment to a file)
2. Commit and push to `netlify` branch:
   ```bash
   git checkout netlify  # or create it if doesn't exist locally
   # Make a small change
   git add .
   git commit -m "test: trigger netlify deploy"
   git push origin netlify
   ```
3. Check Netlify **Deploys** tab - should see a new deploy starting automatically

## Still Not Working?

If none of the above works:

1. **Check Netlify Status:** https://www.netlifystatus.com/
2. **Check GitHub Webhooks:**
   - Go to your repo: https://github.com/yoosefashraff/company-admin-portal
   - **Settings** → **Webhooks**
   - Verify Netlify webhook exists and has recent deliveries
3. **Contact Netlify Support** with:
   - Site name/URL
   - Repository: `yoosefashraff/company-admin-portal`
   - Branch: `netlify`
   - Issue: "Auto-deploy not triggering after setting netlify as default branch"
