# Rename Netlify Branch to Main - Migration Guide

## Overview

The personal repository (`yoosefashraff/company-admin-portal`) now uses `main` as the branch name instead of `netlify`. This is simpler and more standard.

## What Changed

- **Old:** `netlify` branch on personal repo
- **New:** `main` branch on personal repo
- **Purpose:** Still used for Netlify deployment (auto-synced from geowise repo)

## Steps to Complete Migration

### 1. Set `main` as Default Branch on GitHub

1. Go to: https://github.com/yoosefashraff/company-admin-portal
2. **Settings** → **Branches**
3. Under "Default branch", change from `netlify` to `main`
4. Click **Update** and confirm

### 2. Delete `netlify` Branch (After Setting `main` as Default)

Once `main` is the default branch, you can delete `netlify`:

1. Go to: https://github.com/yoosefashraff/company-admin-portal/branches
2. Find `netlify` branch
3. Click the trash icon to delete it

**OR** via command line (after setting `main` as default):
```bash
git push origin --delete netlify
```

### 3. Update Netlify Configuration

1. Go to **Netlify Dashboard** → Your Site
2. **Site Settings** → **Build & deploy** → **Continuous Deployment**
3. Change **Production branch** from `netlify` to `main`
4. Click **Save**

### 4. Update Local Git (Optional)

If you have a local `netlify` branch:

```bash
# Fetch latest
git fetch origin

# Delete local netlify branch (if exists)
git branch -d netlify  # or -D to force

# Checkout main branch
git checkout -b main origin/main

# Set upstream tracking
git branch --set-upstream-to=origin/main main
```

## Verification

After migration, verify:

- [ ] GitHub default branch is `main`
- [ ] `netlify` branch is deleted (or can be deleted)
- [ ] Netlify production branch is set to `main`
- [ ] `origin/HEAD` points to `origin/main` (check with `git branch -r`)
- [ ] Netlify deploys successfully from `main` branch

## What Stays the Same

- Geowise repo branches (`master`, `dev`, `twitchers`) - unchanged
- GitHub Actions workflow still syncs `master`/`dev` → `main` on personal repo
- Netlify deployment process - unchanged
- All other workflows - unchanged

## Rollback (If Needed)

If you need to rollback:

1. Create `netlify` branch from `main`:
   ```bash
   git push origin main:netlify
   ```
2. Set `netlify` as default branch on GitHub
3. Update Netlify to watch `netlify` branch
