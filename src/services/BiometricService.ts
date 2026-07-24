// services/BiometricService.ts
import * as LocalAuthentication from "expo-local-authentication";

export type BiometricKind = "facial" | "fingerprint" | "iris" | "none";

export interface BiometricAvailability {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  primaryType: BiometricKind;
  available: boolean;
}

export type BiometricErrorCode =
  | "not_enrolled"
  | "user_cancel"
  | "app_cancel"
  | "not_available"
  | "lockout"
  | "no_space"
  | "timeout"
  | "unable_to_process"
  | "unknown"
  | "system_cancel"
  | "user_fallback"
  | "invalid_context"
  | "passcode_not_set"
  | "authentication_failed";

export interface BiometricAuthResult {
  success: boolean;
  error?: BiometricErrorCode;
  message?: string;
  cancelled?: boolean;
}

const ERROR_MESSAGES: Record<BiometricErrorCode, string> = {
  not_enrolled: "No fingerprint or Face ID is set up on this device.",
  user_cancel: "Authentication was cancelled.",
  app_cancel: "Authentication was cancelled.",
  not_available: "Biometric authentication isn't available on this device.",
  lockout: "Too many failed attempts. Try again later or use your passcode.",
  no_space: "Not enough storage to complete authentication.",
  timeout: "Authentication timed out. Please try again.",
  unable_to_process:
    "Couldn't process biometric authentication. Please try again.",
  unknown: "Something went wrong during authentication.",
  system_cancel: "Authentication was interrupted.",
  user_fallback: "Switched to passcode authentication.",
  invalid_context: "Authentication session expired. Please try again.",
  passcode_not_set: "Set a device passcode to use biometric login.",
  authentication_failed: "We couldn't verify your identity. Please try again.",
};

const CANCEL_ERRORS = new Set<BiometricErrorCode>([
  "user_cancel",
  "app_cancel",
  "system_cancel",
]);

export const BiometricService = {
  async checkAvailability(): Promise<BiometricAvailability> {
    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    let primaryType: BiometricKind = "none";
    if (
      supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      )
    ) {
      primaryType = "facial";
    } else if (
      supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      )
    ) {
      primaryType = "fingerprint";
    } else if (
      supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
    ) {
      primaryType = "iris";
    }

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      primaryType,
      available: hasHardware && isEnrolled,
    };
  },

  async authenticate(
    promptMessage = "Authenticate to continue",
  ): Promise<BiometricAuthResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Cancel",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
      });

      if (result.success) return { success: true };

      const error = (result.error ?? "unknown") as BiometricErrorCode;
      return {
        success: false,
        error,
        cancelled: CANCEL_ERRORS.has(error),
        message: ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown,
      };
    } catch {
      return {
        success: false,
        error: "unknown",
        message: ERROR_MESSAGES.unknown,
      };
    }
  },

  labelFor(kind: BiometricKind): string {
    switch (kind) {
      case "facial":
        return "Face ID";
      case "fingerprint":
        return "Fingerprint";
      case "iris":
        return "Iris Scan";
      default:
        return "Biometric Login";
    }
  },
};
