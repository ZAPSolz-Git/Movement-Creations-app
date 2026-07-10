import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-[#F8F5FF] px-5 pt-14">
      <Text className="text-3xl font-bold">Profile</Text>

      <View className="mt-8 items-center rounded-2xl bg-white p-6">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-purple-600">
          <Ionicons name="person" size={45} color="white" />
        </View>

        <Text className="mt-5 text-2xl font-bold">Alex Johnson</Text>

        <Text className="text-gray-500">Music Artist</Text>
      </View>

      <View className="mt-5 rounded-2xl bg-white p-5">
        <Text className="text-lg font-bold">Account Details</Text>

        <Text className="mt-4 text-gray-600">Email: alex@soundsync.com</Text>

        <Text className="mt-2 text-gray-600">Songs Released: 24</Text>

        <Text className="mt-2 text-gray-600">Total Streams: 1.2M</Text>
      </View>
    </View>
  );
}
