// services/SessionService.ts
//
// Orchestrates session persistence + biometric enrollment on top of
// SecureStorageService (biometric flag/device binding) and tokenStorage
// (access/refresh token, matching the app's existing storage). The Supabase
// client itself never persists sessions on native (see lib/supabaseClient.ts)
// — this service is the single source of truth for restoring one.
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabaseClient";
import { StoredUser, tokenStorage } from "@/lib/tokenStorage";
import { getDeviceInfo } from "@/utils/device";

import { BiometricService, BiometricAuthResult } from "./BiometricService";
import { SecureStorageService } from "./SecureStorageService";

// How long a restored session is trusted before requiring a fresh password
// login — independent of the Supabase access token's own (much shorter)
// JWT expiry, which autoRefreshToken already renews silently in the
// background. This is the "ask for my password again after N days" cap;
// biometric enrollment survives it (see restoreSession/clearTokensOnly) so
// the user only re-enters their password, never re-enables Face ID.
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface RestoreSessionResult {
  session: Session | null;
  requiresBiometric: boolean;
  deviceMismatch: boolean;
}

export interface EnableBiometricResult {
  success: boolean;
  error?: string;
}

const readInstallationId = () => SecureStorageService.getInstallationId();
const persistInstallationId = (id: string) =>
  SecureStorageService.setInstallationId(id);

export const SessionService = {
  async saveSessionAfterLogin(session: Session): Promise<void> {
    await tokenStorage.setTokens({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    });
    await tokenStorage.setTokenExpiry(Date.now() + SESSION_DURATION_MS);
    await tokenStorage.setUser(session.user as unknown as StoredUser);
  },

  async restoreSession(): Promise<RestoreSessionResult> {
    const [accessToken, refreshToken] = await Promise.all([
      tokenStorage.getAccessToken(),
      tokenStorage.getRefreshToken(),
    ]);

    if (!accessToken || !refreshToken) {
      return { session: null, requiresBiometric: false, deviceMismatch: false };
    }

    const biometricEnabled = await SecureStorageService.isBiometricEnabled();

    if (biometricEnabled) {
      const binding = await SecureStorageService.getDeviceBinding();
      if (binding) {
        const device = await getDeviceInfo(
          readInstallationId,
          persistInstallationId,
        );
        if (device.installationId !== binding.installationId) {
          // Genuine security event — a different physical install is
          // presenting these tokens. Full wipe, biometric included.
          await this.clearSession();
          return {
            session: null,
            requiresBiometric: false,
            deviceMismatch: true,
          };
        }
      }
    }

    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        // Tokens are stale/expired/rejected — needs a fresh password login,
        // but that's not a security event: keep the biometric enrollment
        // and device binding so re-login doesn't re-prompt "Enable?".
        await this.clearTokensOnly();
        return {
          session: null,
          requiresBiometric: false,
          deviceMismatch: false,
        };
      }

      // setSession() may itself have refreshed the tokens — keep our copy in sync.
      await tokenStorage.setTokens({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
      await tokenStorage.setTokenExpiry(Date.now() + SESSION_DURATION_MS);

      return {
        session: data.session,
        requiresBiometric: biometricEnabled,
        deviceMismatch: false,
      };
    } catch {
      await this.clearTokensOnly();
      return { session: null, requiresBiometric: false, deviceMismatch: false };
    }
  },

  // Full wipe — tokens, biometric flag, device binding, Supabase sign-out.
  // Reserved for an explicit user logout or a genuine device mismatch.
  async clearSession(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {
      // best-effort — secure storage still gets wiped below regardless
    }
    await tokenStorage.clearTokens();
    await SecureStorageService.clearAll();
  },

  // Drops only the access/refresh tokens (forces a fresh password login on
  // next attempt) while preserving biometric enrollment + device binding,
  // so re-login doesn't re-trigger the "Enable Face ID?" prompt.
  async clearTokensOnly(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {
      // best-effort
    }
    await tokenStorage.clearTokens();
  },

  async checkBiometricAvailability() {
    return BiometricService.checkAvailability();
  },

  async isBiometricEnabled(): Promise<boolean> {
    return SecureStorageService.isBiometricEnabled();
  },

  async enableBiometric(): Promise<EnableBiometricResult> {
    const availability = await BiometricService.checkAvailability();

    if (!availability.hasHardware) {
      return {
        success: false,
        error: "This device doesn't support biometric authentication.",
      };
    }
    if (!availability.isEnrolled) {
      return {
        success: false,
        error:
          "No Face ID / fingerprint is enrolled. Set one up in your device settings first.",
      };
    }

    const authResult = await BiometricService.authenticate(
      "Confirm to enable biometric login",
    );
    if (!authResult.success) {
      return { success: false, error: authResult.message };
    }

    const device = await getDeviceInfo(readInstallationId, persistInstallationId);
    await SecureStorageService.setDeviceBinding({
      ...device,
      boundAt: Date.now(),
    });
    await SecureStorageService.setBiometricEnabled(true);

    return { success: true };
  },

  async disableBiometric(): Promise<void> {
    await SecureStorageService.setBiometricEnabled(false);
    await SecureStorageService.clearDeviceBinding();
  },

  async authenticateBiometric(
    promptMessage?: string,
  ): Promise<BiometricAuthResult> {
    return BiometricService.authenticate(promptMessage);
  },
};
