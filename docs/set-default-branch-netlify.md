# Set Netlify Branch as Default - Quick Guide

## Problem
Netlify didn't trigger a deploy because the default branch on your personal repo is still `main`, not `netlify`. Netlify watches the default branch by default.

## Solution: Set `netlify` as Default Branch

### Option 1: GitHub Web UI (Recommended)

1. **Go to your personal repo:**
   - https://github.com/yoosefashraff/company-admin-portal

2. **Navigate to Settings:**
   - Click **Settings** tab (top right of repo page)

3. **Go to Branches:**
   - In the left sidebar, click **Branches**

4. **Change Default Branch:**
   - Under "Default branch", you'll see the current default (likely `main`)
   - Click the **switch/edit icon** (pencil icon) next to it
   - Select `netlify` from the dropdown
   - Click **Update**
   - **Confirm** the change (GitHub will warn you about changing the default branch)

5. **Verify:**
   - The default branch should now show `netlify`
   - `origin/HEAD` will point to `netlify`

### Option 2: GitHub CLI (If you have `gh` installed)

```bash
gh repo edit yoosefashraff/company-admin-portal --default-branch netlify
```

### Option 3: GitHub API (Programmatic)

```bash
curl -X PATCH \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/yoosefashraff/company-admin-portal \
  -d '{"default_branch": "netlify"}'
```

**Note:** You need a GitHub Personal Access Token with `repo` scope.

## After Setting Default Branch

### 1. Update Netlify Configuration

Once `netlify` is the default branch:

1. **Go to Netlify Dashboard:**
   - https://app.netlify.com
   - Select your site

2. **Site Settings → Build & Deploy:**
   - Go to **Build & deploy** → **Continuous Deployment**
   - Verify **Production branch** is set to `netlify` (should auto-update)
   - If not, manually set it to `netlify`

3. **Trigger Manual Deploy (Optional):**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - This will deploy from the `netlify` branch

### 2. Verify Local Git Tracking

Update your local git to track the new default:

```bash
# Fetch latest
git fetch origin

# Update local HEAD to point to netlify
git remote set-head origin netlify

# Verify
git branch -r | findstr HEAD
# Should show: origin/HEAD -> origin/netlify
```

## Verification Checklist

- [ ] Default branch on GitHub is `netlify`
- [ ] Netlify production branch is set to `netlify`
- [ ] `origin/HEAD` points to `origin/netlify` (check with `git branch -r`)
- [ ] Netlify has triggered a deploy (check Deploys tab)

## Troubleshooting

### Netlify still not deploying?

1. **Check Netlify branch setting:**
   - Netlify → Site Settings → Build & deploy → Production branch
   - Must be `netlify`

2. **Check Netlify webhook:**
   - Netlify → Site Settings → Build & deploy → Build hooks
   - Verify webhook is configured for your repo

3. **Manual trigger:**
   - Netlify → Deploys → Trigger deploy → Deploy site
   - This will force a deploy from the current branch

4. **Check Netlify logs:**
   - Netlify → Deploys → Click on latest deploy → View logs
   - Look for any errors or warnings

### Default branch change not reflected?

- Wait a few seconds for GitHub to update
- Refresh the GitHub page
- Check with: `git ls-remote --symref origin HEAD`
