# Company Admin Portal

A Next.js admin portal for managing service requests, bookings, providers, and customer credits. Built for Geowise's service dispatch platform.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

## ⚠️ Repository Safety

**This project uses dual repositories for deployment. Always verify remotes before pushing!**

- **`upstream`** = `GeoWise-AI/company-admin-portal` → Company server (master/dev/twitchers)
- **`origin`** = `yoosefashraff/company-admin-portal` → Netlify (main branch, auto-synced)

**Rule:** Always push company work to `upstream`, never to `origin`. 

**Safety Mechanisms:**
- ✅ **Pre-push hook** automatically blocks wrong pushes
- ✅ **Verification scripts** for manual checks
- ✅ **Agent instructions** enforce verification before pushes

**Setup (first time only):**
```bash
# Install safety hooks
npm run setup-git-safety
# OR (Windows PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/setup-git-safety.ps1

# Verify remotes are correct
npm run verify-remotes
```

See [.git-safety-rules.md](.git-safety-rules.md) and [docs/git-safety-enforcement.md](docs/git-safety-enforcement.md) for details.

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=https://gw5cn.geowise.ai
NEXT_PUBLIC_SERVICE_REQUESTS_API_URL=https://gw5cndev.geowise.ai  # Dev environment base URL (HTTPS required)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

**Important:** 
- `NEXT_PUBLIC_SERVICE_REQUESTS_API_URL` routes service requests and credits to a dev environment. Leave it unset for production.
- Dev environment **must use HTTPS** (SSL certificate required) to avoid mixed content security issues when frontend is served over HTTPS.

## Key Features

- **Service Requests Management** - Create, import, and dispatch service requests
- **Auto-Dispatch** - Automatically generate bookings from approved credits
- **Provider Management** - Manage linked users (providers/staff)
- **Customer Credits** - Track approved, used, and remaining credits per customer
- **Calendar & Scheduling** - View and manage bookings
- **Service Zones** - Define geographic service areas
- **Excel Import** - Bulk import service requests via Excel files

## Project Structure

```
app/
  (auth)/          # Login page
  (protected)/     # All authenticated routes
    scheduler/      # Service requests, calendar, availability
    credits/       # Customer credits management
    linked-users/  # Provider management
    services/      # Company services
    zones/         # Service zones
    dashboard/     # Main dashboard

components/
  service-requests/  # Service request forms and tables
  credits/           # Credit management dialogs
  calendar/          # Calendar components
  shared/            # Reusable components

lib/
  actions/           # Server actions (API calls)
  api/               # Axios instances and config
  types/             # TypeScript types
  store/              # Zustand stores (auth, scheduler)
```

## Development Notes

### Service Requests & Credits

Service requests and credits can be routed to a dev environment by setting `NEXT_PUBLIC_SERVICE_REQUESTS_API_URL`. This is useful for testing imports and auto-dispatch without affecting production data.

When creating a new service request with a new customer name, the backend automatically creates the customer record if `CustomerId` is null.

### Excel Import

The import flow expects specific Excel columns. See `scripts/create-test-excel.js` for the expected format. Imported records are stored in the environment specified by `NEXT_PUBLIC_SERVICE_REQUESTS_API_URL` (or production if not set).

### Auto-Dispatch

Auto-dispatch matches service requests with approved user credits and generates bookings. It only processes requests with remaining credits > 0.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Zustand** (state management)
- **React Hook Form** + **Zod** (forms & validation)
- **Axios** (API calls)

## Scripts

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Notes

- Authentication uses cookies (`xyzCompAuthorize`)
- API calls use server actions for secure backend communication
- Google Maps API is required for location autocomplete and map features
- The project includes a separate `autodispatch-flow` subdirectory (legacy/separate flow)
