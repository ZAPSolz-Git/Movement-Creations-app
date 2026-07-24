// services/SecureStorageService.ts
//
// Canonical encrypted storage for everything biometric/device-binding
// related. Session tokens themselves stay in lib/tokenStorage.ts (already
// SecureStore-backed and used across the app) — this service composes that
// module rather than re-implementing token storage.
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { tokenStorage } from "@/lib/tokenStorage";

const BIOMETRIC_ENABLED_KEY = "mc_biometric_enabled";
const DEVICE_BINDING_KEY = "mc_device_binding";
const INSTALLATION_ID_KEY = "mc_installation_id";

export interface DeviceBindingInfo {
  installationId: string;
  model: string | null;
  os: string;
  osVersion: string | null;
  deviceName: string | null;
  brand: string | null;
  platform: string;
  appVersion: string | null;
  boundAt: number;
}

// Native: expo-secure-store (encrypted keychain/keystore).
// Web: localStorage — SecureStore has no web implementation, and biometric
// login is a native-only feature in this app anyway.
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return null;
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

export const SecureStorageService = {
  // ── Biometric flag ──
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await storage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? "1" : "0");
  },

  async isBiometricEnabled(): Promise<boolean> {
    const raw = await storage.getItem(BIOMETRIC_ENABLED_KEY);
    return raw === "1";
  },

  // ── Device binding ──
  async setDeviceBinding(info: DeviceBindingInfo): Promise<void> {
    await storage.setItem(DEVICE_BINDING_KEY, JSON.stringify(info));
  },

  async getDeviceBinding(): Promise<DeviceBindingInfo | null> {
    const raw = await storage.getItem(DEVICE_BINDING_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DeviceBindingInfo;
    } catch {
      return null;
    }
  },

  async clearDeviceBinding(): Promise<void> {
    await storage.deleteItem(DEVICE_BINDING_KEY);
  },

  // ── Installation id (used to fingerprint "this device") ──
  async getInstallationId(): Promise<string | null> {
    return storage.getItem(INSTALLATION_ID_KEY);
  },

  async setInstallationId(id: string): Promise<void> {
    await storage.setItem(INSTALLATION_ID_KEY, id);
  },

  // ── Full wipe of biometric/device state (tokens cleared separately via
  // tokenStorage.clearTokens — orchestrated together in SessionService) ──
  async clearAll(): Promise<void> {
    await storage.deleteItem(BIOMETRIC_ENABLED_KEY);
    await storage.deleteItem(DEVICE_BINDING_KEY);
    await storage.deleteItem(INSTALLATION_ID_KEY);
  },

  // Re-exported for convenience so consumers only need one import.
  tokenStorage,
};
