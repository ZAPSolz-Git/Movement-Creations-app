import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";

const summaryCards = [
  { title: "Monthly Revenue", value: "$18.4K", icon: "trending-up" },
  { title: "Pending Payouts", value: "$4.2K", icon: "wallet" },
  { title: "Top Region", value: "US/EU", icon: "globe" },
  { title: "Growth", value: "+24%", icon: "bar-chart" },
];

const transactions = [
  { title: "Streaming payouts", amount: "$2,400", status: "Cleared" },
  { title: "Sync license", amount: "$1,100", status: "Pending" },
  { title: "Merch sales", amount: "$890", status: "Cleared" },
];

export default function RevenueScreen() {
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
                  Revenue
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Finance overview for your studio
                </Text>
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow">
                <Feather name="credit-card" size={20} color="#FFFFFF" />
              </View>
            </View>

            <View className="mt-6 rounded-3xl bg-white p-6 shadow-lg">
              <Text className="text-xl font-bold text-gray-900">
                Your money snapshot
              </Text>
              <Text className="mt-2 text-gray-500">
                This screen uses the same violet theme and Tailwind styling as
                the dashboard.
              </Text>
            </View>

            <View className="mt-8 flex-row flex-wrap justify-between gap-2">
              {summaryCards.map((item) => (
                <View
                  key={item.title}
                  className="mb-4 w-[48%] rounded-2xl border border-violet-50 bg-white p-5 shadow"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                    <Feather
                      name={item.icon as any}
                      size={18}
                      color="#7C3AED"
                    />
                  </View>
                  <Text className="mt-4 text-gray-500">{item.title}</Text>
                  <Text className="mt-1 text-2xl font-bold text-gray-900">
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-2">
              <Text className="text-xl font-bold text-gray-900">
                Recent activity
              </Text>
              <View className="mt-4 gap-3">
                {transactions.map((item) => (
                  <View
                    key={item.title}
                    className="flex-row items-center justify-between rounded-2xl border border-violet-50 bg-white p-5 shadow"
                  >
                    <View>
                      <Text className="text-lg font-bold text-gray-900">
                        {item.title}
                      </Text>
                      <Text className="mt-1 text-gray-500">{item.status}</Text>
                    </View>
                    <Text className="text-lg font-semibold text-violet-600">
                      {item.amount}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <Footer />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
