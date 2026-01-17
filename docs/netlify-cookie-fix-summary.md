# Netlify Cookie Fix - Summary

## Problem

Scheduler page on Netlify not loading services, while localhost works fine.

## Root Cause

**Cookie not being sent with cross-origin requests on Netlify:**
- Cookie was set without `Secure` flag
- Browser blocks `SameSite=None` cookies without `Secure`
- API calls redirected to login (no auth cookie)

## Why Localhost Works

**Localhost uses Next.js proxy:**
- Browser → `localhost:3000/api/*` (same-origin)
- Cookie works with `SameSite=Lax`
- No cross-origin issue

**Netlify uses direct backend calls:**
- Browser → `gw5cndev.geowise.ai` (cross-origin)
- Requires `SameSite=None; Secure`
- Cookie was missing `Secure` flag

## Fix Applied

1. **Environment detection:**
   - Detects Netlify (HTTPS + cross-origin)
   - Detects localhost (HTTP + same-origin via proxy)

2. **Conditional cookie attributes:**
   - **Netlify:** `SameSite=None; Secure`
   - **Localhost:** `SameSite=Lax`

3. **Delete old cookie first:**
   - Browsers don't allow changing cookie attributes
   - Must delete and recreate

4. **Improved logging:**
   - Logs cookie setting on Netlify for debugging

## Files Changed

- `lib/store/authStore.ts` - Client-side cookie setting (login + restore)
- `lib/actions/auth.actions.ts` - Server-side cookie setting (improved deletion)
- `lib/api/axios-instance.ts` - Manual Cookie header fallback

## Next Steps

1. Wait for Netlify deploy to complete
2. Clear all cookies on Netlify
3. Log in again
4. Verify cookie has `Secure: ✓` in DevTools
5. Test scheduler page - services should load

---

**Status:** Code pushed to GitHub, Netlify deploy should trigger automatically.
