# Migration Checklist: FTP → Netlify

## Pre-Migration

- [ ] Review [hosting-alternatives-guide.md](./hosting-alternatives-guide.md)
- [ ] Choose hosting platform (Netlify recommended for free commercial use)
- [ ] Backup current environment variables
- [ ] Note current FTP URLs

## Netlify Setup

- [ ] Create Netlify account (netlify.com)
- [ ] Connect GitHub repository
- [ ] Import existing project from Git
- [ ] Configure build settings:
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `.next` (auto-set)
  - [ ] Base directory: (leave empty)
- [ ] Add environment variables:
  - [ ] `NEXT_PUBLIC_DEV_API_URL`
  - [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - [ ] `NODE_ENV=production`
- [ ] Deploy and verify
- [ ] Test app functionality
- [ ] Set up custom domain (if needed)

## Code Updates

- [ ] Update `next.config.js`:
  - [ ] Comment out `output: 'standalone'` (not needed for Netlify)
  - [ ] Keep all other config
- [ ] Verify `package.json` scripts are correct
- [ ] Test build locally: `npm run build`
- [ ] Verify `netlify.toml` exists (optional, Netlify auto-detects Next.js)

## Post-Migration

- [ ] Update documentation with new deployment URL
- [ ] Update any hardcoded URLs in code
- [ ] Test all features on Render deployment
- [ ] Monitor first few deployments
- [ ] Set up custom domain DNS (if applicable)

## Optional: Cleanup

- [ ] Remove FTP deployment scripts (if no longer needed)
- [ ] Update team documentation
- [ ] Update any hardcoded deployment URLs

---

**Note:** You can keep both Netlify deployments running during migration for testing.
