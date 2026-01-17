# Netlify Deployment Guide - Step by Step

## Why Netlify?

- ✅ **Free tier supports commercial use** (explicitly allowed)
- ✅ **No credit card required**
- ✅ **Easy Git-based deployment** (no FTP needed!)
- ✅ **Automatic HTTPS & custom domains**
- ✅ **Built-in environment variables**
- ✅ **Global CDN** (fast worldwide)
- ✅ **Great Next.js support** (made for JAMstack)

**Limitations:**
- ⚠️ 15-minute build time limit (usually enough)
- ⚠️ 125k function invocations/month
- ⚠️ 300 build minutes/month

---

## Step 1: Create Netlify Account

1. Go to **[netlify.com](https://netlify.com)**
2. Click **"Sign up"**
3. **Sign up with GitHub** (recommended - easiest)
   - Or use email if preferred
4. Authorize Netlify to access your repositories

---

## Step 2: Deploy from Git

1. **Dashboard → Add new site → Import an existing project**
2. **Connect to Git provider:**
   - Click **"GitHub"** (or your Git provider)
   - Authorize if needed
   - Select your repo: `yoosefashraff/company-admin-portal` (or your repo)
   - Select branch: `main` (or `netlify` if that's your default)

---

## Step 3: Configure Build Settings

**Netlify auto-detects Next.js, but verify:**

- **Build command:** `npm run build`
  - Or: `npm install && npm run build` (if you want to ensure fresh install)
- **Publish directory:** `.next` (auto-set by Next.js plugin)
- **Base directory:** Leave empty (unless your Next.js app is in a subfolder)

**Netlify automatically:**
- Detects Next.js framework
- Installs `@netlify/plugin-nextjs` plugin
- Configures everything correctly

---

## Step 4: Add Environment Variables

**Before deploying, add your environment variables:**

1. **Scroll down to "Advanced build settings"**
2. Click **"New variable"**
3. Add these (from your `.env` file):

```
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
NODE_ENV=production
```

**Or add after deployment:**
1. **Site settings → Environment variables**
2. Click **"Add variable"**
3. Add each variable

**Important:**
- Replace `your_google_maps_key_here` with your actual Google Maps API key
- These are the same variables you use locally
- Netlify encrypts these automatically

---

## Step 5: Deploy!

1. **Scroll to bottom**
2. Click **"Deploy site"**
3. Netlify will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your app (`npm run build`)
   - Deploy automatically
4. **First deployment takes 5-10 minutes**

---

## Step 6: Monitor Deployment

1. **Watch the build logs** in real-time
2. **Check for errors:**
   - Build failures → Check logs
   - Missing env vars → Add them in Settings
   - Timeout issues → Optimize build (rare)

---

## Step 7: Get Your URL

After deployment succeeds:

1. **Your app URL:** `https://random-name-12345.netlify.app` (or custom)
2. **Test it:** Open the URL in browser
3. **App is live immediately!**

---

## Step 8: Custom Domain (Optional)

1. **Site settings → Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `admin.yourcompany.com`)
4. **Netlify provides DNS records:**
   - Add A or CNAME record in your DNS provider
   - Point to Netlify's IP or domain
5. **Netlify automatically provisions SSL certificate** (takes a few minutes)

---

## Updating Your Code

**Every time you push to GitHub:**

1. Netlify **automatically detects the push**
2. **Starts a new build** (visible in dashboard)
3. **Deploys automatically** when build completes
4. **Zero manual steps!**

---

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Go to **Site settings → Environment variables**
- Add missing variables
- **Redeploy** (or wait for next auto-deploy)

**Error: Build timeout (15 minutes)**
- Optimize your build process
- Check for unnecessary dependencies
- Consider splitting into smaller builds

**Error: Function invocation limit**
- You've exceeded 125k invocations/month
- Upgrade to paid plan or optimize API usage

### App Won't Start

**Error: Cannot find module**
- Check build logs
- Ensure all dependencies are in `package.json`
- Verify `package-lock.json` is committed

**Error: API routes not working**
- Check environment variables are set
- Verify API URLs are correct
- Check Netlify function logs

---

## Comparison: Netlify vs Others

| Feature | Netlify | Render | Vercel |
|---------|---------|--------|--------|
| **Free tier** | ✅ Yes | ⚠️ Requires card | ✅ Yes |
| **Commercial use** | ✅ Yes | ✅ Yes | ❌ No (free) |
| **Build time limit** | ⚠️ 15 min | ✅ Unlimited | ✅ 45 min |
| **Function limits** | ⚠️ 125k/month | ✅ No limits | ⚠️ 1M/month |
| **Auto-deploy** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Custom domains** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Credit card required** | ❌ No | ⚠️ Often | ❌ No |

---

## Next Steps

1. **Test your deployment**
2. **Set up custom domain** (if needed)
3. **Monitor usage** in Netlify dashboard
4. **Remove FTP deployment** (if switching completely)

---

**That's it! Your app is now live on Netlify with automatic deployments.**
