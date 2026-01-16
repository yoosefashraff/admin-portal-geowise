---
description: Branching strategy for feature development and deployment
---

# Feature Development Workflow

This workflow ensures compliance with the strict branching model: `feature/*` -> `dev` -> `master`.

## 1. Starting a New Task
Before implementing any new task, follow these steps:

1. **Switch to master**: Ensure you are starting from the stable production base.
   `git checkout master`
2. **Sync master**: Get the latest changes from both remotes.
   `git pull origin master`
   `git pull upstream master`
3. **Create feature branch**: Use a descriptive name.
   `git checkout -b feature/task-description`

## 2. Implementation & Local Verification
1. **Implement changes** in the feature branch.
2. **Verify build and types**: Never push broken code.
   `npx tsc --noEmit`
   `npm run build`
3. **Commit changes** to the feature branch.

## 3. Deployment to Dev (QA)
When the task is ready for testing:

1. **Push feature branch**:
   `git push origin feature/task-description`
2. **Sync dev**:
   `git checkout dev`
   `git pull origin dev`
3. **Merge feature into dev**:
   `git merge feature/task-description --no-edit`
4. **Push dev**: This triggers the automated Dev deployment.
   `git push origin dev`
   `git push upstream dev`
5. **Report to USER**: Inform the user that the feature is live on the Dev server.

## 4. Release to Production (Master)
Only perform this after the USER or QA has approved the changes on Dev:

1. **Switch to master**:
   `git checkout master`
2. **Merge dev into master**:
   `git merge dev --no-edit`
3. **Push master**: This triggers the automated Production deployment.
   `git push origin master`
   `git push upstream master`
4. **Delete feature branch**: Clean up.
   `git branch -d feature/task-description`
   `git push origin --delete feature/task-description`
