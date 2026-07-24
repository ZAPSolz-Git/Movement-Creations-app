// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase env vars — check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env",
  );
}

// ── SSR-safe web storage adapter ──
// On web, Expo Router's static output renders on Node (no `window`), so this
// must never touch localStorage during that server pass.
const webStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === "undefined") return null; // SSR pass — no-op
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

// Native sessions are never persisted by the Supabase client itself — that
// would put the refresh token in AsyncStorage. Instead SessionService owns
// persistence via expo-secure-store (see services/SessionService.ts,
// tokenStorage.ts) and rehydrates the client with setSession() on launch.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth:
    Platform.OS === "web"
      ? {
          storage: webStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        }
      : {
          autoRefreshToken: true,
          persistSession: false,
          detectSessionInUrl: false,
        },
});
