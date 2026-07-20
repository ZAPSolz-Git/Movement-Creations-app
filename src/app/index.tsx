// src/app/login.tsx
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/SupabaseAuthContext";

interface FormErrors {
  email?: string;
  password?: string;
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Enter a valid email address";
    }

    if (!password) {
      next.password = "Secret key is required";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      setServerError(error);
      return;
    }
    router.replace("/home");
  };

  return (
    <LinearGradient
      colors={["#F5EEFF", "#F8F8FC", "#FFFFFF"]}
      style={{ flex: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 80}
          style={{ flex: 1 }}
          className="flex-1"
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              minHeight: "100%",

              paddingHorizontal: 16,
              paddingVertical: 32,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 shadow-lg">
                <Image
                  source={require("./images/logo.png")}
                  className="h-6 w-6"
                  resizeMode="contain"
                />
              </View>

              <Text className="mt-4 text-center text-4xl font-bold text-gray-900 md:text-5xl">
                Movement Creations
              </Text>

              <Text className="mt-2 text-base text-gray-500 md:text-lg">
                Users Login
              </Text>
            </View>

            <View className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-lg md:p-8">
              {serverError ? (
                <View className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <Text className="text-center text-sm font-medium text-red-600">
                    {serverError}
                  </Text>
                </View>
              ) : null}

              <Text className="mb-2 font-semibold text-gray-700">
                Artist Email
              </Text>

              <View
                className={`mb-1 flex-row items-center rounded-xl border px-4 ${
                  errors.email ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              >
                <MaterialIcons
                  name="alternate-email"
                  size={20}
                  color={errors.email ? "#ef4444" : "#888"}
                />

                <TextInput
                  className="ml-3 flex-1 py-4"
                  placeholder="artist@movementcreations.com"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errors.email)
                      setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>
              {errors.email ? (
                <Text className="mb-4 ml-1 text-xs text-red-500">
                  {errors.email}
                </Text>
              ) : (
                <View className="mb-5" />
              )}

              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-semibold text-gray-700">Secret Key</Text>

                <TouchableOpacity disabled={loading}>
                  <Text className="font-semibold text-violet-600">
                    Forgot Credentials?
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                className={`flex-row items-center rounded-xl border px-4 ${
                  errors.password
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <Feather
                  name="key"
                  size={18}
                  color={errors.password ? "#ef4444" : "#888"}
                />

                <TextInput
                  className="ml-3 flex-1 py-4"
                  secureTextEntry={hidePassword}
                  placeholder="Enter your secret key"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (errors.password)
                      setErrors((e) => ({ ...e, password: undefined }));
                  }}
                  autoComplete="password"
                  editable={!loading}
                />

                <TouchableOpacity
                  onPress={() => setHidePassword((current) => !current)}
                  disabled={loading}
                >
                  <Feather
                    name={hidePassword ? "eye-off" : "eye"}
                    size={20}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text className="mt-1 ml-1 text-xs text-red-500">
                  {errors.password}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className={`mt-8 flex-row items-center justify-center rounded-xl py-4 shadow md:py-5 ${
                  loading ? "bg-violet-400" : "bg-violet-600"
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center text-xl font-bold text-white md:text-2xl">
                    Login to Studio
                  </Text>
                )}
              </TouchableOpacity>

              {/* <View className="my-8 flex-row items-center">
                <View className="h-px flex-1 bg-gray-300" />

                <Text className="mx-4 text-gray-500">OR</Text>

                <View className="h-px flex-1 bg-gray-300" />
              </View> */}

              {/* <TouchableOpacity
                disabled={loading}
                className="flex-row items-center justify-center rounded-xl border border-gray-300 py-4"
               >
                <MaterialIcons name="fingerprint" size={22} color="#666" />

                <Text className="ml-2 font-semibold text-gray-700">
                  Secure Sign-in
                </Text>
              </TouchableOpacity> */}
            </View>

            <View className="mt-8 items-center text-center">
              {/* <TouchableOpacity
                onPress={() => !loading && router.push("/home")}
                disabled={loading}
              >
                <Text className="text-gray-500 text-center md:text-base">
                  New artist?{" "}
                  <Text className="font-bold text-violet-600">
                    Join the collective
                  </Text>
                </Text>
              </TouchableOpacity> */}

              <View className="mt-8 flex-col items-center gap-2 md:flex-row md:gap-4">
                <Text className="font-medium text-gray-500">
                  Terms of Service
                </Text>

                <Text className="text-gray-300">|</Text>

                <Text className="font-medium text-gray-500">
                  Privacy Policy
                </Text>
              </View>

              <Text className="mt-5 text-xs text-gray-400 md:text-sm">
                Movement Creations Studio - v2.4.0
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
