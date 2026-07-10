import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function ReportsScreen() {
  const reports = ["Streaming Report", "Royalty Report", "Audience Report"];

  return (
    <View className="flex-1 bg-[#F8F5FF] px-5 pt-14">
      <Text className="text-3xl font-bold">Reports</Text>

      <Text className="mt-2 text-gray-500">Analyze your music performance</Text>

      {reports.map((item, index) => (
        <View
          key={index}
          className="mt-5 flex-row items-center rounded-2xl bg-white p-5"
        >
          <View className="rounded-xl bg-purple-100 p-3">
            <Ionicons name="bar-chart" size={24} color="#7C3AED" />
          </View>

          <Text className="ml-4 text-lg font-semibold">{item}</Text>
        </View>
      ))}
    </View>
  );
}
