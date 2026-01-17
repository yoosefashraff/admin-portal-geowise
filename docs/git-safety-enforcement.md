# Git Safety Enforcement Mechanisms

This document describes the automated and manual safety checks that prevent pushing to the wrong repository.

## Automated Enforcement

### 1. Git Pre-Push Hook (`.git/hooks/pre-push`)

**What it does:**
- Automatically runs before every `git push` command
- Blocks pushes to `origin` (personal repo) for company branches
- Only allows `netlify` branch to be pushed to `origin`
- Verifies that `upstream` points to the correct GeoWise repository

**How it works:**
```bash
# This will be blocked:
git push origin feature/task  # ❌ BLOCKED

# This will be blocked:
git push origin dev  # ❌ BLOCKED

# This will be blocked:
git push origin master  # ❌ BLOCKED

# This will pass:
git push upstream feature/task  # ✅ ALLOWED
git push upstream dev  # ✅ ALLOWED
git push upstream master  # ✅ ALLOWED
```

**Installation:**
Run the setup script once after cloning:
```bash
# Unix/Mac/Git Bash
npm run setup-git-safety
# OR
bash scripts/setup-git-safety.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/setup-git-safety.ps1
```

The hook will be installed in `.git/hooks/pre-push` and will automatically run before every push.

### 2. Safety Script (`scripts/git-push-safety.sh`)

**What it does:**
- Validates remote and branch before pushing
- Provides clear error messages
- Can be used as a wrapper for git push

**Usage:**
```bash
# Instead of: git push upstream feature/task
./scripts/git-push-safety.sh upstream feature/task

# This will be blocked:
./scripts/git-push-safety.sh origin feature/task  # ❌ ERROR
```

**Installation:**
```bash
chmod +x scripts/git-push-safety.sh
```

### 3. Remote Verification Script (`scripts/verify-remotes.sh`)

**What it does:**
- Quick check to verify remotes are configured correctly
- Run this before any push operation

**Usage:**
```bash
./scripts/verify-remotes.sh
```

**Output:**
```
🔍 Verifying git remotes...

✅ upstream: https://github.com/GeoWise-AI/company-admin-portal.git
   → Use for: feature/*, dev, master, twitchers
✅ origin: https://github.com/yoosefashraff/company-admin-portal.git
   → Use for: netlify (auto-synced by GitHub Actions)
   → DO NOT push company work here!

✅ Remotes verified! Safe to push to 'upstream' for company work.
```

## Manual Verification (Required)

Even with automated checks, you should always verify before pushing:

### 1. Check Remotes
```bash
git remote -v
```

**Expected output:**
```
origin    https://github.com/yoosefashraff/company-admin-portal.git (fetch)
origin    https://github.com/yoosefashraff/company-admin-portal.git (push)
upstream  https://github.com/GeoWise-AI/company-admin-portal.git (fetch)
upstream  https://github.com/GeoWise-AI/company-admin-portal.git (push)
```

### 2. Use Explicit Remote Names

**✅ CORRECT:**
```bash
git push upstream feature/task
git push upstream dev
git push upstream master
```

**❌ WRONG:**
```bash
git push origin feature/task  # Wrong remote!
git push  # May push to wrong default!
```

### 3. Pre-Push Checklist

Before ANY push:
- [ ] Ran `git remote -v` to verify remotes
- [ ] Confirmed using `upstream` for company work
- [ ] Verified branch name matches deployment target
- [ ] Not pushing to `origin` unless explicitly backing up
- [ ] Double-checked the remote name in the command

## Agent Instructions

The AI agent (me) is instructed to:

1. **Always verify remotes** before suggesting any push command
2. **Always use explicit remote names** (`upstream` or `origin`)
3. **Never suggest** `git push` without a remote name
4. **Always check** `.git-safety-rules.md` before pushing
5. **Run verification script** if unsure about remotes

## Bypassing Safety Checks (Not Recommended)

If you absolutely need to bypass the pre-push hook (not recommended):

```bash
git push --no-verify origin <branch>  # ⚠️ DANGEROUS - Only if absolutely necessary
```

**Warning:** Only use `--no-verify` if you're 100% certain you know what you're doing. The hook exists for a reason!

## Troubleshooting

### Hook not running?
```bash
# Check if hook exists
ls -la .git/hooks/pre-push

# Make it executable
chmod +x .git/hooks/pre-push

# Test it
git push origin test-branch  # Should be blocked
```

### Remotes misconfigured?
```bash
# Check current remotes
git remote -v

# Fix upstream if wrong
git remote set-url upstream https://github.com/GeoWise-AI/company-admin-portal.git

# Fix origin if wrong
git remote set-url origin https://github.com/yoosefashraff/company-admin-portal.git
```

### Hook blocking legitimate push?
If the hook is incorrectly blocking a legitimate push:
1. Verify your remotes are correct: `git remote -v`
2. Check the branch name matches the expected pattern
3. Review `.git/hooks/pre-push` to understand why it's blocking
4. If it's a false positive, you can use `--no-verify` (but be very careful!)

## Summary

**Three layers of protection:**
1. **Pre-push hook** - Automatic blocking of wrong pushes
2. **Safety scripts** - Manual validation tools
3. **Agent instructions** - AI always verifies before suggesting pushes

**Remember:**
- Always use `upstream` for company work
- Always verify with `git remote -v` before pushing
- Never push to `origin` except for netlify (which is auto-synced)
