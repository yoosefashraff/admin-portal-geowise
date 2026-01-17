# Deployment Guide - Dual Repository Strategy

## Quick Reference

### Branch Structure

**Geowise Repo (`GeoWise-AI/company-admin-portal`):**
- `master` → Production company server
- `dev` → Dev company server
- `twitchers` → Twitchers company server
- `feature/*` → Feature branches

**Personal Repo (`yoosefashraff/company-admin-portal`):**
- `main` → **Main branch** for Netlify deployment (auto-synced from geowise repo)

### Deployment Flow

```
feature/task → dev → master → main (auto) → twitchers (optional)
     ↓           ↓       ↓        ↓                ↓
  Local      Company  Company  Netlify        Company
           Dev Server  Prod   (Personal)    Twitchers
```

## Workflows

### 1. Feature Development
```bash
# Start from master
git checkout master
git pull upstream master

# Create feature branch
git checkout -b feature/task-description

# Make changes, commit, push
git push upstream feature/task-description
```

### 2. Deploy to Dev
```bash
# Merge feature to dev
git checkout dev
git pull upstream dev
git merge feature/task-description --no-edit
git push upstream dev

# This triggers:
# - Deploy to Dev Company Server
# - Sync to main branch (personal repo)
```

### 3. Deploy to Production
```bash
# After QA approval, merge to master
git checkout master
git pull upstream master
git merge dev --no-edit
git push upstream master

# This triggers:
# - Deploy to Production Company Server
# - Sync to netlify branch (personal repo)
# - Netlify auto-deploys from personal repo
```

### 4. Deploy to Twitchers (Optional)
```bash
# If needed for twitchers environment
git checkout twitchers
git pull upstream twitchers
git merge master --no-edit
git push upstream twitchers

# This triggers:
# - Deploy to Twitchers Company Server
```

## GitHub Actions

All workflows are in `.github/workflows/`:

- **`ci.yml`** - Build & type check on all branches
- **`deploy-company-server.yml`** - Deploy to company servers (master/dev/twitchers)
- **`sync-netlify-branch.yml`** - Auto-sync to main branch on personal repo

## Required Setup

See [docs/setup-netlify-branch.md](docs/setup-netlify-branch.md) for detailed setup instructions.

## Documentation

- [Dual-Repo Deployment Strategy](docs/dual-repo-deployment-strategy.md) - Full strategy overview
- [Setup Netlify Branch](docs/setup-netlify-branch.md) - Netlify branch setup guide
- [Feature Development Workflow](.agent/workflows/feature-development.md) - Detailed workflow steps
