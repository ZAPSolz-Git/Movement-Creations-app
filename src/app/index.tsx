import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);

  const handleLogin = () => {
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                <Text className="text-2xl font-bold text-white">MC</Text>
              </View>

              <Text className="mt-6 text-center text-4xl font-bold text-gray-900 md:text-5xl">
                Movement Creations
              </Text>

              <Text className="mt-2 text-base text-gray-500 md:text-lg">
                Artist Studio Login
              </Text>
            </View>

            <View className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-lg md:p-8">
              <Text className="mb-2 font-semibold text-gray-700">
                Artist Email
              </Text>

              <View className="mb-5 flex-row items-center rounded-xl border border-gray-200 px-4">
                <MaterialIcons name="alternate-email" size={20} color="#888" />

                <TextInput
                  className="ml-3 flex-1 py-4"
                  placeholder="artist@movementcreations.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-semibold text-gray-700">Secret Key</Text>

                <TouchableOpacity>
                  <Text className="font-semibold text-violet-600">
                    Forgot Credentials?
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center rounded-xl border border-gray-200 px-4">
                <Feather name="key" size={18} color="#888" />

                <TextInput
                  className="ml-3 flex-1 py-4"
                  secureTextEntry={hidePassword}
                  placeholder="Enter your secret key"
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password"
                />

                <TouchableOpacity
                  onPress={() => setHidePassword((current) => !current)}
                >
                  <Feather
                    name={hidePassword ? "eye-off" : "eye"}
                    size={20}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                className="mt-8 rounded-xl bg-violet-600 py-4 shadow md:py-5"
              >
                <Text className="text-center text-xl font-bold text-white md:text-2xl">
                  Login to Studio
                </Text>
              </TouchableOpacity>

              <View className="my-8 flex-row items-center">
                <View className="h-px flex-1 bg-gray-300" />

                <Text className="mx-4 text-gray-500">OR</Text>

                <View className="h-px flex-1 bg-gray-300" />
              </View>

              <TouchableOpacity className="flex-row items-center justify-center rounded-xl border border-gray-300 py-4">
                <MaterialIcons name="fingerprint" size={22} color="#666" />

                <Text className="ml-2 font-semibold text-gray-700">
                  Secure Sign-in
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-8 items-center text-center">
              <Text className="text-gray-500 text-center md:text-base">
                New artist?{" "}
                <Text className="font-bold text-violet-600">
                  Join the collective
                </Text>
              </Text>

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
