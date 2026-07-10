import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    // Add signup API logic here

    router.replace("/home");
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="mb-10 text-center text-4xl font-bold text-black">
        Create Account
      </Text>

      <TextInput
        className="mb-4 rounded-xl border border-gray-300 px-4 py-4"
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        className="mb-4 rounded-xl border border-gray-300 px-4 py-4"
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        className="mb-6 rounded-xl border border-gray-300 px-4 py-4"
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className="rounded-xl bg-black py-4"
        onPress={handleSignup}
      >
        <Text className="text-center text-lg font-semibold text-white">
          Sign Up
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-5" onPress={() => router.push("/")}>
        <Text className="text-center text-gray-600">
          Already have an account?{" "}
          <Text className="font-bold text-black">Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
