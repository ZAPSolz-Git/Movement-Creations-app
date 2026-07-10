import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter your email and password.",
      );
      return;
    }

    try {
      // TODO: Replace with your API/Firebase login

      const loginSuccess = true;

      if (loginSuccess) {
        router.replace("/");
      }
    } catch (error) {
      Alert.alert("Login Failed", "Something went wrong. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-10">
          <Text className="text-center text-4xl font-bold text-gray-900">
            Welcome Back 👋
          </Text>

          <Text className="mt-3 text-center text-base text-gray-500">
            Login to continue
          </Text>
        </View>

        {/* Email */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">
            Email
          </Text>

          <TextInput
            className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-4 text-gray-900"
            placeholder="Enter email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-gray-700">
            Password
          </Text>

          <View className="flex-row items-center rounded-xl border border-gray-300 bg-gray-50 px-4">
            <TextInput
              className="flex-1 py-4 text-gray-900"
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text className="font-semibold text-blue-600">
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot password */}
        <TouchableOpacity className="mb-6">
          <Text className="text-right font-semibold text-blue-600">
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* Login */}
        <TouchableOpacity
          onPress={handleLogin}
          className="rounded-xl bg-blue-600 py-4"
        >
          <Text className="text-center text-lg font-bold text-white">
            Login
          </Text>
        </TouchableOpacity>

        {/* Register */}
        <View className="mt-8 flex-row justify-center">
          <Text className="text-gray-500">Don't have an account?</Text>

          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <Text className="ml-1 font-bold text-blue-600">Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
