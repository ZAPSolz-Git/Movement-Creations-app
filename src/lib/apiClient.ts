// lib/apiClient.ts
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "./supabaseClient";
import { tokenStorage } from "./tokenStorage";

const REAL_API_URL = process.env.EXPO_PUBLIC_API_URL as string;

if (!REAL_API_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in .env");
}

// On web in dev, route through the Metro proxy (same-origin, no CORS).
// On native, and in web production builds, hit the real API directly.
const API_BASE_URL = Platform.OS === "web" && __DEV__ ? "" : REAL_API_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

const isApiRoute = (config?: InternalAxiosRequestConfig) => {
  const url = config?.url ?? "";
  return url.includes("/api/");
};

const getToastContext = (config?: InternalAxiosRequestConfig) => {
  const url = (config?.url ?? "").toLowerCase();
  const method = (config?.method ?? "get").toLowerCase();

  if (url.includes("/api/submissions")) {
    if (method === "get") {
      return {
        successTitle: "Releases loaded",
        errorTitle: "Failed to load releases",
      };
    }
    if (method === "post") {
      return {
        successTitle: "Release created",
        errorTitle: "Failed to create release",
      };
    }
    if (method === "put" || method === "patch") {
      return {
        successTitle: "Release updated",
        errorTitle: "Failed to update release",
      };
    }
    if (method === "delete") {
      return {
        successTitle: "Release deleted",
        errorTitle: "Failed to delete release",
      };
    }
  }

  if (url.includes("/api/user/")) {
    if (url.includes("/withdraw-request")) {
      return {
        successTitle: "Withdrawal request submitted",
        errorTitle: "Withdrawal request failed",
      };
    }

    return {
      successTitle: "Revenue data loaded",
      errorTitle: "Failed to load revenue data",
    };
  }

  if (url.includes("/api/reports")) {
    return {
      successTitle: "Reports loaded",
      errorTitle: "Failed to load reports",
    };
  }

  if (url.includes("/api/tickets")) {
    if (method === "get") {
      return {
        successTitle: "Support tickets loaded",
        errorTitle: "Failed to load support tickets",
      };
    }
    if (method === "post") {
      return {
        successTitle: "Support ticket created",
        errorTitle: "Failed to create support ticket",
      };
    }
    if (method === "put" || method === "patch") {
      return {
        successTitle: "Support ticket updated",
        errorTitle: "Failed to update support ticket",
      };
    }
    if (method === "delete") {
      return {
        successTitle: "Support ticket deleted",
        errorTitle: "Failed to delete support ticket",
      };
    }
  }

  return {
    successTitle: "Success",
    errorTitle: "Error",
  };
};

const showApiToast = (
  type: "success" | "error",
  config: InternalAxiosRequestConfig | undefined,
  message?: string,
) => {
  const toastContext = getToastContext(config);

  Toast.show({
    type,
    text1:
      type === "success" ? toastContext.successTitle : toastContext.errorTitle,
    text2:
      message ??
      (type === "success"
        ? "Request completed successfully."
        : "Something went wrong."),
    visibilityTime: 3000,
    autoHide: true,
  });
};

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

let onAuthExpired: (() => void) | null = null;
export const setOnAuthExpired = (handler: () => void) => {
  onAuthExpired = handler;
};

apiClient.interceptors.response.use(
  (response) => {
    if (isApiRoute(response.config)) {
      const data = response.data as
        { message?: string; detail?: string; error?: string } | undefined;
      const message = data?.message ?? data?.detail ?? data?.error;
      showApiToast("success", response.config, message);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    if (isApiRoute(originalRequest)) {
      const data = error.response?.data as
        { message?: string; detail?: string; error?: string } | undefined;
      const message = data?.message ?? data?.detail ?? data?.error;
      showApiToast(
        "error",
        originalRequest,
        message ?? "Something went wrong.",
      );
    }

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
      onAuthExpired?.();
      return Promise.reject(refreshFailure);
    } finally {
      isRefreshing = false;
    }
  },
);
