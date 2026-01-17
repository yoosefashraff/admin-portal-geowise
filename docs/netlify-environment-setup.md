# Netlify Environment Variables Setup

## Required Environment Variables

For Netlify deployment, configure these environment variables in the Netlify dashboard:

### Dev API (Required for Netlify)
```
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
```

### Google Maps API Key (Required)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Note:** Netlify deployments **must** use the dev API. The app will throw an error if `NEXT_PUBLIC_DEV_API_URL` is not set on Netlify.

## How to Configure in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add variable** for each variable above
4. Set the variable name and value
5. Click **Save**

## Environment Variable Priority

For **Netlify deployments**, the app requires:
1. `NEXT_PUBLIC_DEV_API_URL` (REQUIRED) - Dev API
2. `NEXT_PUBLIC_SERVICE_REQUESTS_API_URL` (legacy, if set) - Dev API fallback
3. Error if dev API is not set

For **Company server deployments**, the app uses:
1. `NEXT_PUBLIC_API_URL` (if set) - Production API
2. `NEXT_PUBLIC_DEV_API_URL` (if set) - Dev API (optional)

## For Netlify Deployment

**Required configuration:**
- ✅ Set `NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai` (REQUIRED)
- ✅ Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (REQUIRED)
- ❌ Do NOT set `NEXT_PUBLIC_API_URL` (not used on Netlify)

This ensures Netlify uses the dev API endpoint as required.

## Troubleshooting

### Services Not Loading
- Check that `NEXT_PUBLIC_DEV_API_URL` is set correctly (REQUIRED for Netlify)
- Verify the API URL is accessible (HTTPS required)
- Check browser console for API errors
- Ensure you're using dev API, not production API on Netlify

### WebSocket Connection Failed
- This is expected in production - it's a development-only feature
- The error can be safely ignored
- It doesn't affect functionality

### API Calls Failing
- Verify environment variables are set in Netlify dashboard
- Check that the API URL uses HTTPS
- Ensure CORS is configured on the backend for your Netlify domain
