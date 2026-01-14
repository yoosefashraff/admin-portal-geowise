# PRODUCTION ENVIRONMENT VARIABLES BACKUP
# Created: 2025-01-14
# Purpose: Backup of production values for restoration after testing
# 
# TO RESTORE: Copy these values back to .env file when ready for production
# 
# WARNING: Do NOT commit this file to git if it contains sensitive information
# Keep this file safe and secure

## Production Environment Variables

```bash
# Production Backend API URL
NEXT_PUBLIC_API_URL=https://gw5cn.geowise.ai
```

## Production Configuration References

### next.config.js - Image Host
```javascript
{
  protocol: 'https',
  hostname: 'gw5cn.geowise.ai',  // Production image host
  pathname: '/**',
}
```

## Notes:
- This file contains production environment variables and configuration references
- Only restore these values when ready to deploy to production
- During development/testing, use `NEXT_PUBLIC_DEV_API_URL` instead
- Current dev environment: `https://gw5cndev.geowise.ai`
- All hardcoded production URLs have been removed from codebase
- Code now requires dev environment and will fail fast if not configured

## Restoration Steps:
1. Copy `NEXT_PUBLIC_API_URL=https://gw5cn.geowise.ai` to your `.env` file
2. Remove or comment out `NEXT_PUBLIC_DEV_API_URL` from `.env`
3. Uncomment production image hostname in `next.config.js` if needed
4. Restart the development server
