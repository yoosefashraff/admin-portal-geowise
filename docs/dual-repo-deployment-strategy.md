# Dual-Repo Deployment Strategy

## Overview

This project uses a **dual-repository deployment strategy**:
- **Geowise Repo (upstream)**: Company server deployments
- **Personal Repo (origin)**: Netlify deployments

## Repository Structure

### Geowise Repository (`GeoWise-AI/company-admin-portal`)
**Branches:**
- `master` → Production company server
- `dev` → Dev company server  
- `twitchers` → Twitchers company server
- `feature/*` → Feature development branches

**Deployment:** Automated via GitHub Actions to company servers

### Personal Repository (`yoosefashraff/company-admin-portal`)
**Branches:**
- `netlify` → Netlify deployment (auto-synced from geowise repo)

**Deployment:** Netlify automatically deploys from `netlify` branch

## Branch Flow

```
feature/task-description
    ↓ (merge when complete)
dev (Geowise) → Deploy to Dev Company Server
    ↓ (merge after QA approval)
master (Geowise) → Deploy to Production Company Server
    ↓ (auto-sync via GitHub Actions)
netlify (Personal Repo) → Deploy to Netlify
    ↓ (optional, if needed)
twitchers (Geowise) → Deploy to Twitchers Company Server
```

## GitHub Actions Workflows

### 1. CI - Build & Type Check (`.github/workflows/ci.yml`)
- **Triggers:** Push/PR to `master`, `dev`, `twitchers`, `netlify`
- **Actions:** Type check, build verification
- **Location:** Geowise repo

### 2. Deploy to Company Server (`.github/workflows/deploy-company-server.yml`)
- **Triggers:** Push to `master`, `dev`, `twitchers`
- **Actions:** Build, deploy to appropriate company server
- **Location:** Geowise repo
- **Note:** Configure deployment method (SSH, API, Docker, etc.) based on your company server setup

### 3. Sync Netlify Branch (`.github/workflows/sync-netlify-branch.yml`)
- **Triggers:** Push to `master` or `dev`
- **Actions:** Syncs changes to `netlify` branch on personal repo
- **Location:** Geowise repo
- **Requires:** `PERSONAL_REPO_TOKEN` secret (GitHub token with access to personal repo)

## Required GitHub Secrets

### Geowise Repo Secrets
- `NEXT_PUBLIC_DEV_API_URL` - Dev API URL
- `NEXT_PUBLIC_API_URL` - Production API URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `COMPANY_PRODUCTION_SERVER` - Production server endpoint/credentials
- `COMPANY_DEV_SERVER` - Dev server endpoint/credentials
- `COMPANY_TWITCHERS_SERVER` - Twitchers server endpoint/credentials
- `PERSONAL_REPO_TOKEN` - GitHub token for accessing personal repo
- `SLACK_WEBHOOK` - (Optional) Slack webhook for notifications

### Personal Repo (Netlify)
- Netlify will use its own environment variables configured in Netlify dashboard
- The `netlify` branch is automatically synced, so no manual intervention needed

## Setup Instructions

### 1. Configure Geowise Repo Workflows
1. Add required secrets in Geowise repo Settings → Secrets
2. Update `deploy-company-server.yml` with actual deployment method
3. Test by pushing to `dev` branch

### 2. Configure Personal Repo for Netlify
1. Connect personal repo to Netlify
2. Set branch to deploy: `netlify`
3. Configure environment variables in Netlify dashboard
4. The `netlify` branch will be auto-synced from geowise repo

### 3. Initial Branch Setup
```bash
# On geowise repo
git checkout master
git pull upstream master

# Create dev branch if it doesn't exist
git checkout -b dev
git push upstream dev

# Create twitchers branch if needed
git checkout -b twitchers
git push upstream twitchers

# On personal repo - create netlify branch
git checkout -b netlify
git push origin netlify
```

## Deployment Process

### Feature Development
1. Create feature branch from `master`: `feature/task-description`
2. Develop and test locally
3. Push feature branch to geowise repo
4. Merge to `dev` → Auto-deploys to Dev Company Server
5. After QA approval, merge to `master` → Auto-deploys to Production Company Server + syncs to Netlify

### Netlify Deployment
- **Automatic:** When `master` or `dev` is pushed to geowise repo, GitHub Actions syncs to `netlify` branch on personal repo
- **Netlify:** Automatically detects changes and deploys
- **No manual steps required**

## Benefits

1. **Separation of Concerns:** Company server deployments separate from Netlify
2. **Automated Sync:** Netlify branch stays in sync without manual intervention
3. **Flexible Deployment:** Different deployment methods for company server vs Netlify
4. **Backup:** Personal repo serves as backup of production code
5. **Independent Scaling:** Company server and Netlify can have different configurations

## Troubleshooting

### Netlify branch not syncing
- Check `PERSONAL_REPO_TOKEN` secret is set correctly
- Verify token has write access to personal repo
- Check GitHub Actions logs for sync workflow

### Company server deployment failing
- Verify server credentials/secrets are correct
- Update deployment method in `deploy-company-server.yml`
- Check server accessibility from GitHub Actions runner

### Branch conflicts
- Always sync branches before merging
- Use `--no-edit` flag when merging to avoid merge commit messages
- Resolve conflicts manually if they occur
