# Localhost vs Netlify - Cookie Behavior Difference

## Key Finding

**Localhost works, Netlify doesn't** - The difference is in how API calls are made and cookie requirements.

---

## Architecture Comparison

### Localhost (Working ✅)

```
Browser → http://localhost:3000/api/company/getservices
    ↓
Next.js Proxy (app/api/[...path]/route.ts)
    ↓
Backend: https://gw5cndev.geowise.ai/company/getservices
```

**Characteristics:**
- Browser sees: `localhost:3000/api/*` (same-origin)
- Next.js proxy handles CORS
- Cookie works with: `SameSite=Lax` (same-origin request)
- No `Secure` flag needed (HTTP on localhost)

### Netlify (Not Working ❌)

```
Browser → https://gw5cndev.geowise.ai/company/getservices
    ↓
Direct call (no proxy)
```

**Characteristics:**
- Browser sees: `gw5cndev.geowise.ai` (different origin = cross-origin)
- No proxy - direct cross-origin request
- Cookie requires: `SameSite=None; Secure` (cross-origin request)
- `Secure` flag required (HTTPS page)

---

## The Problem

On Netlify, the cookie was being set but **without the `Secure` flag**, which means:
- Browser blocks `SameSite=None` cookies without `Secure`
- Cookie is not sent with cross-origin requests
- Backend redirects to login (no auth cookie)

---

## The Solution

Updated cookie setting logic to:

1. **Detect environment:**
   - Netlify (HTTPS + cross-origin): Use `SameSite=None; Secure`
   - Localhost (HTTP + same-origin via proxy): Use `SameSite=Lax`

2. **Delete old cookie first:**
   - Browsers don't allow changing cookie attributes
   - Must delete and recreate with new attributes

3. **Set cookie with correct attributes:**
   ```javascript
   // On Netlify
   document.cookie = `xyzCompAuthorize=${token}; path=/; max-age=${maxAge}; SameSite=None; Secure`;
   
   // On Localhost
   document.cookie = `xyzCompAuthorize=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
   ```

---

## Code Changes

**File:** `lib/store/authStore.ts`

- Added environment detection (`isNetlify`, `isHttps`)
- Conditional cookie attributes based on environment
- Improved cookie deletion before setting new one
- Added logging for Netlify to help debug

---

## Testing

After deploy:

1. **Clear all cookies** on Netlify:
   - DevTools → Application → Cookies → Delete all

2. **Log in again:**
   - Credentials: `5CN` / `Temporarypwd`

3. **Verify cookie:**
   - DevTools → Application → Cookies → `xyzCompAuthorize`
   - Should show: `Secure: ✓` (checked)
   - Should show: `SameSite: None`

4. **Test scheduler page:**
   - Services should load without redirecting to login

---

## Why Localhost Works

Localhost uses Next.js proxy (`/api` route), which makes the request appear as same-origin to the browser:
- Browser → `localhost:3000/api/*` (same origin)
- Cookie with `SameSite=Lax` works fine
- No cross-origin issue

Netlify makes direct cross-origin requests:
- Browser → `gw5cndev.geowise.ai` (different origin)
- Requires `SameSite=None; Secure`
- Cookie must have `Secure` flag

---

## Summary

✅ **Localhost:** Same-origin via proxy → `SameSite=Lax` works
❌ **Netlify:** Cross-origin direct → Needs `SameSite=None; Secure` (was missing `Secure` flag)

**Fix:** Environment-aware cookie setting that uses correct attributes for each environment.
