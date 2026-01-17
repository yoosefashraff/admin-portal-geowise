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
          const response = await loginAction({ UserName, Password });
          
          // Also set cookie client-side so it's available for server actions
          // Use SameSite=None; Secure for cross-origin requests (Netlify → backend)
          // CRITICAL: Delete old cookie first to ensure new attributes are applied
          if (response.Cookie && typeof document !== 'undefined') {
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
            // Set new cookie with correct attributes for cross-origin
            // CRITICAL: Must use Secure flag for SameSite=None to work
            const cookieString = `xyzCompAuthorize=${response.Cookie}; path=/; max-age=${maxAge}; SameSite=None; Secure`;
            document.cookie = cookieString;
            
            // Verify cookie was set
            const verifyCookie = document.cookie.includes('xyzCompAuthorize=');
            console.warn('🍪 Cookie set client-side:', {
              hasValue: !!response.Cookie,
              valueLength: response.Cookie?.length || 0,
              attributes: 'SameSite=None; Secure',
              cookieSet: verifyCookie,
              cookieString: cookieString.substring(0, 100) + '...',
              note: 'Check DevTools → Application → Cookies to verify Secure flag is ✓ (checked)',
              warning: verifyCookie ? 'Cookie set successfully' : '⚠️ Cookie may not have been set - check browser console'
            });
            
            // Double-check: Try to read it back
            if (!verifyCookie) {
              console.error('❌ Cookie verification failed - cookie not found in document.cookie after setting');
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
            // Set cookie with correct attributes for cross-origin
            // CRITICAL: Must use Secure flag for SameSite=None to work
            document.cookie = `xyzCompAuthorize=${state.cookie}; path=/; max-age=${maxAge}; SameSite=None; Secure`;
            
            console.warn('🍪 Cookie restored on page load:', {
              hasValue: !!state.cookie,
              attributes: 'SameSite=None; Secure',
              note: 'Cookie restored from localStorage with correct attributes'
            });
          }
        }
      },
    }
  )
);
