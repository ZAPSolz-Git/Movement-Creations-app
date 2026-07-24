// hooks/useBiometric.ts
import { useCallback, useState } from "react";

import { useAuth } from "@/contexts/SupabaseAuthContext";

export function useBiometric() {
  const {
    biometricAvailability,
    biometricEnabled,
    needsBiometricUnlock,
    checkBiometricAvailability,
    enableBiometric,
    authenticateBiometric,
  } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    const result = await enableBiometric();
    setBusy(false);
    if (!result.success) setError(result.error ?? "Couldn't enable biometric login.");
    return result;
  }, [enableBiometric]);

  const authenticate = useCallback(
    async (promptMessage?: string) => {
      setBusy(true);
      setError(null);
      const result = await authenticateBiometric(promptMessage);
      setBusy(false);
      if (!result.success && !result.cancelled) {
        setError(result.message ?? "Authentication failed.");
      }
      return result;
    },
    [authenticateBiometric],
  );

  return {
    availability: biometricAvailability,
    isEnabled: biometricEnabled,
    needsUnlock: needsBiometricUnlock,
    busy,
    error,
    clearError: () => setError(null),
    checkAvailability: checkBiometricAvailability,
    enable,
    authenticate,
  };
}
