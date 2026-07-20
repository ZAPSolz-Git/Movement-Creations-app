// utils/Auth.ts
import { tokenStorage } from "../lib/tokenStorage";

export const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour — match backend JWT expiry

export const clearAuthStorage = async (): Promise<void> => {
  await tokenStorage.clearTokens();
};

export const logoutAndClearAuth = async (): Promise<void> => {
  await clearAuthStorage();
};
