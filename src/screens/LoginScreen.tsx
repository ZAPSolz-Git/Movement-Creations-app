// screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabaseClient"; // supabase-js client configured for RN (AsyncStorage adapter for its OWN internal state — NOT where we store our tokens)
import { tokenStorage } from "../lib/tokenStorage"; // SecureStore wrapper from earlier
import { apiClient } from "../lib/apiClient";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL as string;

// ── Payload / response types — keep these in sync with backend /api/login ──
interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    [key: string]: unknown;
  };
  message?: string;
}

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: LoginPayload = {
        email: email.trim().toLowerCase(),
        password,
      };

      // Use apiClient (plain axios instance, no auth header needed for login itself)
      const { data } = await apiClient.post<LoginResponse>(
        "/api/login",
        payload
      );

      if (!data?.access_token || !data?.refresh_token) {
        throw new Error(data?.message || "Invalid credentials");
      }

      // 1. Sync the on-device Supabase client session (needed if any screen
      //    uses supabase-js directly, e.g. for storage or realtime later)
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionErr) throw new Error("Could not establish session.");

      // 2. Persist tokens securely — apiClient's request interceptor reads
      //    from here on every subsequent call
      await tokenStorage.setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });

      // 3. Store minimal, non-sensitive user info for UI display only —
      //    never trust this for authorization decisions client-side
      await tokenStorage.setUser(data.user);

      navigation.replace("Home");
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to your Movement Creations account</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
            <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const ACCENT = "#0ea5e9";

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, color: "#64748b", marginBottom: 6, fontWeight: "500" },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  toggleText: { marginLeft: 10, color: ACCENT, fontSize: 13, fontWeight: "600" },
  error: { color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" },
  button: {
    height: 46,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default LoginScreen;