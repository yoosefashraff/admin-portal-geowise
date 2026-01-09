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
          set({
            cookie: response.Cookie,
            user: response.UserDetails,
            isAuthenticated: true,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
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
          const user = await getCurrentUserAction();
          
          set({
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
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
        if (state) state.isLoading = false
      },
    }
  )
);
