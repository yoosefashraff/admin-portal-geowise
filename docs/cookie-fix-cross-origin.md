# Cookie Fix for Cross-Origin Requests (Netlify → Backend)

## Problem

The scheduler page on Netlify was not loading data because authentication cookies were not being sent to the backend API.

**Root Cause:** Cookie settings were blocking cross-origin cookie transmission.

---

## Issue Details

### Original Cookie Settings

```typescript
// lib/actions/auth.actions.ts
cookieStore.set({
  name: "xyzCompAuthorize",
  sameSite: "lax",  // ❌ Blocks cross-origin requests
  secure: false,    // ❌ Required to be true with sameSite="none"
});
```

```typescript
// lib/store/authStore.ts
document.cookie = `xyzCompAuthorize=${cookie}; SameSite=Lax`;  // ❌ Blocks cross-origin
```

### Why It Failed

1. **Cross-Origin Request:**
   - Frontend: `https://geowise-admin-portal.netlify.app`
   - Backend: `https://gw5cndev.geowise.ai`
   - Different origins = cross-origin request

2. **`sameSite: "lax"` Behavior:**
   - Cookies with `SameSite=Lax` are **NOT sent** on cross-origin requests
   - They're only sent on same-site requests (same domain)
   - This blocked the cookie from being sent to the backend

3. **Result:**
   - API calls to backend had no authentication cookie
   - Backend redirected to login page
   - Services/data didn't load

---

## Solution

### Updated Cookie Settings

```typescript
// lib/actions/auth.actions.ts
cookieStore.set({
  name: "xyzCompAuthorize",
  sameSite: "none", // ✅ Allows cross-origin requests
  secure: true,     // ✅ Required when sameSite is "none" on HTTPS
});
```

```typescript
// lib/store/authStore.ts
document.cookie = `xyzCompAuthorize=${cookie}; SameSite=None; Secure`;  // ✅ Allows cross-origin
```

### Why This Works

1. **`sameSite: "none"`:**
   - Allows cookies to be sent on cross-origin requests
   - Required for Netlify → backend communication

2. **`secure: true`:**
   - Required when using `sameSite: "none"`
   - Ensures cookie is only sent over HTTPS (security requirement)
   - Both Netlify and backend use HTTPS, so this is safe

3. **Result:**
   - Cookie is sent with API requests to backend
   - Backend receives authentication cookie
   - Services/data load successfully

---

## Files Changed

1. **`lib/actions/auth.actions.ts`** - Server-side cookie setting
2. **`lib/store/authStore.ts`** - Client-side cookie setting (2 places)

---

## Testing

After this fix:

1. **User must log out and log back in** to get new cookie with correct settings
2. **Verify cookie in browser:**
   - DevTools → Application → Cookies
   - Check `xyzCompAuthorize` cookie
   - Should have: `SameSite=None; Secure`

3. **Verify API calls:**
   - DevTools → Network tab
   - Check `getservices` request
   - Request Headers should include: `Cookie: xyzCompAuthorize=...`

4. **Verify services load:**
   - Visit: `https://geowise-admin-portal.netlify.app/scheduler/select-service`
   - Services should load without redirecting to login

---

## Important Notes

### CORS Configuration Required

For `SameSite=None; Secure` cookies to work, the backend **must** return:

```
Access-Control-Allow-Origin: https://geowise-admin-portal.netlify.app
Access-Control-Allow-Credentials: true
```

**User confirmed:** Backend developer has already configured CORS.

### Local Development

For local development (localhost → backend), `SameSite=Lax` works fine because:
- Local dev uses Next.js proxy (`/api` route)
- Proxy makes same-origin requests
- No cross-origin issue

But for Netlify (cross-origin), we need `SameSite=None; Secure`.

---

## Summary

✅ **Fixed:** Cookie settings updated to allow cross-origin requests
✅ **Required:** User must log out and log back in to get new cookie
✅ **Verified:** No TypeScript errors
✅ **Next:** Deploy to Netlify and test
