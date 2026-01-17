# Setting Up Netlify Branch on Personal Repo

## Overview

The `netlify` branch on your personal GitHub repo (`yoosefashraff/company-admin-portal`) is automatically synced from the geowise repo's `master` and `dev` branches via GitHub Actions.

## Initial Setup

### 1. Create Netlify Branch on Personal Repo

```bash
# Clone your personal repo (if not already cloned)
git clone https://github.com/yoosefashraff/company-admin-portal.git
cd company-admin-portal

# Create netlify branch from master
git checkout -b netlify
git push origin netlify
```

### 2. Configure GitHub Secrets in Geowise Repo

Go to `GeoWise-AI/company-admin-portal` → Settings → Secrets and variables → Actions

Add these secrets:

1. **`PERSONAL_REPO_TOKEN`**
   - Create a GitHub Personal Access Token (PAT) with `repo` scope
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic) with `repo` permissions
   - Add as secret: `PERSONAL_REPO_TOKEN`

2. **Company Server Secrets** (configure based on your deployment method)
   - `COMPANY_PRODUCTION_SERVER` - Production server endpoint/credentials
   - `COMPANY_DEV_SERVER` - Dev server endpoint/credentials
   - `COMPANY_TWITCHERS_SERVER` - Twitchers server endpoint/credentials (if needed)

3. **Environment Variables** (for builds)
   - `NEXT_PUBLIC_DEV_API_URL` - Dev API URL
   - `NEXT_PUBLIC_API_URL` - Production API URL
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

4. **Slack Notifications** (optional)
   - `SLACK_WEBHOOK` - Slack webhook URL for deployment notifications

### 3. Connect Personal Repo to Netlify

1. Go to Netlify dashboard
2. Add new site → Import from Git
3. Select your personal repo: `yoosefashraff/company-admin-portal`
4. Configure:
   - **Branch to deploy:** `netlify`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Add environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai` (Dev API - REQUIRED for Netlify)
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here` (REQUIRED)
   - **Do NOT set `NEXT_PUBLIC_API_URL`** (not used on Netlify - only for company server)
   
   See [docs/netlify-environment-setup.md](docs/netlify-environment-setup.md) for detailed setup instructions.

## How It Works

1. **Developer pushes to geowise repo:**
   - Push to `dev` or `master` branch on `GeoWise-AI/company-admin-portal`

2. **GitHub Actions triggers:**
   - `deploy-company-server.yml` → Deploys to company server
   - `sync-netlify-branch.yml` → Syncs to `netlify` branch on personal repo

3. **Netlify auto-deploys:**
   - Detects change in `netlify` branch on personal repo
   - Automatically builds and deploys

## Manual Sync (If Needed)

If automatic sync fails, you can manually sync:

```bash
# On geowise repo
git checkout master
git pull upstream master

# Add personal repo as remote (if not already)
git remote add personal https://github.com/yoosefashraff/company-admin-portal.git

# Push to netlify branch on personal repo
git push personal master:netlify
```

## Troubleshooting

### Netlify branch not syncing
- Check GitHub Actions logs in geowise repo
- Verify `PERSONAL_REPO_TOKEN` secret is set correctly
- Ensure token has `repo` scope and access to personal repo

### Netlify deployment failing
- Check Netlify build logs
- Verify environment variables are set in Netlify dashboard
- Ensure `netlify.toml` is correct

### Company server deployment failing
- Check deployment workflow logs
- Verify server credentials/secrets
- Update deployment method in `deploy-company-server.yml`
