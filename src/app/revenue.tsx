import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function RevenueScreen() {
  return (
    <View className="flex-1 bg-[#F8F5FF] px-5 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Revenue</Text>

      <Text className="mt-2 text-gray-500">Your earnings overview</Text>

      <View className="mt-8 rounded-2xl bg-purple-600 p-6">
        <Ionicons name="wallet" size={32} color="white" />

        <Text className="mt-5 text-white">Total Earnings</Text>

        <Text className="mt-2 text-4xl font-bold text-white">$45,890.00</Text>
      </View>

      <View className="mt-5 rounded-2xl bg-white p-5">
        <Text className="font-bold text-lg">Monthly Revenue</Text>

        <Text className="mt-3 text-3xl font-bold text-purple-600">$8,240</Text>

        <Text className="mt-2 text-green-600">+18.5% from last month</Text>
      </View>
    </View>
  );
}
