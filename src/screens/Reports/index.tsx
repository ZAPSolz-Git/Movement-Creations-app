import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";

const reportCards = [
  { title: "Weekly listeners", value: "84K", detail: "Up 12% from last week" },
  { title: "Top cities", value: "3", detail: "LA, NYC, Toronto" },
  { title: "Engagement", value: "71%", detail: "Excellent audience retention" },
];

export default function ReportsScreen() {
  return (
    <LinearGradient
      colors={["#F5EEFF", "#F8F8FC", "#FFFFFF"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 32,
              paddingBottom: 160,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  Reports
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Sample analytics dashboard
                </Text>
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow">
                <Feather name="bar-chart-2" size={20} color="#FFFFFF" />
              </View>
            </View>

            <View className="mt-6 rounded-3xl bg-white p-6 shadow-lg">
              <Text className="text-xl font-bold text-gray-900">
                Performance summary
              </Text>
              <Text className="mt-2 text-gray-500">
                You can later replace this with real analytics data from your
                API.
              </Text>
            </View>

            <View className="mt-8 gap-3">
              {reportCards.map((item) => (
                <View
                  key={item.title}
                  className="rounded-2xl border border-violet-50 bg-white p-5 shadow"
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-lg font-bold text-gray-900">
                        {item.title}
                      </Text>
                      <Text className="mt-1 text-gray-500">{item.detail}</Text>
                    </View>
                    <Text className="text-2xl font-bold text-violet-600">
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <Footer />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
