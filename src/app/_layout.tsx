// src/app/_layout.tsx
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { AuthProvider } from "../contexts/SupabaseAuthContext";
import "../global.css";
import { setOnAuthExpired } from "../lib/apiClient";
export default function RootLayout() {
  useEffect(() => {
    setOnAuthExpired(() => router.replace("/home"));
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
