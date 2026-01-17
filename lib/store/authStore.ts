import { create } from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import { User } from '@/lib/types/auth.types';
import {loginAction, logoutAction, getCurrentUserAction} from '@/lib/actions/auth.actions';

interface AuthState {
  cookie: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setCookie: (cookie: string) => void;
  setUser: (user: User | null) => void;
  login: (UserName: string, Password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      cookie: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setCookie: (cookie: string) =>
        set({ cookie }),

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      // LOGIN use SessionId → ASP.NET return cookie
      login: async (UserName, Password) => {
        try {
          // On Netlify, make direct browser request so backend can set cookie with correct domain
          const isNetlify = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
          const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
          
          let response: any;
          
          if (isNetlify && isHttps) {
            // Netlify: Direct browser request - backend sets cookie via Set-Cookie header
            const devApiUrl = process.env.NEXT_PUBLIC_DEV_API_URL || process.env.NEXT_PUBLIC_SERVICE_REQUESTS_API_URL;
            if (!devApiUrl) {
              throw new Error('Dev API URL not configured');
            }
            
            const loginUrl = `${devApiUrl.replace(/\/+$/, '')}/company/userlogin`;
            
            console.warn('🌐 [NETLIFY] Direct browser login (backend sets cookie):', loginUrl);
            
            const fetchResponse = await fetch(loginUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              credentials: 'include', // CRITICAL: Allows browser to accept Set-Cookie from backend
              body: JSON.stringify({ UserName, Password })
            });
            
            if (!fetchResponse.ok) {
              const errorData = await fetchResponse.json().catch(() => ({}));
              throw new Error(errorData.Message || errorData.message || `Login failed: ${fetchResponse.status}`);
            }
            
            response = await fetchResponse.json();
            
            // Backend should have set cookie via Set-Cookie header with Domain=.geowise.ai
            console.warn('🍪 [NETLIFY] Backend should have set cookie - check DevTools Application → Cookies');
          } else {
            // Localhost: Use Server Action (works with proxy)
            response = await loginAction({ UserName, Password });
          }
          
          // Also set cookie client-side as fallback (especially if backend didn't set it)
          // On Netlify, backend should set cookie with Domain=.geowise.ai via Set-Cookie
          // But we also set it for netlify.app domain as fallback
          if (response.Cookie && typeof document !== 'undefined') {
            const isNetlify = window.location.hostname.includes('netlify.app');
            const isHttps = window.location.protocol === 'https:';
            
            // Delete existing cookie with all possible attribute combinations
            // This ensures we remove any cookie with old/wrong attributes
            const deleteOptions = [
              'xyzCompAuthorize=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
              'xyzCompAuthorize=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
              'xyzCompAuthorize=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure',
              'xyzCompAuthorize=; path=/; domain=geowise-admin-portal.netlify.app; expires=Thu, 01 Jan 1970 00:00:00 GMT',
            ];
            deleteOptions.forEach(opt => {
              try {
                document.cookie = opt;
              } catch (e) {
                // Ignore errors
              }
            });
            
            // Wait a moment for deletion to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const maxAge = 60 * 60 * 24 * 30; // 30 days in seconds
            
            // On Netlify (HTTPS + cross-origin), MUST use SameSite=None; Secure
            // On localhost (HTTP + same-origin via proxy), SameSite=Lax works fine
            let cookieString: string;
            if (isNetlify && isHttps) {
              // Netlify: Cross-origin → SameSite=None; Secure required
              cookieString = `xyzCompAuthorize=${response.Cookie}; path=/; max-age=${maxAge}; SameSite=None; Secure`;
            } else {
              // Localhost: Same-origin via proxy → SameSite=Lax is fine
              cookieString = `xyzCompAuthorize=${response.Cookie}; path=/; max-age=${maxAge}; SameSite=Lax`;
            }
            
            document.cookie = cookieString;
            
            // Verify cookie was set
            const verifyCookie = document.cookie.includes('xyzCompAuthorize=');
            
            // Log on Netlify to help debug
            if (isNetlify) {
              console.warn('🍪 [NETLIFY] Cookie set client-side:', {
                hasValue: !!response.Cookie,
                valueLength: response.Cookie?.length || 0,
                attributes: 'SameSite=None; Secure',
                cookieSet: verifyCookie,
                isHttps: isHttps,
                hostname: window.location.hostname,
                cookieString: cookieString.substring(0, 100) + '...',
                note: 'CRITICAL: Check DevTools → Application → Cookies → xyzCompAuthorize → Secure should be ✓',
                warning: verifyCookie ? 'Cookie set - verify Secure flag in DevTools' : '⚠️ Cookie may not have been set'
              });
              
              if (!verifyCookie) {
                console.error('❌ [NETLIFY] Cookie verification failed - cookie not found in document.cookie after setting');
              }
            }
          }
          
          set({
            cookie: response.Cookie,
            user: response.UserDetails,
            isAuthenticated: true,
            isLoading: false, // Ensure loading is false after successful login
          });
        } catch (error) {
          set({
            cookie: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      // LOGOUT session-based
      logout: async () => {
        try {
          await logoutAction();
        } finally {
          set({
            cookie: null,
            user: null,
            isAuthenticated: false,
          });
        }
      },

      checkAuth: async () => {
        try {
          const response = await getCurrentUserAction();
          
          if (response.Status === 201 && response.Object) {
            // Update user if we have valid auth
          set({
            isAuthenticated: true,
            isLoading: false,
          });
          } else {
            // Invalid auth, clear everything
            set({
              cookie: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            cookie: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cookie: state.cookie,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false
          // Restore cookie to browser cookie store on page load
          // Use SameSite=None; Secure for cross-origin requests (Netlify → backend)
          if (state.cookie && typeof document !== 'undefined') {
            const isNetlify = window.location.hostname.includes('netlify.app');
            const isHttps = window.location.protocol === 'https:';
            
            // Delete existing cookie with all possible attribute combinations
            const deleteOptions = [
              'xyzCompAuthorize=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
              'xyzCompAuthorize=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
              'xyzCompAuthorize=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure',
            ];
            deleteOptions.forEach(opt => {
              try {
                document.cookie = opt;
              } catch (e) {
                // Ignore errors
              }
            });
            
            const maxAge = 60 * 60 * 24 * 30; // 30 days in seconds
            
            // On Netlify (HTTPS + cross-origin), MUST use SameSite=None; Secure
            // On localhost (HTTP + same-origin via proxy), SameSite=Lax works fine
            let cookieString: string;
            if (isNetlify && isHttps) {
              // Netlify: Cross-origin → SameSite=None; Secure required
              cookieString = `xyzCompAuthorize=${state.cookie}; path=/; max-age=${maxAge}; SameSite=None; Secure`;
            } else {
              // Localhost: Same-origin via proxy → SameSite=Lax is fine
              cookieString = `xyzCompAuthorize=${state.cookie}; path=/; max-age=${maxAge}; SameSite=Lax`;
            }
            
            document.cookie = cookieString;
            
            if (isNetlify) {
              console.warn('🍪 [NETLIFY] Cookie restored on page load:', {
                hasValue: !!state.cookie,
                attributes: 'SameSite=None; Secure',
                isHttps: isHttps,
                hostname: window.location.hostname,
                note: 'Cookie restored from localStorage - verify Secure flag in DevTools'
              });
            }
          }
        }
      },
    }
  )
);
