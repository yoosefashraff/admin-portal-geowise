# Netlify Scheduler Page Not Loading - Debugging Guide

## Current Architecture

The scheduler page (`/scheduler/service-requests`) uses **Server Actions** to fetch data:

1. **Client-side:** `app/(protected)/scheduler/service-requests/page.tsx` calls `fetchServiceRequests()`
2. **Server Action:** `lib/actions/serviceRequests.actions.ts` - marked with `"use server"`
3. **API Call:** Runs on Netlify's serverless function → calls backend directly via `createServiceRequestsAxios()`
4. **Backend:** `https://gw5cndev.geowise.ai/api/barber/FetchBookings`

**No Netlify proxy** - API calls go directly from Netlify serverless → backend.

## Environment Variables Required

Set in **Netlify Dashboard → Site Settings → Environment Variables**:

- `NEXT_PUBLIC_DEV_API_URL` = `https://gw5cndev.geowise.ai` ✅ (set via CLI)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = your key ✅

**Important:** `NEXT_PUBLIC_*` variables are embedded at **build time**. If you change them:
1. Update in Netlify dashboard
2. **Trigger a new deploy** (or wait for next Git push)

## Debugging Steps

### 1. Check Environment Variables

```bash
# Via Netlify CLI (after linking)
netlify env:get NEXT_PUBLIC_DEV_API_URL

# Should return: https://gw5cndev.geowise.ai
```

### 2. Check Netlify Build Logs

1. Go to **Netlify Dashboard → Deploys**
2. Click on the latest deploy
3. Check **Build logs** for:
   - `🔧 Service Requests API URL:` - Should show `https://gw5cndev.geowise.ai`
   - Any errors about missing env vars

### 3. Check Netlify Function Logs

1. Go to **Netlify Dashboard → Functions**
2. Look for function execution logs
3. Check for:
   - `🔍 [fetchServiceRequests] Making API call:` - Should show full URL
   - `❌ Failed to fetch from DEV environment` - Error details

### 4. Check Browser Console

Open browser DevTools → Console on the scheduler page:

- Look for `📥 Fetch response:` - Shows API response
- Look for `❌ Failed to fetch` - Error messages
- Check Network tab for failed requests

### 5. Verify API Endpoint

The endpoint being called:
- **URL:** `https://gw5cndev.geowise.ai/api/barber/FetchBookings`
- **Method:** POST
- **Headers:** Cookie (xyzCompAuthorize), TimeZone, DeviceToken, IsTest
- **Body:** `{ StartDate, EndDate, IsOnlyConfirmed, CompanyAdminId }`

### 6. Common Issues

#### Issue: "Dev environment not configured"
- **Cause:** `NEXT_PUBLIC_DEV_API_URL` not set or not available at build time
- **Fix:** Set in Netlify dashboard and redeploy

#### Issue: "Connection timeout"
- **Cause:** Backend not responding or slow
- **Fix:** Check if `gw5cndev.geowise.ai` is accessible

#### Issue: "401 Unauthorized"
- **Cause:** Cookie not being sent or expired
- **Fix:** Re-login, check cookie is set

#### Issue: "500 Internal Server Error"
- **Cause:** Backend error
- **Fix:** Check backend logs, verify endpoint exists

## Verify Direct Backend Calls

The code confirms **no Netlify proxy**:

1. **Server Action** (`fetchServiceRequests`) runs on Netlify serverless
2. **Axios instance** (`createServiceRequestsAxios`) uses `baseURL = https://gw5cndev.geowise.ai`
3. **Direct call:** `axios.post('https://gw5cndev.geowise.ai/api/barber/FetchBookings', ...)`

**Path:** Netlify Serverless Function → `https://gw5cndev.geowise.ai` (direct, no proxy)

## Testing Locally

To test the same flow locally:

```bash
# Set env var
export NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai

# Run dev server
npm run dev

# Visit: http://localhost:3000/scheduler/service-requests
# Check terminal (server logs) for API calls
```

## Next Steps

If data still doesn't load:

1. **Check Netlify Function logs** (most important - shows server-side errors)
2. **Check browser console** (shows client-side errors)
3. **Verify backend is accessible:** `curl https://gw5cndev.geowise.ai/api/barber/FetchBookings`
4. **Check authentication:** Ensure cookie is set and valid
