// lib/tokenStorage.ts
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_KEY = "mc_access_token";
const REFRESH_KEY = "mc_refresh_token";
const USER_KEY = "mc_user";
const TOKEN_EXPIRY_KEY = "mc_token_expiry";

export interface StoredUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

// ── Platform-aware storage adapter ──
// Native (iOS/Android): expo-secure-store (encrypted keychain/keystore)
// Web: localStorage (SecureStore has no web implementation — matches your
// existing website's localStorage.setItem("accessToken", ...) behavior)
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return null; // SSR guard
      return window.localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return storage.getItem(ACCESS_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return storage.getItem(REFRESH_KEY);
  },

  async setTokens({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken?: string;
  }): Promise<void> {
    await storage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) {
      await storage.setItem(REFRESH_KEY, refreshToken);
    }
  },

  async clearTokens(): Promise<void> {
    await storage.deleteItem(ACCESS_KEY);
    await storage.deleteItem(REFRESH_KEY);
    await storage.deleteItem(USER_KEY);
    await storage.deleteItem(TOKEN_EXPIRY_KEY);
  },

  async setTokenExpiry(expiry: number): Promise<void> {
    await storage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
  },

  async getTokenExpiry(): Promise<number | null> {
    const raw = await storage.getItem(TOKEN_EXPIRY_KEY);
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  },

  // Display-only cache — never used for authorization decisions.
  async setUser(user: StoredUser): Promise<void> {
    await storage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<StoredUser | null> {
    const raw = await storage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  },
};
