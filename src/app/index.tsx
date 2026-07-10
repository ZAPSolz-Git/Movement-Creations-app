import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Dashboard() {
  return (
    <View className="flex-1 bg-[#F8F5FF]">
      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mt-12 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-10 w-10 rounded-full bg-purple-600" />

            <Text className="ml-3 text-xl font-bold text-purple-600">
              SoundSync
            </Text>
          </View>

          <Ionicons name="notifications-outline" size={24} color="#7C3AED" />
        </View>

        {/* Greeting */}

        <View className="mt-8">
          <Text className="text-xs tracking-widest text-gray-500">
            GOOD MORNING, ALEX
          </Text>

          <Text className="mt-1 text-2xl font-bold text-black">
            Your Music Overview
          </Text>
        </View>

        {/* Streams Card */}

        <View className="mt-8 rounded-2xl border border-purple-200 bg-white p-5">
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500">Total Streams</Text>

            <View className="rounded-full bg-purple-100 px-3 py-1">
              <Text className="text-xs text-purple-600">+12.5%</Text>
            </View>
          </View>

          <Text className="mt-1 text-5xl font-bold text-purple-600">
            1,284,092
          </Text>

          {/* Fake Chart */}

          <View className="mt-8 flex-row items-end gap-2">
            {[40, 70, 55, 90, 75, 120, 150].map((height, index) => (
              <View
                key={index}
                style={{
                  height,
                  width: 25,
                }}
                className="rounded-t-md bg-purple-200"
              />
            ))}
          </View>
        </View>

        {/* Royalties Card */}

        <View className="mt-5 rounded-2xl border border-purple-200 bg-white p-5">
          <Text className="text-xs text-gray-500">Unpaid Royalties</Text>

          <Text className="text-xl font-bold">$12,450.00</Text>

          <View className="mt-6 flex-row justify-between">
            <Text className="text-xs text-gray-500">Pending</Text>

            <Text className="text-xs text-gray-700">$2,100</Text>
          </View>

          {/* Progress */}

          <View className="mt-2 h-2 rounded-full bg-gray-200">
            <View className="h-2 w-[70%] rounded-full bg-cyan-600" />
          </View>

          <TouchableOpacity className="mt-5 rounded-lg bg-purple-600 py-3">
            <Text className="text-center font-bold text-white">
              Withdraw Funds
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}

        <Text className="mt-8 text-xs font-bold tracking-widest text-gray-500">
          QUICK ACTIONS
        </Text>

        <View className="mb-10 mt-5 flex-row justify-between">
          {[
            ["grid", "Dashboard"],
            ["albums", "Tracks"],
            ["card", "Revenue"],
            ["bar-chart", "Reports"],
            ["person", "Profile"],
          ].map(([icon, title]) => (
            <View key={title} className="items-center">
              <Ionicons name={icon as any} size={22} color="#7C3AED" />

              <Text className="mt-1 text-xs text-gray-500">{title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
