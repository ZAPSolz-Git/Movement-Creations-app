import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";

const rightsData = [
  {
    title: "Master Recording",
    owner: "Movement Creations",
    territory: "Global",
    status: "Active",
  },
  {
    title: "Publishing",
    owner: "MC Publishing",
    territory: "US / EU",
    status: "Pending",
  },
  {
    title: "Sync License",
    owner: "Studio Rights",
    territory: "Worldwide",
    status: "Active",
  },
];

export default function RightsScreen() {
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
              paddingBottom: 170,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  Rights Management
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Track ownership and licensing details
                </Text>
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow">
                <Feather name="shield" size={20} color="#FFFFFF" />
              </View>
            </View>

            <View className="mt-6 rounded-3xl bg-white p-6 shadow-lg">
              <Text className="text-xl font-bold text-gray-900">
                Rights overview
              </Text>
              <Text className="mt-2 text-gray-500">
                Use this page to view ownership and territory coverage in a
                clear table-style layout.
              </Text>
            </View>

            <View className="mt-6 rounded-3xl border border-violet-50 bg-white p-4 shadow">
              <View className="mb-3 flex-row px-2">
                <Text className="flex-1 text-sm font-semibold text-gray-500">
                  Title
                </Text>
                <Text className="flex-1 text-sm font-semibold text-gray-500">
                  Owner
                </Text>
                <Text className="flex-1 text-sm font-semibold text-gray-500">
                  Territory
                </Text>
                <Text className="flex-1 text-sm font-semibold text-gray-500">
                  Status
                </Text>
              </View>

              {rightsData.map((item) => (
                <View
                  key={item.title}
                  className="border-t border-gray-100 py-3"
                >
                  <View className="flex-row items-center px-2">
                    <Text className="flex-1 text-sm font-semibold text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="flex-1 text-sm text-gray-600">
                      {item.owner}
                    </Text>
                    <Text className="flex-1 text-sm text-gray-600">
                      {item.territory}
                    </Text>
                    <View
                      className={`rounded-full px-3 py-1 ${item.status === "Active" ? "bg-green-100" : "bg-amber-100"}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${item.status === "Active" ? "text-green-700" : "text-amber-700"}`}
                      >
                        {item.status}
                      </Text>
                    </View>
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
