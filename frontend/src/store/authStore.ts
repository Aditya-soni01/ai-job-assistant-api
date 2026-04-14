

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api';

/**
 * Converts an Axios error into a human-readable auth error message.
 * Distinguishes network/timeout failures from credential/server errors.
 */
function resolveAuthError(err: any, action: 'login' | 'register'): string {
  // No response at all → network down, CORS, or Render cold-start timeout
  if (!err.response) {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return 'The server is taking too long to respond. It may be starting up — please wait a moment and try again.';
    }
    return 'Cannot reach the server. Check your internet connection and try again.';
  }

  const status: number = err.response.status;
  const detail: string | undefined = err.response.data?.detail;

  // Use backend's own message if available and specific enough
  if (detail && status !== 500) return detail;

  if (status === 401) return action === 'login' ? 'Invalid email or password.' : 'Authentication failed.';
  if (status === 403) return 'Your account has been deactivated. Please contact support.';
  if (status === 400) return detail ?? (action === 'register' ? 'Registration failed. Check the fields and try again.' : 'Bad request.');
  if (status === 422) return 'Invalid input. Please check your email and password.';
  if (status >= 500) return 'Server error. Please try again in a moment.';

  return action === 'login' ? 'Login failed. Please try again.' : 'Registration failed. Please try again.';
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
}

/**
 * Zustand store for authentication state management.
 * 
 * Persists auth data to localStorage automatically.
 * Handles login, registration, logout, and token management.
 */
export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const tokenRes = await apiClient.post('/auth/login', { email, password });
          const { access_token } = tokenRes.data;
          // Store token first so the /me request is authenticated
          set({ accessToken: access_token });
          const meRes = await apiClient.get('/auth/me');
          set({ user: meRes.data, isLoading: false, error: null });
        } catch (err: any) {
          const errorMessage = resolveAuthError(err, 'login');
          set({ isLoading: false, error: errorMessage, user: null, accessToken: null });
          throw err;
        }
      },

      register: async (email: string, password: string, username: string, firstName: string, lastName: string) => {
        set({ isLoading: true, error: null });
        try {
          const tokenRes = await apiClient.post('/auth/register', {
            email,
            password,
            username,
            first_name: firstName,
            last_name: lastName,
            skills: [],
          });
          const { access_token } = tokenRes.data;
          set({ accessToken: access_token });
          const meRes = await apiClient.get('/auth/me');
          set({ user: meRes.data, isLoading: false, error: null });
        } catch (err: any) {
          const errorMessage = resolveAuthError(err, 'register');
          set({ isLoading: false, error: errorMessage, user: null, accessToken: null });
          throw err;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setAccessToken: (token: string | null) => {
        set({ accessToken: token });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);

/**
 * Custom hook wrapper for auth store
 */
export const useAuth = () => {
  return authStore();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const state = authStore.getState();
  return !!state.user && !!state.accessToken;
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return authStore.getState().user;
};

/**
 * Get access token
 */
export const getAccessToken = (): string | null => {
  return authStore.getState().accessToken;
};