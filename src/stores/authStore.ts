import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearSensitiveData: () => void;
}

const API_BASE = '/api';

// SECURITY: Token expiration check
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// SECURITY: Clear auth data on window close for sensitive sessions
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Optional: Uncomment to clear on window close for higher security
    // sessionStorage.removeItem('resume-builder-auth');
  });
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
          }

          // Don't set authenticated yet - user needs to verify email
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // SECURITY: Clear all sensitive data from storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('resume-builder-auth');
          sessionStorage.removeItem('resume-builder-auth');
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      clearSensitiveData: () => {
        // SECURITY: Clear token but keep user info for display
        if (typeof window !== 'undefined') {
          localStorage.removeItem('resume-builder-auth');
          sessionStorage.removeItem('resume-builder-auth');
        }
        set({ token: null, isAuthenticated: false });
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Email verification failed');
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to send reset email');
          }

          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      resetPassword: async (token: string, newPassword: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Password reset failed');
          }

          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            // Token invalid, logout
            get().logout();
            return;
          }

          set({ token: data.token, user: data.user });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'resume-builder-auth',
      // SECURITY: Use sessionStorage instead of localStorage for better security
      // sessionStorage is cleared when the browser tab is closed
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // SECURITY: Check token expiration on rehydration
      onRehydrateStorage: () => (state) => {
        if (state && state.token && isTokenExpired(state.token)) {
          // Token has expired, clear auth state
          state.logout();
        }
      },
    }
  )
);

// SECURITY: Periodic token expiration check (every 60 seconds)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useAuthStore.getState();
    if (state.token && isTokenExpired(state.token)) {
      state.logout();
    }
  }, 60000);
}
