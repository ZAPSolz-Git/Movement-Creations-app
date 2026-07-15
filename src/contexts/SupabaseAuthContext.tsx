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
import { supabase } from "../lib/supabaseClient";
import { StoredUser, tokenStorage } from "../lib/tokenStorage";
import { SESSION_DURATION_MS, clearAuthStorage } from "../utils/Auth";

interface AuthContextValue {
  user: StoredUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);

    if (nextSession?.user) {
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
      const { data } = await supabase.auth.getSession();
      handleSession(data.session);
    };
    init();

    // Poll for expiry the same way your web app does — belt-and-suspenders
    // alongside the apiClient's 401 → refresh interceptor.
    const expiryInterval = setInterval(async () => {
      const expiry = await tokenStorage.getTokenExpiry();
      if (expiry && Date.now() > expiry) {
        console.warn("Token expired, signing out...");
        await clearAuthStorage();
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
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

        const sessionData = data.session;

        await tokenStorage.setTokens({
          accessToken: sessionData.access_token,
          refreshToken: sessionData.refresh_token,
        });
        await tokenStorage.setTokenExpiry(Date.now() + SESSION_DURATION_MS);
        await tokenStorage.setUser(sessionData.user as unknown as StoredUser);
        await handleSession(sessionData);

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
    const { error } = await supabase.auth.signOut();
    await clearAuthStorage();
    setUser(null);
    setSession(null);
    return { error: error?.message ?? null };
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, signIn, signOut }),
    [user, session, loading, signIn, signOut],
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
