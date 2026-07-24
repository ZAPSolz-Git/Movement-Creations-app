// contexts/SupabaseAuthContext.tsx
import type { Session } from "@supabase/supabase-js";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Toast from "react-native-toast-message";

import { supabase } from "../lib/supabaseClient";
import { StoredUser, tokenStorage } from "../lib/tokenStorage";
import type {
  BiometricAuthResult,
  BiometricAvailability,
} from "../services/BiometricService";
import {
  EnableBiometricResult,
  SESSION_DURATION_MS,
  SessionService,
} from "../services/SessionService";

interface AuthContextValue {
  user: StoredUser | null;
  session: Session | null;
  loading: boolean;

  // Biometric / secure session state
  needsBiometricUnlock: boolean;
  biometricEnabled: boolean;
  biometricAvailability: BiometricAvailability | null;
  // True while the login screen has its own post-login flow in progress
  // (e.g. the "Enable Face ID?" modal) — blocks the root layout's
  // auto-redirect-to-/home so it doesn't race ahead of that UI.
  holdAutoRedirect: boolean;
  setHoldAutoRedirect: (hold: boolean) => void;

  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;

  checkBiometricAvailability: () => Promise<BiometricAvailability>;
  enableBiometric: () => Promise<EnableBiometricResult>;
  authenticateBiometric: (
    promptMessage?: string,
  ) => Promise<BiometricAuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsBiometricUnlock, setNeedsBiometricUnlock] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailability, setBiometricAvailability] =
    useState<BiometricAvailability | null>(null);
  const [holdAutoRedirect, setHoldAutoRedirect] = useState(false);

  const handleSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);

    if (nextSession?.user) {
      // Keep our encrypted copy in sync in case the SDK silently rotated
      // the access/refresh tokens via autoRefreshToken in the background.
      await tokenStorage.setTokens({
        accessToken: nextSession.access_token,
        refreshToken: nextSession.refresh_token,
      });
      await tokenStorage.setTokenExpiry(Date.now() + SESSION_DURATION_MS);

      const cachedUser = await tokenStorage.getUser();
      if (cachedUser && cachedUser.id === nextSession.user.id) {
        setUser({ ...nextSession.user, ...cachedUser } as StoredUser);
      } else {
        setUser(nextSession.user as unknown as StoredUser);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const [availability, restored] = await Promise.all([
        SessionService.checkBiometricAvailability(),
        SessionService.restoreSession(),
      ]);

      setBiometricAvailability(availability);

      if (restored.deviceMismatch) {
        Toast.show({
          type: "info",
          text1: "Please sign in again",
          text2: "Your saved session doesn't match this device.",
        });
      }

      // Biometric enrollment is checked independent of whether the session
      // itself restored — a failed/expired restore only clears tokens (see
      // SessionService.clearTokensOnly), not the enrollment, so the login
      // screen still knows not to re-prompt "Enable Face ID?" after a fresh
      // password login.
      //
      // Resolve and apply these flags *before* handleSession sets `user` —
      // otherwise the root layout can see a truthy user with
      // needsBiometricUnlock still at its stale `false` default for one
      // render and redirect straight to /home before the lock view ever
      // gets a chance to show.
      const isBioEnabled = await SessionService.isBiometricEnabled();
      setNeedsBiometricUnlock(!!restored.session && restored.requiresBiometric);
      setBiometricEnabled(isBioEnabled);

      await handleSession(restored.session);
    };
    init();

    // Poll for expiry the same way your web app does — belt-and-suspenders
    // alongside the apiClient's 401 → refresh interceptor. This only drops
    // the tokens (fresh password login required next time), not biometric
    // enrollment — see SessionService.clearTokensOnly.
    const expiryInterval = setInterval(async () => {
      const expiry = await tokenStorage.getTokenExpiry();
      if (expiry && Date.now() > expiry) {
        console.warn("Session expired, requiring fresh login...");
        await SessionService.clearTokensOnly();
        setUser(null);
        setSession(null);
        setNeedsBiometricUnlock(false);
      }
    }, 60 * 1000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      handleSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(expiryInterval);
    };
  }, [handleSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data?.session) {
          return { error: error?.message || "Invalid credentials" };
        }

        await SessionService.saveSessionAfterLogin(data.session);
        await handleSession(data.session);
        setNeedsBiometricUnlock(false);
        // Re-sync from persisted truth rather than trusting whatever the
        // in-memory value happens to be — guarantees a password re-login
        // never re-triggers "Enable Face ID?" when it's already enabled.
        setBiometricEnabled(await SessionService.isBiometricEnabled());

        return { error: null };
      } catch (err: any) {
        const message =
          err?.message || "Login failed. Please check your credentials.";
        return { error: message };
      }
    },
    [handleSession],
  );

  const signOut = useCallback(async () => {
    await SessionService.clearSession();
    setUser(null);
    setSession(null);
    setNeedsBiometricUnlock(false);
    setBiometricEnabled(false);
    return { error: null };
  }, []);

  const checkBiometricAvailability = useCallback(async () => {
    const availability = await SessionService.checkBiometricAvailability();
    setBiometricAvailability(availability);
    return availability;
  }, []);

  const enableBiometric = useCallback(async () => {
    const result = await SessionService.enableBiometric();
    if (result.success) setBiometricEnabled(true);
    return result;
  }, []);

  const authenticateBiometric = useCallback(async (promptMessage?: string) => {
    const result = await SessionService.authenticateBiometric(promptMessage);
    if (result.success) setNeedsBiometricUnlock(false);
    return result;
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      needsBiometricUnlock,
      biometricEnabled,
      biometricAvailability,
      holdAutoRedirect,
      setHoldAutoRedirect,
      signIn,
      signOut,
      checkBiometricAvailability,
      enableBiometric,
      authenticateBiometric,
    }),
    [
      user,
      session,
      loading,
      needsBiometricUnlock,
      biometricEnabled,
      biometricAvailability,
      holdAutoRedirect,
      signIn,
      signOut,
      checkBiometricAvailability,
      enableBiometric,
      authenticateBiometric,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
