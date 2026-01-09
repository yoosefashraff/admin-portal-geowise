# AutoDispatch Flow

Front-end application for AutoDispatch Flow management.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js >= 20.19.0
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
autodispatch-flow/
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## API Configuration

This project integrates with the ApprovedUserCredits API. The API base URL is configured directly in the service file (`src/services/approvedUserCreditsService.ts`) to match the backend structure.

**API Base URL:** `https://gw5cn.geowise.ai`

The API uses cookie-based authentication. In development, a Vite proxy is configured to avoid CORS issues.

### Troubleshooting API Connection Issues

If you see "Failed to fetch" errors:

1. **CORS Issue**: The backend needs to allow CORS from your origin. The Vite proxy should help in development.

2. **Cookie Authentication**: Cookies are domain-specific. If accessing from `localhost:5173`, cookies from `gw5cn.geowise.ai` won't be available. Solutions:
   - Access the app from the same domain as the API (e.g., `https://gw5cn.geowise.ai/autodispatch`)
   - Or configure the backend to allow CORS with credentials from localhost
   - Or use a subdomain that shares cookies with the API domain

3. **Not Logged In**: Make sure you are logged into the GeoWise application before testing API calls.

4. **Backend Not Running**: Verify the API is accessible at `https://gw5cn.geowise.ai`

## API Integration

The project includes API service functions in `src/services/approvedUserCreditsService.ts`:
- `createApprovedUserCredit()` - Create new credit records
- `updateApprovedUserCredit()` - Update existing credits
- `getApprovedUserCreditsByUserId()` - Get credits for current user
- `getApprovedUserCreditById()` - Get credit by ID
- `listApprovedUserCredits()` - List credits with filters
- `deleteApprovedUserCredit()` - Soft delete credits

## Notes

- This is a front-end project that connects to the ApprovedUserCredits API
- Uses the same design system and Tailwind configuration as the Timesheet project
- API calls automatically include cookies for authentication

## API Integration Status

⚠️ **Before merging with dashboard, see:**
- `API_INTEGRATION_CHECKLIST.md` - Complete checklist of what's needed
- `API_AUTHENTICATION_GUIDE.md` - Authentication configuration guide

**Current Issues:**
- Some endpoints returning HTML instead of JSON (authentication/CORS)
- Response format verification needed
- Authentication method needs confirmation with backend
