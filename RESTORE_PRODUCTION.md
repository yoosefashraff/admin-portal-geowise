# RESTORE PRODUCTION ENVIRONMENT

## When to Use This Prompt

Use this prompt when you need to restore production environment configuration after testing/development is complete.

---

## Restoration Prompt

Copy and paste this prompt to restore production environment:

```
Restore production environment configuration. I need to switch from dev environment back to production.

Steps:
1. Restore NEXT_PUBLIC_API_URL=https://gw5cn.geowise.ai in .env file
2. Remove or comment out NEXT_PUBLIC_DEV_API_URL from .env
3. Update all API functions to use NEXT_PUBLIC_API_URL instead of requiring NEXT_PUBLIC_DEV_API_URL
4. Remove the strict dev-only checks that throw errors when dev is not configured
5. Restore production fallback logic where appropriate (but keep dev as preferred if both are set)
6. Update next.config.js proxy to use production URL if dev is not set
7. Verify all API calls can work with production backend

Reference: PRODUCTION_BACKUP.md contains the production values.

Make sure to:
- Keep backward compatibility (dev environment should still work if NEXT_PUBLIC_DEV_API_URL is set)
- Update error messages to be generic (not dev-specific)
- Test that the application works with production backend
- Document any breaking changes or migration notes
```

---

## Quick Manual Restoration

If you prefer manual restoration:

### 1. Update `.env` file:
```bash
# Remove or comment out dev environment
# NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai

# Restore production environment
NEXT_PUBLIC_API_URL=https://gw5cn.geowise.ai
```

### 2. Files that need code changes:
- `lib/api/axios-instance.ts` - Remove dev-only requirement, restore production fallback
- `lib/api/axios-server.ts` - Remove dev-only requirement, restore production fallback
- `lib/actions/auth.actions.ts` - Remove dev-only requirement, restore production fallback
- `lib/actions/serviceRequests.actions.ts` - Remove dev-only requirement, restore production fallback
- `lib/actions/approvedUserCredits.actions.ts` - Remove dev-only requirement, restore production fallback
- `app/(protected)/scheduler/service-requests/new/page.tsx` - Remove dev-only requirement
- `next.config.js` - Restore production fallback in rewrites

### 3. Key Changes Needed:
- Replace `throw new Error('Dev environment not configured...')` with production fallback logic
- Change priority: prefer `NEXT_PUBLIC_DEV_API_URL` if set, otherwise use `NEXT_PUBLIC_API_URL`
- Update error messages to be environment-agnostic
- Restore `prodUrl` fallback logic in all API functions

---

## Notes

- **Current State**: Application is 100% dev-only (will fail if dev not configured)
- **Production State**: Should prefer dev if set, otherwise use production
- **Backward Compatibility**: After restoration, both dev and production should work (dev takes precedence)

---

## Verification Checklist

After restoration, verify:
- [ ] Application starts without errors
- [ ] API calls work with production backend
- [ ] Dev environment still works if `NEXT_PUBLIC_DEV_API_URL` is set
- [ ] No hardcoded production URLs in code (use env vars)
- [ ] Error messages are generic (not dev-specific)
- [ ] All API functions have proper fallback logic
