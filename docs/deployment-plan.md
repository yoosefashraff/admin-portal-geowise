# Implementation Plan - Dual-Repo Deployment Strategy

## Goals
1. Establish branching model: `feature/*` -> `dev` -> `master` -> `twitchers` (optional)
2. Deploy geowise repo branches (`master`, `dev`, `twitchers`) to company servers
3. Auto-sync `netlify` branch to personal repo for Netlify deployment
4. Integrate Slack notifications for deployment status
5. Update agent workflows to enforce this strategy

## Repository Structure

### Geowise Repo (upstream)
- `master` → Production company server
- `dev` → Dev company server
- `twitchers` → Twitchers company server
- `feature/*` → Feature branches

### Personal Repo (origin)
- `netlify` → Netlify deployment (auto-synced from geowise)

## Implementation Status

### ✅ Completed
- [x] CI workflow for build & type checking
- [x] Feature development workflow documentation
- [x] Netlify branch sync workflow
- [x] Company server deployment workflow (placeholder)
- [x] Dual-repo deployment strategy documentation

### 🔄 In Progress / TODO
- [ ] Configure actual company server deployment method (SSH/API/Docker)
- [ ] Set up GitHub secrets for company servers
- [ ] Configure `PERSONAL_REPO_TOKEN` for netlify branch sync
- [ ] Test deployment to dev company server
- [ ] Test deployment to production company server
- [ ] Configure Slack webhook for notifications
- [ ] Verify Netlify auto-deployment from personal repo

## 1. Branch Setup
- [x] `master` branch exists (production)
- [ ] `dev` branch exists and synced with `master`
- [ ] `twitchers` branch exists (if needed)
- [ ] `netlify` branch exists on personal repo

## 2. CI/CD Infrastructure
- [x] `.github/workflows/ci.yml` - Build & type check
- [x] `.github/workflows/deploy-company-server.yml` - Company server deployment
- [x] `.github/workflows/sync-netlify-branch.yml` - Netlify branch sync
- [ ] Configure actual deployment method in `deploy-company-server.yml`

## 3. GitHub Secrets Required
- [ ] `COMPANY_PRODUCTION_SERVER` - Production server credentials
- [ ] `COMPANY_DEV_SERVER` - Dev server credentials
- [ ] `COMPANY_TWITCHERS_SERVER` - Twitchers server credentials (if needed)
- [ ] `PERSONAL_REPO_TOKEN` - GitHub token for personal repo access
- [ ] `SLACK_WEBHOOK` - Slack notifications (optional)

## 4. Netlify Configuration
- [ ] Connect personal repo to Netlify
- [ ] Set deploy branch: `netlify`
- [ ] Configure environment variables in Netlify dashboard
- [ ] Verify auto-deployment works

## Risks
- Incorrect branch naming causing CI/CD triggers to fail
- Environment variables differences between Dev/Prod/Twitchers
- Personal repo token expiration
- Company server deployment method needs to be configured

## Verification Steps
- [ ] Push to `dev` and verify company dev server deployment
- [ ] Push to `master` and verify:
  - [ ] Production company server deployment
  - [ ] Netlify branch sync to personal repo
  - [ ] Netlify auto-deployment triggers
- [ ] Verify TypeScript and Build pass in CI runner
- [ ] Test Slack notifications (when configured)
