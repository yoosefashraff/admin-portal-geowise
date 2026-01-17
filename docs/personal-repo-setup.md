# Personal Repo Setup - Netlify as Main Branch

## Overview

On your personal GitHub repository (`yoosefashraff/company-admin-portal`), the `netlify` branch is treated as the **main branch**. This is the primary branch for Netlify deployments.

## Setting Netlify as Default Branch

### On GitHub

1. Go to your personal repo: https://github.com/yoosefashraff/company-admin-portal
2. Click **Settings** → **Branches**
3. Under "Default branch", click the switch/edit icon
4. Select `netlify` from the dropdown
5. Click **Update** and confirm

### Local Git Configuration

To track `netlify` as your default branch locally:

```bash
# Fetch the netlify branch
git fetch origin netlify

# Checkout and track netlify branch
git checkout -b netlify origin/netlify

# Set upstream tracking
git branch --set-upstream-to=origin/netlify netlify
```

## Working with Personal Repo

When working with your personal repo:

- **Default branch:** `netlify` (not `master` or `main`)
- **Primary purpose:** Netlify deployment
- **Auto-sync:** Automatically synced from geowise repo's `master`/`dev` branches

## Manual Push to Personal Repo

If you need to manually push to the personal repo (rare cases):

```bash
# Verify you're pushing to the correct remote
git remote -v

# Push to netlify branch (main branch on personal repo)
git push origin netlify
```

**Note:** The `netlify` branch is automatically synced by GitHub Actions, so manual pushes are rarely needed.

## Netlify Configuration

Netlify should be configured to:
- **Repository:** `yoosefashraff/company-admin-portal`
- **Branch:** `netlify` (default/main branch)
- **Build command:** `npm run build`
- **Publish directory:** `.next`

## Branch Structure

```
Personal Repo (origin)
├── netlify (main branch) ← Default branch, Netlify deployment
└── (other branches if any)

Geowise Repo (upstream)
├── master (main branch) → Production
├── dev → Dev server
├── twitchers → Twitchers server
└── feature/* → Feature branches
```

## Important Notes

1. **Never push company work to personal repo** - Always use `upstream` for company work
2. **Netlify branch is auto-synced** - GitHub Actions handles syncing from geowise repo
3. **Netlify is the main branch** - Treat it as the primary branch on personal repo
4. **Default branch setting** - Ensure GitHub is configured to use `netlify` as default
