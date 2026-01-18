# Deployment Folder Structure - What to Include

## Frontend-Deploy Folder Contents

When you create the `frontend-deploy` folder, it should contain **exactly** these items:

```
frontend-deploy/
├── .next/
│   ├── standalone/          ← Entire folder (self-contained Node.js app)
│   │   ├── server.js        ← Main entry point
│   │   ├── node_modules/    ← All dependencies (included)
│   │   └── ...              ← All other files in standalone/
│   └── static/              ← Entire folder (CSS, JS bundles, images)
│       ├── chunks/          ← JavaScript bundles
│       └── ...              ← All other static assets
├── public/                  ← Entire folder (public assets)
│   ├── *.svg               ← Icon files
│   └── ...                  ← Any other public files
└── .env                     ← Environment variables file
    └── (see content below)
```

---

## Detailed Breakdown

### 1. `.next/standalone/` Folder

**What it is:** Self-contained Node.js application with all dependencies

**What to include:** The **entire** `.next/standalone/` folder as it appears after `npm run build`

**Contains:**
- `server.js` - Main application entry point
- `node_modules/` - All npm dependencies (already included, no need to run `npm install` on server)
- All other files Next.js generates

**Size:** ~50-80 MB (includes all dependencies)

**⚠️ Important:** Copy the **entire folder**, not individual files

---

### 2. `.next/static/` Folder

**What it is:** Static assets (CSS, JavaScript bundles, images)

**What to include:** The **entire** `.next/static/` folder as it appears after `npm run build`

**Contains:**
- `chunks/` - JavaScript bundles for each page
- CSS files
- Image optimizations
- Other static assets

**Size:** ~5-20 MB (depends on your app size)

**⚠️ Important:** Copy the **entire folder**, not individual files

---

### 3. `public/` Folder

**What it is:** Public assets served directly (icons, images, etc.)

**What to include:** The **entire** `public/` folder from your project root

**Contains:**
- SVG icons
- Any other files you put in the `public/` folder

**Size:** ~1-5 MB (usually small)

**⚠️ Important:** Copy the **entire folder** from your project's `public/` directory

---

### 4. `.env` File

**What it is:** Environment variables configuration

**What to include:** A single file named `.env` (no folder)

**Content:**
```
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
PORT=3000
NODE_ENV=production
```

**⚠️ Important:** 
- Replace `your_google_maps_key_here` with your actual Google Maps API key
- File must be named exactly `.env` (with the dot at the beginning)
- No file extension

---

## What NOT to Include

**❌ Don't include:**
- `node_modules/` from project root (not needed - already in `.next/standalone/node_modules/`)
- Source code files (`.tsx`, `.ts`, `.js` files from `app/`, `components/`, etc.)
- Configuration files (`next.config.js`, `package.json`, `tsconfig.json`, etc.)
- `.git/` folder
- `README.md` or documentation files
- Any other folders or files

**✅ Only include:**
- `.next/standalone/` (entire folder)
- `.next/static/` (entire folder)
- `public/` (entire folder)
- `.env` (single file)

---

## Step-by-Step: Creating the Folder

### Method 1: Manual Copy

1. **After running `npm run build`**, you'll have:
   ```
   your-project/
   ├── .next/
   │   ├── standalone/
   │   └── static/
   ├── public/
   └── ...
   ```

2. **Create a new folder** called `frontend-deploy` (anywhere on your computer)

3. **Copy these folders:**
   - Copy `.next/standalone/` → `frontend-deploy/.next/standalone/`
   - Copy `.next/static/` → `frontend-deploy/.next/static/`
   - Copy `public/` → `frontend-deploy/public/`

4. **Create `.env` file** in `frontend-deploy/` folder with the content above

5. **Result:**
   ```
   frontend-deploy/
   ├── .next/
   │   ├── standalone/
   │   └── static/
   ├── public/
   └── .env
   ```

### Method 2: Using Script (If Available)

If there's a script that does this automatically, it would:
1. Build the app
2. Create `frontend-deploy` folder
3. Copy required folders
4. Create `.env` file
5. Create ZIP file

---

## Verification Checklist

Before creating the ZIP, verify:

- [ ] `frontend-deploy/.next/standalone/server.js` exists
- [ ] `frontend-deploy/.next/standalone/node_modules/` exists (with many packages)
- [ ] `frontend-deploy/.next/static/chunks/` exists (or similar structure)
- [ ] `frontend-deploy/public/` contains your SVG icons/files
- [ ] `frontend-deploy/.env` exists with correct content
- [ ] Total size is reasonable (50-150 MB uncompressed)

---

## ZIP File Creation

**After creating the `frontend-deploy` folder:**

1. **Right-click** on the `frontend-deploy` folder
2. **Select "Send to" → "Compressed (zipped) folder"** (Windows)
   - Or use 7-Zip, WinRAR, etc.
3. **Name it:** `frontend-deploy.zip`
4. **Verify ZIP contains:**
   - `.next/` folder (with `standalone/` and `static/` inside)
   - `public/` folder
   - `.env` file

**⚠️ Important:** ZIP the **folder**, not the files inside it. The ZIP should extract to a `frontend-deploy/` folder.

---

## Summary

**Frontend-Deploy Folder Should Contain:**

1. ✅ `.next/standalone/` - Entire folder (self-contained app)
2. ✅ `.next/static/` - Entire folder (static assets)
3. ✅ `public/` - Entire folder (public files)
4. ✅ `.env` - Single file (environment variables)

**That's it!** Only these 4 items (3 folders + 1 file).
