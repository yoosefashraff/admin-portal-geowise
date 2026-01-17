# Free Hosting Alternatives for Next.js

## Quick Comparison

| Platform | Free Tier | Ease of Use | Best For | Limitations |
|----------|-----------|-------------|----------|-------------|
| **Netlify** | ✅ Yes | ⭐⭐⭐⭐⭐ | Commercial projects | Build time limits, function limits |
| **Cloudflare Pages** | ✅ Yes | ⭐⭐⭐⭐ | Static/SSG + Edge | SSR requires Workers setup |
| **Vercel** | ✅ Yes | ⭐⭐⭐⭐⭐ | Personal/Non-commercial | Non-commercial only, 100 deploys/day |
| **Railway** | ⚠️ $5 credit | ⭐⭐⭐⭐ | Full-stack apps | Usage-based, can exceed free credit |
| **Render** | ⚠️ Requires card | ⭐⭐⭐⭐ | Commercial projects | May require credit card, sleeps after 15min |

---

## 🏆 Recommended: Netlify (Best Free Option for Commercial)

**Why Netlify?**
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

## Setup Guide: Netlify

### Step 1: Create Netlify Account

1. Go to [netlify.com](https://netlify.com)
2. Click **"Sign up"** → **"GitHub"** (recommended)
3. Authorize Netlify to access your repos

### Step 2: Deploy from Git

1. **Dashboard → Add new site → Import an existing project**
2. **Connect to Git provider:**
   - Select **GitHub**
   - Choose your repo: `company-admin-portal`
   - Select branch: `main` (or `netlify` if that's your default)

### Step 3: Configure Build Settings

**Netlify auto-detects Next.js, but verify:**

- **Build command:** `npm run build` (or `npm install && npm run build`)
- **Publish directory:** `.next` (auto-set by Next.js plugin)
- **Base directory:** Leave empty

**Netlify automatically:**
- Detects Next.js
- Installs `@netlify/plugin-nextjs`
- Configures everything correctly

### Step 4: Add Environment Variables

**Site settings → Environment variables:**

Add these (from your `.env` file):

```
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
NODE_ENV=production
```

### Step 5: Deploy

1. Click **"Deploy site"**
2. Netlify will:
   - Clone your repo
   - Install dependencies
   - Build your app
   - Deploy automatically
3. **First deployment takes 5-10 minutes**

### Step 6: Custom Domain (Optional)

1. **Site settings → Domain management**
2. Click **"Add custom domain"**
3. Enter your domain
4. **Netlify automatically provisions SSL**

---

## Alternative: Cloudflare Pages (Best for Static/SSG)

**Why Cloudflare Pages?**
- ✅ **Completely free** (no credit card needed)
- ✅ **Unlimited bandwidth** (for static assets)
- ✅ **Global edge network** (fastest CDN)
- ✅ **Commercial use allowed**
- ✅ **Automatic HTTPS**
- ✅ **Git-based deployment**

**Limitations:**
- ⚠️ Full SSR requires Cloudflare Workers (more setup)
- ⚠️ Better for static/SSG Next.js apps
- ⚠️ Learning curve for Workers if you need SSR

**Setup:**
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. **Create a project → Connect Git**
3. Select your repo
4. Configure build: `npm run build`
5. Publish directory: `.next`
6. Add environment variables
7. Deploy!

---

## Alternative: Railway (If You Need More Control)

**Why Railway?**
- ✅ **$5 free credit/month** (usually enough for small apps)
- ✅ **Full Docker support**
- ✅ **Database included** (Postgres, MySQL, Redis)
- ✅ **No sleep/idle issues**
- ✅ **Commercial use allowed**

**Setup:**

1. Go to [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo**
3. Railway auto-detects Next.js
4. Add environment variables
5. Deploy!

**Note:** Railway charges based on usage. If you exceed $5/month, you'll need to pay. Monitor usage in dashboard.

---

## Alternative: Vercel (If Non-Commercial)

**Why Vercel?**
- ✅ **Made by Next.js creators** (best optimization)
- ✅ **Easiest setup** (one-click deploy)
- ✅ **Edge network** (fastest globally)
- ✅ **Preview deployments** for every PR

**⚠️ Important:** Free tier is **non-commercial only**. For company/admin portals, you need a paid plan ($20/month).

**Setup:**

1. Go to [vercel.com](https://vercel.com)
2. **Import Project → GitHub**
3. Select your repo
4. Vercel auto-configures everything
5. Add environment variables
6. Deploy!

---

## Migration from Netlify/FTP

### What Changes?

1. **Remove Netlify-specific config** (if any):
   - `netlify.toml` (optional, can keep for reference)
   - Netlify CLI commands

2. **Update `next.config.js`:**
   - Remove `output: 'standalone'` (not needed for Render/Railway)
   - Keep everything else

3. **Environment Variables:**
   - Move from `.env` to hosting platform's dashboard
   - Same variable names, just different location

4. **Deployment:**
   - **Before:** Manual FTP upload
   - **After:** Automatic on every Git push!

---

## Recommended: Render Setup Script

I'll create a quick setup guide for Render. Would you like me to:

1. **Create Render-specific config files?**
2. **Update your `next.config.js` for Render?**
3. **Create a migration checklist?**

---

## Quick Decision Guide

**Choose Netlify if:**
- ✅ Commercial project (company admin portal)
- ✅ Want truly free (no credit card)
- ✅ Want easiest setup
- ✅ Need good Next.js support

**Choose Cloudflare Pages if:**
- ✅ Static/SSG Next.js app
- ✅ Want unlimited bandwidth
- ✅ Want fastest global CDN
- ✅ Don't mind Workers setup for SSR

**Choose Railway if:**
- ✅ Need always-on (no sleep)
- ✅ Need database included
- ✅ Don't mind $5/month or monitoring usage
- ✅ Want more control

**Choose Vercel if:**
- ✅ Personal/non-commercial project
- ✅ Want fastest global performance
- ✅ Want preview deployments
- ✅ Can pay $20/month for commercial

---

**My Recommendation:** **Netlify** for your company admin portal. It's truly free, easy, and explicitly allows commercial use.
