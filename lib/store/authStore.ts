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
          if (response.Cookie && typeof document !== 'undefined') {
            const maxAge = 60 * 60 * 24 * 30; // 30 days in seconds
            document.cookie = `xyzCompAuthorize=${response.Cookie}; path=/; max-age=${maxAge}; SameSite=None; Secure`;
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
            const maxAge = 60 * 60 * 24 * 30; // 30 days in seconds
            document.cookie = `xyzCompAuthorize=${state.cookie}; path=/; max-age=${maxAge}; SameSite=None; Secure`;
          }
        }
      },
    }
  )
);
