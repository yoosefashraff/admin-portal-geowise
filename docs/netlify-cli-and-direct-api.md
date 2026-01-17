# Netlify CLI and Direct Backend API

## Link this repo to the Netlify project

**Site ID:** `41c6482c-f551-4650-98ba-ed3b29cac712`  
**Site URL:** https://geowise-admin-portal.netlify.app

### 1. Re-authenticate (if `netlify status` says session expired)

```bash
netlify logout
netlify login
```

Complete login in the browser that opens.

### 2. Link the project

```bash
netlify link --id 41c6482c-f551-4650-98ba-ed3b29cac712
```

Or use:

```bash
npm run netlify:link
```

### 3. Useful CLI commands (after link)

| Command | Purpose |
|--------|---------|
| `netlify status` | Site and link info |
| `netlify env:list` | List env vars (sensitive values hidden) |
| `netlify env:set KEY value` | Set env (use from repo root) |
| `netlify open` | Open site in browser |
| `netlify open:admin` | Open Netlify dashboard |
| `netlify deploy --prod` | Deploy production (bypass Git) |

---

## APIs call the backend directly (no Netlify proxy)

### Client-side (browser)

- **Target:** `https://gw5cndev.geowise.ai` (from `NEXT_PUBLIC_DEV_API_URL`)
- **Path:** Browser → backend. No Netlify proxy, no Netlify Functions.
- **Config:** `lib/api/axios-instance.ts`  
  - On Netlify, `isDevelopment` is false → we do **not** use `/api`. We use `NEXT_PUBLIC_DEV_API_URL` as `baseURL`.

### Local development

- **Target:** `/api` (Next.js API route `app/api/[...path]/route.ts`)
- **Path:** Browser → Next dev server → backend (for CORS and cookies).
- **Config:** Same file; on localhost we set `baseURL = '/api'`.

### Server-side (SSR, Server Actions)

- **Target:** `https://gw5cndev.geowise.ai` via `lib/api/axios-server.ts`
- **Path:** Netlify Node (SSR/Server Action) → backend.  
  This uses Netlify’s Node runtime; it does **not** go through Netlify “Functions” in the sense of extra API proxy.

### What does **not** run through Netlify for API

- No `_redirects` or `_headers` proxying `/api` or the backend.
- No Netlify Edge/Proxy for `gw5cndev.geowise.ai`.
- `/api` in the app is only used when `baseURL = '/api'` (localhost). On Netlify, `baseURL` is the dev API URL.

### Required env on Netlify

In **Site settings → Environment variables**:

- `NEXT_PUBLIC_DEV_API_URL` = `https://gw5cndev.geowise.ai` (use `https` to avoid redirect and mixed content)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = your key

Do **not** set `NEXT_PUBLIC_API_URL` for this Netlify site; it’s for the company production server.

---

## Summary

| Traffic | Path | Uses Netlify Functions? |
|---------|------|--------------------------|
| Client API calls | Browser → gw5cndev.geowise.ai | No |
| SSR / Server Actions | Netlify Node → gw5cndev.geowise.ai | Node runtime only, not as “API proxy” |
| Next.js `/api` route | Used only on localhost as proxy | N/A on Netlify |

Client-side API traffic goes straight to the backend; Netlify does not sit in the middle for those calls.
