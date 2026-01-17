# Netlify API Diagnostics - Scheduler Not Loading

## Quick Check

If the scheduler page isn't loading data on Netlify, check the browser console for:

1. **API Base URL** - Should show `https://gw5cndev.geowise.ai` (not `/api`)
2. **Network Errors** - Look for CORS or connection errors
3. **401/403 Errors** - Authentication issues

## Verify API Configuration

### 1. Check Environment Variable

```bash
netlify env:get NEXT_PUBLIC_DEV_API_URL
```

**Expected:** `https://gw5cndev.geowise.ai`

### 2. Check Browser Console

Open the scheduler page and check console:

- Look for: `📋 Fetching services from DEV environment`
- Check `__API_BASE_URL__` in console: `window.__API_BASE_URL__`
- Should be: `https://gw5cndev.geowise.ai`

### 3. Check Network Tab

1. Open DevTools → Network tab
2. Filter by "getservices" or "company"
3. Check the request:
   - **URL:** Should be `https://gw5cndev.geowise.ai/company/getservices?...`
   - **Status:** Should be 200 or 201
   - **Headers:** Should include `Cookie: xyzCompAuthorize=...`

## Common Issues

### Issue 1: CORS Error

**Symptom:** Console shows `🚫 Network Error` or CORS error

**Cause:** Backend doesn't allow `https://geowise-admin-portal.netlify.app`

**Fix:** Backend must add to CORS allowed origins:
```
https://geowise-admin-portal.netlify.app
```

### Issue 2: Wrong API URL

**Symptom:** API calls going to wrong URL

**Check:**
```javascript
// In browser console:
window.__API_BASE_URL__
```

**Fix:** Set `NEXT_PUBLIC_DEV_API_URL` in Netlify:
```bash
netlify env:set NEXT_PUBLIC_DEV_API_URL https://gw5cndev.geowise.ai
```

Then **redeploy** (env vars require new build).

### Issue 3: Authentication Cookie Missing

**Symptom:** 401 Unauthorized errors

**Check:** Network tab → Request Headers → Should see `Cookie: xyzCompAuthorize=...`

**Fix:** Ensure user is logged in. Cookie should be set by login action.

### Issue 4: API Using `/api` Proxy (Wrong)

**Symptom:** Requests going to `geowise-admin-portal.netlify.app/api/...`

**Cause:** `NEXT_PUBLIC_DEV_API_URL` not set, falling back to `/api`

**Fix:** Set `NEXT_PUBLIC_DEV_API_URL` in Netlify env vars and redeploy.

## Verification Commands

```bash
# Check env vars
netlify env:list

# Get specific var
netlify env:get NEXT_PUBLIC_DEV_API_URL

# Set if missing
netlify env:set NEXT_PUBLIC_DEV_API_URL https://gw5cndev.geowise.ai

# After setting env, trigger new deploy
netlify deploy --prod
# OR push to main branch to trigger auto-deploy
```

## Expected API Flow on Netlify

```
Browser (geowise-admin-portal.netlify.app)
  ↓ (direct HTTPS call)
https://gw5cndev.geowise.ai/company/getservices?companyadminId=...
  ↓ (with Cookie: xyzCompAuthorize=...)
Backend responds with services
```

**No Netlify in the middle** - direct browser → backend.

## Debugging Steps

1. **Open scheduler page** on Netlify
2. **Open DevTools** (F12)
3. **Check Console** for:
   - `📋 Fetching services...` log
   - Any error messages
   - `window.__API_BASE_URL__` value
4. **Check Network tab**:
   - Filter: "getservices" or "company"
   - Check request URL (should be `https://gw5cndev.geowise.ai/...`)
   - Check response status
   - Check request headers (should have Cookie)
5. **If CORS error**: Backend needs to allow Netlify origin
6. **If 401**: Check authentication cookie
7. **If wrong URL**: Check env var is set and redeploy
