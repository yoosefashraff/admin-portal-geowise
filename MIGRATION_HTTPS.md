# Migration Guide: Dev Environment HTTPS Update

## Overview

The dev environment (`gw5cndev.geowise.ai`) now uses HTTPS with an SSL certificate. This eliminates mixed content security issues and ensures secure communication.

## Required Changes

### Update Environment Variable

**Before:**
```env
NEXT_PUBLIC_SERVICE_REQUESTS_API_URL=http://gw5cndev.geowise.ai
```

**After:**
```env
NEXT_PUBLIC_SERVICE_REQUESTS_API_URL=https://gw5cndev.geowise.ai
```

**Standard Dev Environment URL:**
The dev environment base URL is: `https://gw5cndev.geowise.ai`

### Files to Update

1. **`.env.local`** (local development)
   - Change `http://` to `https://` for `NEXT_PUBLIC_SERVICE_REQUESTS_API_URL`

2. **Netlify Environment Variables** (production deployment)
   - Update `NEXT_PUBLIC_SERVICE_REQUESTS_API_URL` from `http://` to `https://`
   - Or leave it unset to use production environment

3. **Any CI/CD configuration files**
   - Update environment variable definitions

## Why This Change?

1. **Mixed Content Security**: Browsers block HTTP resources when the page is served over HTTPS
2. **Secure Cookies**: Authentication cookies require HTTPS to work properly
3. **Modern Standards**: HTTPS is required for many modern web APIs and features
4. **Consistency**: Both dev and production now use secure connections

## Verification

After updating the environment variable:

1. **Check Browser Console**: No mixed content warnings
2. **Test API Calls**: Service requests, imports, and auto-dispatch should work without CORS/mixed content errors
3. **Verify Authentication**: Cookies should be transmitted securely

## Rollback

If you need to temporarily use HTTP (not recommended):
- Set `NEXT_PUBLIC_SERVICE_REQUESTS_API_URL` back to `http://gw5cndev.geowise.ai`
- Note: This will cause mixed content errors if frontend is served over HTTPS

## Code Impact

✅ **No code changes required** - The codebase uses environment variables, so it will automatically use HTTPS when the variable is updated.

The code already handles both HTTP and HTTPS protocols correctly.
