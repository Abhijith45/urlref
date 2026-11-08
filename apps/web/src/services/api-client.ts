import axios, { AxiosError } from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://apiref.softics.in' : 'http://localhost:5000');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Clerk Bearer JWT if session is active
apiClient.interceptors.request.use(async (config) => {
  if (
    typeof window !== 'undefined' &&
    (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk?.session
  ) {
    try {
      const token = await (
        window as unknown as { Clerk: { session: { getToken: () => Promise<string | null> } } }
      ).Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Graceful fallback
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message?: string; code?: string; details?: unknown[] } }>) => {
    const errorData = error.response?.data?.error;
    const message = errorData?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);
