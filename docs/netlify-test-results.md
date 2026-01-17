# Netlify Scheduler Page Test Results

## ✅ Test Date: Current
## ✅ Test URL: https://geowise-admin-portal.netlify.app/scheduler/select-service

---

## ✅ Confirmed: Direct Backend API Calls (No Netlify Proxy)

### Network Request Evidence

From browser automation testing, I can see:

```
[GET] https://gw5cndev.geowise.ai/company/getservices?companyadminId=60438
```

**This confirms:**
- ✅ API calls go **directly** from browser → `https://gw5cndev.geowise.ai`
- ✅ **No Netlify proxy** - no `/api` route, no Netlify Functions for proxying
- ✅ **No Netlify overhead** - direct HTTP call to backend

---

## Architecture Verification

### Client-Side API Calls (Browser → Backend)

**File:** `lib/api/axios-instance.ts`

```typescript
const axiosInstance = axios.create({
  baseURL: 'https://gw5cndev.geowise.ai',  // Direct backend URL
  withCredentials: true,  // Sends cookies for CORS
  timeout: 60000
});
```

**On Netlify:**
- `getClientApiUrl()` returns: `https://gw5cndev.geowise.ai`
- **No proxy** - direct axios call
- **CORS enabled** - `withCredentials: true` sends cookies

**Path:** Browser → `https://gw5cndev.geowise.ai` (direct, no Netlify in between)

---

### Server-Side API Calls (Netlify Serverless → Backend)

**File:** `lib/actions/serviceRequests.actions.ts` (Server Actions)

```typescript
const serviceRequestsAPI = await createServiceRequestsAxios();
// baseURL = https://gw5cndev.geowise.ai
const response = await serviceRequestsAPI.post('/api/barber/FetchBookings', ...);
```

**Path:** Netlify Serverless Function → `https://gw5cndev.geowise.ai` (direct HTTP call)

---

## Current Issue: Authentication Redirect

### Observed Behavior

1. **Page loads successfully** ✅
2. **API call made:** `GET https://gw5cndev.geowise.ai/company/getservices?companyadminId=60438`
3. **Backend redirects to login:** `GET https://gw5cndev.geowise.ai/company/login?returnUrl=...`

### Root Cause

The API call is being redirected to login, which means:
- Cookie (`xyzCompAuthorize`) may not be sent (CORS issue)
- Cookie may be expired/invalid
- Cookie domain/path may not match

### CORS Configuration

**User confirmed:** Backend developer has already set CORS to allow Netlify.

**Required CORS headers on backend:**
```
Access-Control-Allow-Origin: https://geowise-admin-portal.netlify.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Cookie
```

**Frontend configuration:**
- ✅ `withCredentials: true` - sends cookies with requests
- ✅ Direct API URL - `https://gw5cndev.geowise.ai`

---

## Verification Checklist

### ✅ Direct Backend Calls Confirmed

- [x] Client-side calls: Browser → `https://gw5cndev.geowise.ai` (direct)
- [x] Server-side calls: Netlify Serverless → `https://gw5cndev.geowise.ai` (direct)
- [x] No Netlify proxy (`/api` route only used in local dev)
- [x] No Netlify Edge Functions for API routing
- [x] No `_redirects` file for API proxying

### ⚠️ Authentication Issue

- [ ] Cookie being sent with requests (check Network tab → Request Headers)
- [ ] Cookie is valid (not expired)
- [ ] CORS allows credentials (backend must return `Access-Control-Allow-Credentials: true`)

---

## Next Steps

1. **Verify cookie is being sent:**
   - Open browser DevTools → Network tab
   - Find `getservices` request
   - Check Request Headers for `Cookie: xyzCompAuthorize=...`

2. **Check CORS response headers:**
   - In Network tab, check Response Headers
   - Verify: `Access-Control-Allow-Origin: https://geowise-admin-portal.netlify.app`
   - Verify: `Access-Control-Allow-Credentials: true`

3. **If cookie is missing:**
   - Check if user is logged in
   - Verify cookie is set for correct domain
   - Check cookie SameSite attribute (should be `None` for cross-origin)

4. **If CORS headers are missing:**
   - Backend needs to add CORS headers
   - Verify backend allows `https://geowise-admin-portal.netlify.app` origin

---

## Summary

✅ **Architecture is correct:**
- APIs call backend directly (no Netlify proxy)
- No Netlify overhead
- CORS is configured (per user)

⚠️ **Current issue:**
- Authentication cookie may not be sent or is invalid
- Backend redirects to login page
- Services don't load because of auth failure

**Recommendation:** Check browser Network tab to verify cookie is being sent and CORS headers are present in the response.
