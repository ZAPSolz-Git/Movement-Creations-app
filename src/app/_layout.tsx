// src/app/_layout.tsx
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { AuthProvider } from "../contexts/SupabaseAuthContext";
import "../global.css";
import { setOnAuthExpired } from "../lib/apiClient";
import { logoutAndClearAuth } from "../utils/Auth";

export default function RootLayout() {
  useEffect(() => {
    setOnAuthExpired(async () => {
      await logoutAndClearAuth();
      router.replace("/");
    });
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="Release" />
        <Stack.Screen name="revenue" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="rights" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="support" />
      </Stack>
      <Toast />
    </AuthProvider>
  );
}
