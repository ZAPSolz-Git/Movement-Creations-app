import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";

const releases = [
  {
    id: "1",
    title: "Midnight Echoes",
    type: "Audio",
    status: "Live",
    cover:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80",
    date: "Oct 12, 2024",
  },
  {
    id: "2",
    title: "Summer Vibes",
    type: "Ringtone",
    status: "Draft",
    cover:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
    date: "Sep 24, 2024",
  },
  {
    id: "3",
    title: "Morning Alarm",
    type: "Audio",
    status: "Review",
    cover:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
    date: "Aug 11, 2024",
  },
];

export default function ReleaseScreen() {
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
                  Releases
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Audio and ringtone releases
                </Text>
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow">
                <Feather name="music" size={20} color="#FFFFFF" />
              </View>
            </View>

            <View className="mt-6 rounded-3xl bg-white p-6 shadow-lg">
              <Text className="text-xl font-bold text-gray-900">
                Release library
              </Text>
              <Text className="mt-2 text-gray-500">
                Browse your content with cover images and status tags.
              </Text>
            </View>

            <View className="mt-6 gap-3">
              {releases.map((item) => (
                <View
                  key={item.id}
                  className="rounded-3xl border border-violet-50 bg-white p-4 shadow"
                >
                  <View className="flex-row items-center gap-3">
                    <Image
                      source={{ uri: item.cover }}
                      className="h-16 w-16 rounded-2xl"
                    />

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-gray-900">
                          {item.title}
                        </Text>
                        <View
                          className={`rounded-full px-3 py-1 ${item.status === "Live" ? "bg-green-100" : item.status === "Review" ? "bg-amber-100" : "bg-violet-100"}`}
                        >
                          <Text
                            className={`text-xs font-semibold ${item.status === "Live" ? "text-green-700" : item.status === "Review" ? "text-amber-700" : "text-violet-700"}`}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      <View className="mt-2 flex-row items-center gap-2">
                        <View className="rounded-full bg-violet-100 px-3 py-1">
                          <Text className="text-xs font-semibold text-violet-700">
                            {item.type}
                          </Text>
                        </View>
                        <Text className="text-sm text-gray-500">
                          {item.date}
                        </Text>
                      </View>
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
