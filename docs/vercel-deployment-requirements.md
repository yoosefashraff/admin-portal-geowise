# Vercel Deployment Requirements

## Environment Variables

**Required for Vercel deployment:**

Set in **Vercel Dashboard → Project Settings → Environment Variables**:

- `NEXT_PUBLIC_DEV_API_URL` = `https://gw5cndev.geowise.ai` ✅ **REQUIRED**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = your key ✅

**Important:** `NEXT_PUBLIC_*` variables are embedded at **build time**. If you change them:
1. Update in Vercel dashboard
2. **Trigger a new deploy** (or wait for next Git push)

---

## Common Errors

### Error: "500 - Server Components render error"

**Cause:** Missing `NEXT_PUBLIC_DEV_API_URL` environment variable

**Fix:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add: `NEXT_PUBLIC_DEV_API_URL` = `https://gw5cndev.geowise.ai`
3. Redeploy

**Note:** The code now uses a fallback URL if env var is missing, but you should still set it properly.

---

## Deployment Checklist

- [ ] `NEXT_PUBLIC_DEV_API_URL` set in Vercel
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` set in Vercel
- [ ] Build completes successfully
- [ ] Login page loads without 500 error
- [ ] Protected pages work after login

---

## Architecture

**Vercel deployment:**
- Uses Next.js Server Components and Server Actions
- API calls go directly to backend (no Vercel proxy)
- Same architecture as Netlify

**Path:** Vercel Serverless Function → `https://gw5cndev.geowise.ai` (direct)

---

**Status:** Code updated to handle missing env vars gracefully.
