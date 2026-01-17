# Critical Issue: All Protected Pages Redirecting to Login on Netlify

## Problem

**All protected pages immediately redirect to `/login` after navigation.**

### Observed Behavior

1. User logs in successfully ✅
2. User navigates to any protected page (`/dashboard`, `/scheduler/select-service`, etc.)
3. Page loads briefly, then **immediately redirects to `/login`** ❌
4. User cannot access any protected content

---

## Root Cause

### The Issue

**Protected Layout (`app/(protected)/layout.tsx`) checks for cookie in Zustand store:**

```typescript
const { cookie, user, isAuthenticated, isLoading } = useAuthStore();

// If no cookie at all, redirect to login
if (!cookie) {
  router.replace('/login');
  return;
}
```

### Why It Fails on Netlify

1. **Backend sets cookie with `Domain=.geowise.ai`:**
   - When login makes direct browser request to backend
   - Backend responds with: `Set-Cookie: xyzCompAuthorize=...; Domain=.geowise.ai`
   - Cookie is stored for `geowise.ai` domain

2. **Zustand store reads from `document.cookie`:**
   - `document.cookie` only shows cookies for **current domain** (`netlify.app`)
   - Cookie for `geowise.ai` is **not visible** in `document.cookie` on Netlify
   - Store thinks there's no cookie → `cookie = null`

3. **Protected layout redirects:**
   - `if (!cookie)` → `true` → redirects to login
   - User cannot access any protected pages

---

## Technical Details

### Cookie Storage

**On Netlify:**
- Frontend domain: `geowise-admin-portal.netlify.app`
- Backend domain: `gw5cndev.geowise.ai`
- Cookie set by backend: `Domain=.geowise.ai`
- Cookie **not accessible** via `document.cookie` on Netlify domain

**On Localhost:**
- Uses Next.js proxy (`/api` route)
- Cookie set for `localhost` domain
- Cookie **is accessible** via `document.cookie`
- Works fine ✅

### Zustand Store Cookie Reading

**File:** `lib/store/authStore.ts`

```typescript
// Store reads cookie from document.cookie
const cookie = document.cookie
  .split(';')
  .find(c => c.trim().startsWith('xyzCompAuthorize='));
```

**Problem:** This only finds cookies for the current domain (`netlify.app`), not cookies for `geowise.ai`.

---

## Solutions

### Option 1: Store Cookie Value in localStorage (Recommended)

**When backend sets cookie, also store value in localStorage:**

```typescript
// In login function (lib/store/authStore.ts)
if (isNetlify && isHttps) {
  const fetchResponse = await fetch(loginUrl, {
    credentials: 'include'
  });
  
  response = await fetchResponse.json();
  
  // Store cookie value in localStorage for Zustand store
  if (response.Cookie) {
    localStorage.setItem('xyzCompAuthorize', response.Cookie);
  }
}
```

**Then read from localStorage in store:**

```typescript
// In store initialization
const storedCookie = localStorage.getItem('xyzCompAuthorize');
if (storedCookie) {
  set({ cookie: storedCookie });
}
```

**Pros:**
- Works across domains
- Persistent across page reloads
- Simple to implement

**Cons:**
- Need to sync with actual cookie
- Security consideration (stored in localStorage)

### Option 2: Use Server Action to Read Cookie

**Instead of reading from `document.cookie`, call server action:**

```typescript
// In protected layout
const checkAuth = async () => {
  const response = await getCurrentUserAction();
  // Server can read cookie from request headers
  if (response.Status === 201) {
    // Auth valid
  }
};
```

**Pros:**
- Server can read cookie from request headers
- More secure

**Cons:**
- Requires server round-trip
- More complex

### Option 3: Set Cookie for Netlify Domain Too

**Set cookie for both domains:**

```typescript
// After backend login, also set cookie for netlify.app
if (response.Cookie) {
  document.cookie = `xyzCompAuthorize=${response.Cookie}; path=/; SameSite=None; Secure`;
}
```

**Pros:**
- Zustand store can read it
- Works with existing code

**Cons:**
- Two cookies (one for each domain)
- Need to keep them in sync

---

## Recommended Fix

**Use Option 1 (localStorage) + Option 3 (dual cookie):**

1. **Store cookie value in localStorage** when backend sets it
2. **Also set cookie for netlify.app domain** as fallback
3. **Zustand store reads from localStorage first**, falls back to `document.cookie`

This ensures:
- Store always has cookie value
- Cookie available for API requests (backend domain)
- Works with existing protected layout logic

---

## Testing

After fix:

1. **Login:**
   - Should store cookie in localStorage
   - Should set cookie for netlify.app domain
   - Should set cookie for geowise.ai domain (via backend)

2. **Navigate to protected page:**
   - Should NOT redirect to login
   - Should load page content
   - Zustand store should have cookie value

3. **API calls:**
   - Should include cookie in requests
   - Should authenticate successfully

---

## Status

**Critical Issue** - Blocks all protected pages on Netlify

**Priority:** High - Must fix before site is usable

**Files to Modify:**
- `lib/store/authStore.ts` - Store cookie in localStorage
- `app/(protected)/layout.tsx` - May need adjustment

---

**Next Steps:**
1. Implement localStorage storage for cookie
2. Set cookie for netlify.app domain as fallback
3. Update store to read from localStorage
4. Test on Netlify
