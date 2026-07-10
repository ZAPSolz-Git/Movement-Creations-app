import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const handleLogout = () => {
    router.replace("/");
  };

  return (
    <View className="flex-1 items-center justify-center bg-gray-100 px-6">
      <View className="w-full rounded-2xl bg-white p-6 shadow">
        <Text className="text-center text-3xl font-bold text-black">
          Welcome 👋
        </Text>

        <Text className="mt-3 text-center text-gray-500">
          Welcome to Movement Creations App
        </Text>

        <TouchableOpacity
          className="mt-8 rounded-xl bg-black py-4"
          onPress={handleLogout}
        >
          <Text className="text-center text-lg font-semibold text-white">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
