---
description: Branching strategy for feature development and deployment
---

# Feature Development Workflow

This workflow ensures compliance with the strict branching model: `feature/*` -> `dev` -> `master`.

## ⚠️ CRITICAL: Repository Safety Rules

**NEVER PUSH TO THE WRONG REPOSITORY!**

### Repository Mapping
- **`upstream`** = `GeoWise-AI/company-admin-portal` → **Company server deployments** (master/dev/twitchers)
- **`origin`** = `yoosefashraff/company-admin-portal` → **Netlify deployments** (netlify branch only)

### Safety Rules (MANDATORY)
1. **ALWAYS push feature branches to `upstream`** (GeoWise repo), NEVER to `origin` (personal repo)
2. **ALWAYS push `dev`, `master`, `twitchers` to `upstream`** only
3. **NEVER push to `origin`** except:
   - The automated GitHub Actions workflow handles `netlify` branch sync
   - Manual backup pushes (optional, clearly marked)
4. **Before ANY push, verify the remote:**
   ```bash
   git remote -v  # Check which remote you're about to push to
   ```
5. **Use explicit remote names in commands:**
   - ✅ `git push upstream feature/task` (CORRECT)
   - ❌ `git push origin feature/task` (WRONG - will push to personal repo!)
   - ❌ `git push` (WRONG - may push to wrong default remote!)

### Verification Checklist Before Pushing
- [ ] Ran `git remote -v` to confirm remotes
- [ ] Using `upstream` for company work (feature/dev/master/twitchers)
- [ ] Not pushing to `origin` unless explicitly for netlify backup
- [ ] Branch name matches intended deployment target

## 1. Starting a New Task
Before implementing any new task, follow these steps:

1. **Switch to master**: Ensure you are starting from the stable production base.
   `git checkout master`
2. **Sync master**: Get the latest changes from geowise repo (upstream).
   `git pull upstream master`
   `git pull origin master` (optional - for backup)
3. **Create feature branch**: Use a descriptive name.
   `git checkout -b feature/task-description`

## 2. Implementation & Local Verification
1. **Implement changes** in the feature branch.
2. **Verify build and types**: Never push broken code.
   `npx tsc --noEmit`
   `npm run build`
3. **Commit changes** to the feature branch.
4. **MANDATORY: Verify remote before pushing:**
   ```bash
   git remote -v  # MUST run this before ANY push
   ```
   **Expected output:**
   ```
   origin    https://github.com/yoosefashraff/company-admin-portal.git
   upstream  https://github.com/GeoWise-AI/company-admin-portal.git
   ```

## 3. Deployment to Dev (QA)
When the task is ready for testing:

1. **MANDATORY: Verify remote first:**
   ```bash
   git remote -v  # Confirm upstream points to GeoWise-AI/company-admin-portal
   ```
2. **Push feature branch to UPSTREAM (GeoWise repo)**:
   `git push upstream feature/task-description`
   ⚠️ **NEVER use `origin` here - that's your personal repo!**
   ⚠️ **If pre-push hook blocks you, you're pushing to the wrong remote!**
2. **Sync dev from UPSTREAM**:
   `git checkout dev`
   `git pull upstream dev`
3. **Merge feature into dev**:
   `git merge feature/task-description --no-edit`
4. **Push dev to UPSTREAM**: This triggers the automated Dev deployment.
   `git push upstream dev`
   ⚠️ **ONLY push to `upstream` - GitHub Actions will auto-sync to netlify branch**
5. **Report to USER**: Inform the user that the feature is live on the Dev server.

## 4. Release to Production (Master)
Only perform this after the USER or QA has approved the changes on Dev:

1. **Switch to master**:
   `git checkout master`
2. **Sync master**:
   `git pull upstream master`
3. **Merge dev into master**:
   `git merge dev --no-edit`
4. **Push master to UPSTREAM**: This triggers the automated Production deployment to company server AND auto-syncs to Netlify branch.
   `git push upstream master`
   ⚠️ **ONLY push to `upstream` - GitHub Actions handles netlify sync automatically**
   ⚠️ **DO NOT push to `origin` unless explicitly backing up (rarely needed)**
5. **Delete feature branch**: Clean up.
   `git branch -d feature/task-description`
   `git push upstream --delete feature/task-description`

## 5. Deploy to Twitchers (Optional)
If the feature needs to go to the twitchers environment:

1. **Switch to twitchers**:
   `git checkout twitchers`
2. **Sync twitchers**:
   `git pull upstream twitchers`
3. **Merge master into twitchers**:
   `git merge master --no-edit`
4. **Push twitchers**: This triggers deployment to twitchers server.
   `git push upstream twitchers`

## 6. Netlify Branch (Automatic)
The `netlify` branch on your personal repo (origin) is automatically synced via GitHub Actions:
- When `master` is pushed → syncs to `netlify` branch on personal repo
- When `dev` is pushed → syncs to `netlify` branch on personal repo
- Netlify will automatically deploy from the `netlify` branch on your personal repo
