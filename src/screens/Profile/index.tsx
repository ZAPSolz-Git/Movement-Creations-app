import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";

const profileItems = [
  { title: "Email", value: "artist@movement.com", icon: "mail" },
  { title: "Plan", value: "Pro Studio", icon: "award" },
  { title: "Location", value: "Los Angeles", icon: "map-pin" },
  { title: "Status", value: "Verified", icon: "check-circle" },
];

export default function ProfileScreen() {
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
                  Profile
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  A simple profile placeholder
                </Text>
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow">
                <Feather name="user" size={20} color="#FFFFFF" />
              </View>
            </View>

            <View className="mt-6 rounded-3xl bg-white p-6 shadow-lg">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
                <Text className="text-xl font-bold text-violet-700">MC</Text>
              </View>
              <Text className="mt-4 text-2xl font-bold text-gray-900">
                Movement Creations
              </Text>
              <Text className="mt-1 text-gray-500">
                Music brand • Studio owner
              </Text>
            </View>

            <View className="mt-8 gap-3">
              {profileItems.map((item) => (
                <View
                  key={item.title}
                  className="flex-row items-center justify-between rounded-2xl border border-violet-50 bg-white p-5 shadow"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                      <Feather
                        name={item.icon as any}
                        size={18}
                        color="#7C3AED"
                      />
                    </View>
                    <View>
                      <Text className="text-sm text-gray-500">
                        {item.title}
                      </Text>
                      <Text className="mt-1 text-base font-semibold text-gray-900">
                        {item.value}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity className="mt-6 rounded-2xl bg-violet-600 px-4 py-4 shadow">
              <Text className="text-center text-lg font-semibold text-white">
                Edit profile
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <Footer />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
