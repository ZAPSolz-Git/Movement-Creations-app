// lib/apiClient.ts
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { supabase } from "./supabaseClient";
import { tokenStorage } from "./tokenStorage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL as string;

if (!API_BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in .env");
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Attach access token on every outgoing request ──
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── 401 handling: refresh once, queue concurrent requests, retry ──
let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const flushQueue = (error: unknown, token: string | null = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error || !token) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

// Set by the app root (e.g. on AuthContext) so the interceptor can force
// navigation to Login without importing navigation logic here directly.
let onAuthExpired: (() => void) | null = null;
export const setOnAuthExpired = (handler: () => void) => {
  onAuthExpired = handler;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data, error: refreshErr } = await supabase.auth.refreshSession();

      if (refreshErr || !data.session) {
        throw refreshErr ?? new Error("No session returned on refresh");
      }

      const newAccessToken = data.session.access_token;
      await tokenStorage.setTokens({
        accessToken: newAccessToken,
        refreshToken: data.session.refresh_token,
      });

      flushQueue(null, newAccessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshFailure) {
      flushQueue(refreshFailure, null);
      await tokenStorage.clearTokens();
      await supabase.auth.signOut();
      onAuthExpired?.(); // e.g. navigate to Login screen
      return Promise.reject(refreshFailure);
    } finally {
      isRefreshing = false;
    }
  },
);
