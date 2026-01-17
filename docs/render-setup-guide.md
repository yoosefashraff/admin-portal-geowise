# Render Deployment Guide - Step by Step

## Why Render?

- ✅ **Free tier supports commercial use** (unlike Vercel free)
- ✅ **No build time limits** (unlike Netlify)
- ✅ **750 free hours/month** (enough for always-on)
- ✅ **Git-based deployment** (automatic on push)
- ✅ **No FTP needed!**
- ✅ **Built-in HTTPS & custom domains**

**Only limitation:** Free services sleep after ~15 minutes of inactivity (first request wakes it up in ~30 seconds).

---

## Step 1: Create Render Account

1. Go to **[render.com](https://render.com)**
2. Click **"Get Started for Free"**
3. **Sign up with GitHub** (recommended - easier setup)
   - Or use email if preferred
4. Verify your email if needed

---

## Step 2: Create New Web Service

1. **Dashboard → New → Web Service**
2. **Connect your GitHub repository:**
   - Click **"Connect account"** if not connected
   - Authorize Render to access your repos
   - Select: `yoosefashraff/company-admin-portal` (or your repo)
   - Click **"Connect"**

---

## Step 3: Configure Service Settings

Render will auto-detect Next.js, but verify these settings:

### Basic Settings

- **Name:** `company-admin-portal` (or your choice)
- **Region:** Choose closest to your users (e.g., `Oregon (US West)`)
- **Branch:** `main` (or `netlify` if that's your default)
- **Root Directory:** Leave **empty** (or `./` if needed)
- **Runtime:** `Node`
- **Environment:** `Node`

### Build & Deploy Settings

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** **Free** (select from dropdown)

### Advanced Settings (Optional)

- **Auto-Deploy:** `Yes` (deploys on every push)
- **Health Check Path:** `/` (or leave empty)

---

## Step 4: Add Environment Variables

**Before deploying, add your environment variables:**

1. **Scroll down to "Environment Variables"**
2. Click **"Add Environment Variable"**
3. Add these (from your `.env` file):

```
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
NODE_ENV=production
```

**Important:**
- Replace `your_google_maps_key_here` with your actual Google Maps API key
- These are the same variables you use locally
- Render encrypts these automatically

---

## Step 5: Deploy!

1. **Scroll to bottom**
2. Click **"Create Web Service"**
3. Render will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your app (`npm run build`)
   - Start the service (`npm start`)
4. **First deployment takes 5-10 minutes**

---

## Step 6: Monitor Deployment

1. **Watch the build logs** in real-time
2. **Check for errors:**
   - Build failures → Check logs
   - Missing env vars → Add them in Settings
   - Port issues → Render handles this automatically

---

## Step 7: Get Your URL

After deployment succeeds:

1. **Your app URL:** `https://company-admin-portal.onrender.com` (or similar)
2. **Test it:** Open the URL in browser
3. **First request may take 30 seconds** (waking up from sleep)

---

## Step 8: Custom Domain (Optional)

1. **Settings → Custom Domains**
2. Click **"Add Custom Domain"**
3. Enter your domain (e.g., `admin.yourcompany.com`)
4. **Render provides DNS records:**
   - Add CNAME record in your DNS provider
   - Point to: `company-admin-portal.onrender.com`
5. **Render automatically provisions SSL certificate**

---

## Updating Your Code

**Every time you push to GitHub:**

1. Render **automatically detects the push**
2. **Starts a new build** (visible in dashboard)
3. **Deploys automatically** when build completes
4. **Zero manual steps!**

---

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Go to **Settings → Environment**
- Add missing variables

**Error: Build timeout**
- Render free tier has no timeout limits (unlike Netlify)
- Check build logs for specific errors

### App Won't Start

**Error: Port already in use**
- Render automatically sets `PORT` environment variable
- Your `npm start` should use `process.env.PORT || 3000`
- Next.js handles this automatically

**Error: Cannot find module**
- Check build logs
- Ensure all dependencies are in `package.json`

### Slow First Request

**App takes 30 seconds to respond**
- This is normal for free tier (waking from sleep)
- Subsequent requests are fast
- Upgrade to paid plan for always-on

---

## Comparison: Render vs Netlify

| Feature | Netlify | Render |
|---------|---------|--------|
| **Free tier** | ✅ Yes | ✅ Yes |
| **Commercial use** | ✅ Yes | ✅ Yes |
| **Build time limit** | ⚠️ 15 min | ✅ Unlimited |
| **Function limits** | ⚠️ 125k invocations | ✅ No limits |
| **Auto-deploy** | ✅ Yes | ✅ Yes |
| **Custom domains** | ✅ Yes | ✅ Yes |
| **Sleep/idle** | ❌ No | ⚠️ 15 min (free) |
| **SSR support** | ✅ Yes | ✅ Yes |

---

## Next Steps

1. **Test your deployment**
2. **Set up custom domain** (if needed)
3. **Monitor usage** in Render dashboard
4. **Remove Netlify deployment** (if switching completely)

---

**That's it! Your app is now live on Render with automatic deployments.**
