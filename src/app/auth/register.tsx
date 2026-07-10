import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function RegisterScreen() {
  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="text-center text-4xl font-bold text-gray-900">
        Create Account
      </Text>

      <Text className="mt-3 text-center text-base text-gray-500">
        Registration will be available soon.
      </Text>

      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-8 rounded-xl bg-blue-600 py-4"
      >
        <Text className="text-center text-lg font-bold text-white">
          Back to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
