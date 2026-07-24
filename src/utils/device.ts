// utils/device.ts
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

export interface DeviceInfo {
  installationId: string;
  model: string | null;
  os: string;
  osVersion: string | null;
  deviceName: string | null;
  brand: string | null;
  platform: string;
  appVersion: string | null;
}

// A per-install identifier used to bind a biometric login to one physical
// install. Regenerated whenever the app's secure storage is empty (fresh
// install / uninstall+reinstall), which is exactly when we want device
// binding to be treated as "a different device" — see SessionService.
const generateId = (): string => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

let cachedInstallationId: string | null = null;

export const getOrCreateInstallationId = async (
  readStored: () => Promise<string | null>,
  persist: (id: string) => Promise<void>,
): Promise<string> => {
  if (cachedInstallationId) return cachedInstallationId;

  const stored = await readStored();
  if (stored) {
    cachedInstallationId = stored;
    return stored;
  }

  const fresh = generateId();
  await persist(fresh);
  cachedInstallationId = fresh;
  return fresh;
};

export const getDeviceInfo = async (
  readStoredInstallationId: () => Promise<string | null>,
  persistInstallationId: (id: string) => Promise<void>,
): Promise<DeviceInfo> => {
  const installationId = await getOrCreateInstallationId(
    readStoredInstallationId,
    persistInstallationId,
  );

  return {
    installationId,
    model: Device.modelName,
    os: Device.osName ?? Platform.OS,
    osVersion: Device.osVersion,
    deviceName: Device.deviceName,
    brand: Device.brand,
    platform: Platform.OS,
    appVersion:
      Application.nativeApplicationVersion ??
      Constants.expoConfig?.version ??
      null,
  };
};
