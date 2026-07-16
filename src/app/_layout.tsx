// src/app/_layout.tsx
import { Stack, router, usePathname } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import Loader from "../components/Loader";
import { AuthProvider, useAuth } from "../contexts/SupabaseAuthContext";
import "../global.css";
import { setOnAuthExpired } from "../lib/apiClient";
import { logoutAndClearAuth } from "../utils/Auth";

// index.tsx is your login screen — the only public route
const PUBLIC_ROUTE = "/";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // wait until we know the auth state

    const isPublicRoute = pathname === PUBLIC_ROUTE;

    if (!user && !isPublicRoute) {
      // Not logged in, trying to hit a protected screen
      router.replace("/");
      return;
    }

    if (user && isPublicRoute) {
      // Already logged in, sitting on the login screen
      router.replace("/home");
    }
  }, [user, loading, pathname]);

  // Block rendering protected screens until we've resolved auth state,
  // and block rendering while a redirect is about to happen.
  if (loading) {
    return <Loader />;
  }

  const isPublicRoute = pathname === PUBLIC_ROUTE;
  if ((!user && !isPublicRoute) || (user && isPublicRoute)) {
    return <Loader />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="home" options={{ gestureEnabled: false }} />
      <Stack.Screen name="Release" />
      <Stack.Screen name="revenue" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="rights" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="support" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    setOnAuthExpired(async () => {
      await logoutAndClearAuth();
      router.replace("/");
    });
  }, []);

  return (
    <AuthProvider>
      <RootLayoutNav />
      <Toast />
    </AuthProvider>
  );
}
