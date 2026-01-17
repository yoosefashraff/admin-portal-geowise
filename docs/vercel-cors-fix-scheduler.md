# Vercel CORS Fix - Scheduler Select Service Page

## Problem

**Only the scheduler select-service page gets CORS errors on Vercel.**

### Root Cause

**Scheduler select-service page uses `apiClient` (client-side API calls):**
- Browser → `https://gw5cndev.geowise.ai` = Cross-origin
- Backend CORS doesn't include Vercel domain
- Cookie not sent → 302 redirect to login
- CORS error: `No 'Access-Control-Allow-Origin' header`

**Other pages use Server Actions:**
- Vercel Serverless Function → `https://gw5cndev.geowise.ai` = Server-to-server
- No CORS issues (CORS is browser-only)
- Cookie sent via server-side headers
- Works fine ✅

---

## Why Only Scheduler?

### Pages Using Client-Side API Calls (`apiClient`)

These pages make direct browser → backend calls (CORS issues):

1. ✅ **`/scheduler/select-service`** - Uses `apiClient.get('/company/getservices')`
2. ✅ **`/scheduler/assign-provider`** - Uses `apiClient.post('/company/searchcompanyprovider')`
3. ✅ **`/scheduler/assign-client`** - Uses `apiClient.get('/company/listcustomerforscheduler')`
4. ✅ **`/scheduler/datetime-selection`** - Uses `apiClient.post('/search/getbarberavilabelbookingdate')`

### Pages Using Server Actions (No CORS Issues)

These pages use Server Actions (server-to-server):

1. ✅ **`/scheduler/service-requests`** - Uses `fetchServiceRequests()` Server Action
2. ✅ **`/dashboard`** - Uses `fetchServiceRequests()` Server Action
3. ✅ **`/services`** - Uses `getServicesForCompany()` Server Action

---

## Solution

**Convert scheduler select-service page to use Server Action:**

**Before (Client-side - CORS issues):**
```typescript
import { apiClient } from "@/lib/api/axios-instance";

const response = await apiClient.get('/company/getservices', {
  params: {companyadminId: user.UserID}
});
```

**After (Server Action - No CORS):**
```typescript
import { getServices } from "@/lib/actions/scheduler.actions";

const response = await getServices({ companyadminId: user.UserID });
```

---

## Benefits

1. **No CORS issues** - Server-to-server communication
2. **Cookie automatically sent** - Server Actions include cookies from request
3. **Consistent with other pages** - Same pattern as service-requests page
4. **Works on all platforms** - Vercel, Netlify, localhost

---

## Other Scheduler Pages

**Also need to convert (if they have CORS issues):**

- `/scheduler/assign-provider` - Uses `apiClient.post('/company/searchcompanyprovider')`
- `/scheduler/assign-client` - Uses `apiClient.get('/company/listcustomerforscheduler')`
- `/scheduler/datetime-selection` - Uses `apiClient.post('/search/getbarberavilabelbookingdate')`

**Check if these pages also have CORS errors on Vercel and convert them too.**

---

## Testing

After fix:

1. **Navigate to `/scheduler/select-service`**
2. **Services should load** without CORS errors
3. **No 302 redirects** to login
4. **Check Network tab** - Should see Server Action call, not direct backend call

---

**Status:** Fixed - Converted to Server Action. Other scheduler pages may need same fix if they use `apiClient`.
