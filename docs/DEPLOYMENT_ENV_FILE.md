# Deployment .env File Content

## Your Current Values

Based on your `.env` file, here's what should be in the **deployment `.env` file**:

```
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBoTjZ2AEj8uDDR6J1tkvOlElb2ogswS7I
PORT=3000
NODE_ENV=production
```

---

## Important Notes

### 1. **No Quotes Needed**
- Remove quotes from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `.env` files don't need quotes around values
- Your current file has: `"AIzaSyBoTjZ2AEj8uDDR6J1tkvOlElb2ogswS7I"` (with quotes)
- Deployment file should have: `AIzaSyBoTjZ2AEj8uDDR6J1tkvOlElb2ogswS7I` (no quotes)

### 2. **Add Missing Variables**
- Add `PORT=3000` (if not already present)
- Add `NODE_ENV=production` (required for production)

### 3. **File Location**
- Place this `.env` file in your `frontend-deploy/` folder
- It should be at the same level as `.next/` and `public/` folders

---

## Complete .env File for Deployment

**Create a file named `.env` (with the dot) with this exact content:**

```
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBoTjZ2AEj8uDDR6J1tkvOlElb2ogswS7I
PORT=3000
NODE_ENV=production
```

**No quotes, no spaces around `=`, one variable per line.**

---

## Quick Steps

1. **Create new file:** `.env` (in your `frontend-deploy` folder)

2. **Copy this content:**
   ```
   NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBoTjZ2AEj8uDDR6J1tkvOlElb2ogswS7I
   PORT=3000
   NODE_ENV=production
   ```

3. **Save the file**

4. **Verify:**
   - File name is exactly `.env` (with dot, no extension)
   - No quotes around the Google Maps API key
   - All 4 variables are present

---

## Differences from Your Current .env

**Your current file (local development):**
- May have quotes around values (OK for local)
- May have comments
- May have additional variables

**Deployment file (server):**
- No quotes around values
- Only these 4 variables
- Clean, minimal content
