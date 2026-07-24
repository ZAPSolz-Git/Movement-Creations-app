// utils/Auth.ts
import { SESSION_DURATION_MS, SessionService } from "../services/SessionService";

export { SESSION_DURATION_MS };

// Full wipe (tokens + biometric flag + device binding + supabase sign-out) —
// a stale biometric flag with an unrecoverable session would otherwise keep
// failing silently on every app launch.
export const clearAuthStorage = async (): Promise<void> => {
  await SessionService.clearSession();
};

export const logoutAndClearAuth = async (): Promise<void> => {
  await clearAuthStorage();
};
