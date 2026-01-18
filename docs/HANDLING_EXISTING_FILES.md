# Handling Existing Files When Deploying

## The Situation

When you copy `.next/` to the root directory, there's already an existing `.next/` folder there. What should you do?

---

## Recommended Approach: Replace the Old One

**Best practice:** Delete the old `.next/` folder first, then copy the new one.

### Why?

1. **Clean deployment** - Ensures no old/conflicting files remain
2. **Avoids conflicts** - Old build files might cause issues
3. **Fresh start** - New build replaces everything

---

## Step-by-Step: Replace Existing `.next/` Folder

### Option 1: Delete First, Then Copy (Recommended)

1. **Delete the old `.next/` folder:**
   - Find `.next` in the "Files & Directories" list
   - Click the red **"Delete"** button next to it
   - Confirm deletion

2. **Copy the new `.next/` folder:**
   - Navigate to `frontend-deploy/` folder (where your new files are)
   - Find `.next` folder
   - Click **"Copy"** button
   - Navigate back to root
   - Paste/copy it to root

### Option 2: Rename Old One (Backup), Then Copy New

1. **Rename the old `.next/` folder:**
   - Find `.next` in root
   - Click **"Rename"** button
   - Rename to: `.next.old` or `.next.backup-2026-01-18`
   - This keeps it as backup

2. **Copy the new `.next/` folder:**
   - Navigate to `frontend-deploy/` folder
   - Copy `.next` folder
   - Paste to root

3. **Delete backup later** (after verifying new one works):
   - Delete `.next.old` or `.next.backup-2026-01-18`

---

## What About Other Files?

### `.next/` Folder
- ✅ **Replace it** - Delete old, copy new (or rename old first)

### `public/` Folder
- ✅ **Replace it** - Delete old, copy new (or rename old first)
- ⚠️ **Or merge** - If you have custom files in old `public/`, copy those manually first

### `.env` File
- ✅ **Replace it** - Delete old, copy new
- ⚠️ **Or edit** - If old `.env` has important values, copy those values to new `.env` first

---

## Complete Deployment Process

### Step 1: Backup Old Files (Optional but Recommended)

1. **Rename existing folders:**
   - `.next` → `.next.old`
   - `public` → `public.old`
   - `.env` → `.env.old`

2. **This keeps backups** in case something goes wrong

### Step 2: Copy New Files

1. **Navigate to `frontend-deploy/` folder**

2. **Copy each folder/file:**
   - Copy `.next/` → Paste to root
   - Copy `public/` → Paste to root
   - Copy `.env` → Paste to root

### Step 3: Verify New Files Work

1. **Test the application** (backend developer should do this)

2. **If everything works:**
   - Delete backup folders: `.next.old`, `public.old`, `.env.old`

3. **If something breaks:**
   - Delete new folders
   - Rename backups back: `.next.old` → `.next`

---

## Quick Decision Guide

**Question: Should I delete or rename the old `.next/` folder?**

### Delete if:
- ✅ You're confident the new build is correct
- ✅ You want a clean deployment
- ✅ Old build is outdated/not working

### Rename (backup) if:
- ✅ You want to keep a backup "just in case"
- ✅ You're not 100% sure the new build works
- ✅ You want to be able to rollback quickly

---

## Recommended Action Plan

**For a clean deployment:**

1. **Delete old `.next/` folder** (click "Delete" button)
2. **Delete old `public/` folder** (if you're replacing it)
3. **Delete old `.env` file** (if you're replacing it)
4. **Copy new `.next/` folder** from `frontend-deploy/` to root
5. **Copy new `public/` folder** from `frontend-deploy/` to root
6. **Copy new `.env` file** from `frontend-deploy/` to root

**Result:** Clean, fresh deployment with no old files.

---

## Important Notes

### ⚠️ Don't Merge Folders

**Don't try to merge** `.next/` folders:
- Old `.next/` might have different structure
- Mixing old and new can cause conflicts
- Always replace entirely

### ✅ Do Replace Entirely

**Always replace** the entire folder:
- Delete old → Copy new
- Or rename old → Copy new → Delete old later

### 🔄 Same for `public/`

**Same approach for `public/`:**
- Replace entirely (unless you have custom files)
- If you have custom files in old `public/`, copy those to new `public/` first, then replace

---

## Summary

**When copying `.next/` to root and one already exists:**

1. **Delete the old one first** (recommended)
   - Click "Delete" on existing `.next/`
   - Then copy new `.next/` to root

2. **Or rename old one** (backup approach)
   - Rename existing `.next/` to `.next.old`
   - Copy new `.next/` to root
   - Delete `.next.old` after verifying new one works

**Never try to merge or keep both** - always replace entirely.
