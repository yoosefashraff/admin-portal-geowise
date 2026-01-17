# Netlify API Architecture - Direct Backend Calls

## ✅ Confirmed: APIs Call Backend Directly (No Netlify Proxy)

### Architecture Overview

```
Browser (Client)
    ↓
Server Action (fetchServiceRequests) - runs on Netlify Serverless Function
    ↓
createServiceRequestsAxios() - creates axios instance
    ↓
Direct HTTP call to: https://gw5cndev.geowise.ai/api/barber/FetchBookings
    ↓
Backend API (gw5cndev.geowise.ai)
```

**No Netlify proxy, no Netlify Edge Functions, no intermediate layer.**

---

## How It Works

### 1. Client-Side (Browser)

**File:** `app/(protected)/scheduler/service-requests/page.tsx`

```typescript
// Client component calls server action
const response = await fetchServiceRequests(
  startDateStr,
  endDateStr,
  false,
  user.UserID
)
```

### 2. Server Action (Netlify Serverless Function)

**File:** `lib/actions/serviceRequests.actions.ts` (marked with `"use server"`)

```typescript
export async function fetchServiceRequests(...) {
  // Gets API URL from env var
  const baseURL = getServiceRequestsApiUrl(); // Returns: https://gw5cndev.geowise.ai
  
  // Creates axios instance with direct backend URL
  const serviceRequestsAPI = await createServiceRequestsAxios();
  
  // Makes DIRECT call to backend (no proxy)
  const response = await serviceRequestsAPI.post(
    '/api/barber/FetchBookings',  // Relative path
    params
  );
  // Full URL: https://gw5cndev.geowise.ai/api/barber/FetchBookings
}
```

### 3. Axios Instance Configuration

**File:** `lib/actions/serviceRequests.actions.ts` → `createServiceRequestsAxios()`

```typescript
const instance = axios.create({
  baseURL: 'https://gw5cndev.geowise.ai',  // Direct backend URL
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false  // For dev SSL certs
  })
});
```

**The axios instance uses the full backend URL as `baseURL`**, so all requests go directly to the backend.

---

## Environment Variables

### Required (Set in Netlify Dashboard)

- `NEXT_PUBLIC_DEV_API_URL` = `https://gw5cndev.geowise.ai` ✅
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = your key ✅

### How They're Used

1. **Build Time:** `NEXT_PUBLIC_*` variables are embedded into the Next.js bundle
2. **Runtime:** Server Actions read `process.env.NEXT_PUBLIC_DEV_API_URL`
3. **API Calls:** Used as `baseURL` in axios instance

**Important:** If you change env vars, you must **redeploy** for changes to take effect.

---

## Verification

### ✅ No Netlify Proxy

- **No `_redirects` file** - Netlify doesn't proxy API calls
- **No `_headers` file** - No special headers for proxying
- **No Netlify Edge Functions** - Not used for API routing
- **Direct axios calls** - `baseURL` points directly to backend

### ✅ Direct Backend Calls

**Evidence in code:**

1. `getServiceRequestsApiUrl()` returns: `https://gw5cndev.geowise.ai`
2. `createServiceRequestsAxios()` uses this as `baseURL`
3. API calls: `axios.post('/api/barber/FetchBookings', ...)`
4. **Full URL:** `https://gw5cndev.geowise.ai/api/barber/FetchBookings`

**Path:** Netlify Serverless Function → `https://gw5cndev.geowise.ai` (direct HTTP call)

---

## What About `/api` Route?

**File:** `app/api/[...path]/route.ts`

This route is **only used in local development** (localhost):

- **Local dev:** Browser → `/api/*` → Next.js proxy → backend (for CORS)
- **Netlify:** Browser → Server Action → backend directly (no `/api` route)

**Code confirms this:**

```typescript
// lib/api/axios-instance.ts
if (isDevelopment && typeof window !== 'undefined') {
  return '/api';  // Only on localhost
}
// On Netlify, returns: https://gw5cndev.geowise.ai
```

---

## Netlify Functions Usage

**Netlify Functions are used for:**
- ✅ Next.js Server Actions (runs on Netlify's Node runtime)
- ✅ Next.js API routes (if any)
- ✅ SSR (Server-Side Rendering)

**Netlify Functions are NOT used for:**
- ❌ API proxying (we call backend directly)
- ❌ Edge routing (no edge functions for API)
- ❌ Request transformation (direct pass-through)

---

## Summary

| Component | Path | Uses Netlify Proxy? |
|-----------|------|---------------------|
| **Client API calls** | Browser → `https://gw5cndev.geowise.ai` | ❌ No - Direct |
| **Server Actions** | Netlify Serverless → `https://gw5cndev.geowise.ai` | ❌ No - Direct |
| **Next.js `/api` route** | Only on localhost (for CORS) | N/A on Netlify |

**All API calls go directly from the application (browser or serverless function) to the backend. Netlify does not sit in the middle.**

---

## Troubleshooting

If scheduler page still doesn't load:

1. **Check Netlify Function logs:**
   - Netlify Dashboard → Functions → Logs
   - Look for `🔍 [fetchServiceRequests] Making API call:`
   - Check for errors

2. **Verify env var in build:**
   - Check build logs for: `🔧 Service Requests API URL:`
   - Should show: `https://gw5cndev.geowise.ai`

3. **Check authentication:**
   - Function logs should show: `🔐 Adding authentication cookie`
   - If missing: `⚠️ No authentication token available`

4. **Test backend directly:**
   ```bash
   curl -X POST https://gw5cndev.geowise.ai/api/barber/FetchBookings \
     -H "Content-Type: application/json" \
     -H "Cookie: xyzCompAuthorize=YOUR_TOKEN" \
     -d '{"StartDate":"2025-01-01T00:00:00Z","EndDate":"2025-12-31T23:59:59Z","IsOnlyConfirmed":false,"CompanyAdminId":YOUR_ID}'
   ```
