# Netlify Cookie Issue - Backend Set-Cookie Requirement

## The Real Problem

**Cookies set via JavaScript (`document.cookie`) cannot be sent cross-origin to a different domain.**

- Frontend: `geowise-admin-portal.netlify.app`
- Backend: `gw5cndev.geowise.ai`
- **Different domains = cookies set on Netlify won't be sent to backend**

## Why It's Not Working

1. **Cookie Domain Mismatch:**
   - Cookie set on `netlify.app` domain
   - Requests go to `geowise.ai` domain
   - Browser won't send cookies from different domain

2. **JavaScript Limitation:**
   - `document.cookie` can only set cookies for current domain
   - Cannot set cookies for `geowise.ai` from `netlify.app`

## The Solution

**Backend MUST set the cookie via `Set-Cookie` header with correct domain:**

```
Set-Cookie: xyzCompAuthorize=<token>; Domain=.geowise.ai; Path=/; SameSite=None; Secure; HttpOnly=false; Max-Age=2592000
```

### Why This Works

1. **Backend sets cookie:**
   - `Domain=.geowise.ai` → Cookie stored for `geowise.ai` domain
   - Browser sends it with all requests to `geowise.ai`

2. **Direct browser request:**
   - Login request goes directly from browser to backend
   - Backend responds with `Set-Cookie` header
   - Browser accepts and stores cookie

3. **Subsequent requests:**
   - All API calls to `geowise.ai` include the cookie
   - Authentication works ✅

## Code Changes

**File:** `lib/store/authStore.ts`

- On Netlify: Make direct `fetch()` request to backend (not Server Action)
- Backend sets cookie via `Set-Cookie` header
- Browser stores cookie with `Domain=.geowise.ai`

## Backend Requirements

**The backend MUST:**

1. **Set cookie in login response:**
   ```http
   Set-Cookie: xyzCompAuthorize=<token>; Domain=.geowise.ai; Path=/; SameSite=None; Secure; HttpOnly=false; Max-Age=2592000
   ```

2. **CORS configuration:**
   ```http
   Access-Control-Allow-Origin: https://geowise-admin-portal.netlify.app
   Access-Control-Allow-Credentials: true
   Access-Control-Allow-Headers: Content-Type, Accept
   ```

3. **Accept credentials:**
   - Must allow `credentials: 'include'` in CORS
   - Must accept cookies in requests

## Testing

After deploy:

1. **Clear all cookies** on Netlify
2. **Log in** - check Network tab:
   - Login request should show `Set-Cookie` header in response
   - Cookie should have `Domain=.geowise.ai`
3. **Check DevTools → Application → Cookies:**
   - Should see cookie for `geowise.ai` domain (not `netlify.app`)
4. **Test scheduler page:**
   - API request should include cookie
   - Services should load ✅

## If Still Not Working

Check backend:

1. **Is backend setting `Set-Cookie` header?**
   - Check Network tab → Login request → Response Headers
   - Should see `Set-Cookie: xyzCompAuthorize=...`

2. **Is cookie domain correct?**
   - Should be `Domain=.geowise.ai` (note the leading dot)
   - Not `Domain=geowise-admin-portal.netlify.app`

3. **Is CORS configured correctly?**
   - Must allow `Access-Control-Allow-Credentials: true`
   - Must allow origin: `https://geowise-admin-portal.netlify.app`

4. **Is `SameSite=None; Secure` set?**
   - Required for cross-origin cookies
   - `Secure` required on HTTPS

---

**Status:** Code updated to make direct browser request. Backend must set cookie with correct domain.
