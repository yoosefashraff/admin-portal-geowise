# AI Coding Guidelines for Company Admin Portal

## Project Overview

This is a **Next.js 16 service dispatch admin portal** for Geowise. Core features: service request management, auto-dispatch (matching requests to approved credits), provider management, and calendar-based booking tracking. Multi-environment support (dev via `NEXT_PUBLIC_DEV_API_URL`, production via `NEXT_PUBLIC_API_URL`).

## Critical Architecture Patterns

### Dual-Environment System (Dev/Prod Separation)
- **Environment variables required:** `NEXT_PUBLIC_API_URL` (prod), `NEXT_PUBLIC_DEV_API_URL` or legacy `NEXT_PUBLIC_SERVICE_REQUESTS_API_URL` (dev)
- **Dev environment MUST use HTTPS** - no mixed content issues with localhost fallback
- Example in [lib/actions/auth.actions.ts](lib/actions/auth.actions.ts#L6): Dev environment is **mandatory** for auth; errors explicitly if not configured
- Pattern: Check `NEXT_PUBLIC_DEV_API_URL` first, fall back to legacy variable, then use production only if explicitly needed
- See [next.config.js](next.config.js#L22) for proxy configuration details

### Server Actions + Axios for API Calls
- All backend communication in `lib/actions/*.ts` (e.g., [serviceRequests.actions.ts](lib/actions/serviceRequests.actions.ts))
- Marked with `"use server"` directive
- Use shared Axios instance from [lib/api/axios-server.ts](lib/api/axios-server.ts) with automatic cookie injection
- Cookie authentication: `xyzCompAuthorize` sent in all requests
- Error handling: Wrap API calls with try-catch; prefer specific error messages for debugging

### Client State Management (Zustand)
- **Auth state:** [lib/store/authStore.ts](lib/store/authStore.ts) - manages cookie, user object, auth status
  - Persisted to localStorage via Zustand middleware
  - Login flow: server action returns `{ Cookie, UserDetails }` → stored in Zustand + set as cookie
  - Auth check on protected layout: [app/(protected)/layout.tsx](app/(protected)/layout.tsx#L20)
- **Scheduler state:** [lib/store/schedulerStore.ts](lib/store/schedulerStore.ts) - for calendar/booking state
- Pattern: Use hooks like `useAuthStore()` in client components; don't duplicate state in useState

### Form Patterns (React Hook Form + Zod)
- Multi-step forms in [components/service-requests/](components/service-requests/) (e.g., `Step1Form.tsx`, `Step2Form.tsx`)
- Always validate with Zod schemas before API calls
- Example: Service request form validates customer, location, service; auto-creates customer if new name provided
- Use form dialogs in [components/credits/CreditFormDialog.tsx](components/credits/CreditFormDialog.tsx) pattern for inline editing

### Component Organization by Feature
- **Protected routes:** `app/(protected)/{feature}/` - scheduler, credits, linked-users, services, zones, dashboard
- **Components:** Organized by feature area with shared components in `components/shared/`
- **UI library:** Radix UI primitives via shadcn/ui (buttons, dialogs, forms, tables, selects)
- **Styling:** Tailwind CSS only; no inline styles except for dynamic values
- Example: [components/service-requests/ServicesRequestsTable.tsx](components/service-requests/ServicesRequestsTable.tsx) - data table with actions dropdown

## Key Development Workflows

### Running the Project
```bash
npm run dev              # Start with Turbopack
npm run build           # Verify production build (slow)
npm run lint            # ESLint check
```

### Testing Data Flows
1. **Service Requests:** Create via form ([app/(protected)/scheduler/add-new-user](app/(protected)/scheduler/add-new-user)) or import from Excel
2. **Auto-Dispatch:** Requires approved user credits + service requests with remaining credits > 0
3. **Dev Environment Testing:** Set `NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai` to test imports without production data

### Excel Import Format
- See [scripts/create-test-excel.js](scripts/create-test-excel.js) for expected columns
- Processed by [components/service-requests/CSVImportDialog.tsx](components/service-requests/CSVImportDialog.tsx)
- Creates customers automatically if `CustomerId` is null

## Critical Business Logic

### Service Request Workflow
1. Create request with customer (auto-creates if new name)
2. Select service and location (Google Maps autocomplete)
3. Request moves to approval/auto-dispatch queue
4. Auto-dispatch matches with approved customer credits (if available)
5. Generates booking in calendar

### Credits System
- **Approved User Credits:** Per customer, per service; can be recurring (days/hours)
- **Auto-Dispatch Rule:** Only processes requests with `RemainingCredits > 0`
- **Data stored in:** Backend (routed to dev or prod environment)

## Common Pitfalls

1. **Authentication Flow:** Don't assume user persists across page refreshes - rely on `useAuthStore()` with localStorage persistence
2. **Environment Mixing:** Always check `NEXT_PUBLIC_DEV_API_URL` first; never hardcode production URLs
3. **Cookies:** Requests use `xyzCompAuthorize` cookie set by login action and browser storage
4. **Google Maps:** Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - used in location autocomplete components
5. **Type Imports:** Path alias `@/*` maps to project root - use for imports from `lib/`, `components/`, etc.

## References

- Tech stack: Next.js 16, React 19, TypeScript, Tailwind, shadcn/ui, Zustand, React Hook Form
- Architecture docs: [PROJECT_BRIEF.md](PROJECT_BRIEF.md), [BACKEND_IMPORT_FIX.md](BACKEND_IMPORT_FIX.md), [PRODUCTION_BACKUP.md](PRODUCTION_BACKUP.md)
- For HTTPS/SSL issues: See [MIGRATION_HTTPS.md](MIGRATION_HTTPS.md)
