import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function () {
  const handleLogout = () => {
    router.replace("/");
  };

  const stats = [
    { icon: "music", title: "Songs", value: "24" },
    { icon: "radio", title: "Streams", value: "1.2M" },
    { icon: "trending-up", title: "Revenue", value: "$3,420" },
    { icon: "globe", title: "Stores", value: "150+" },
  ] as const;

  const releases = [
    {
      title: "Midnight Dreams",
      artist: "Movement Creations",
      status: "Live",
      statusBg: "bg-green-100",
      statusText: "text-green-700",
    },
    {
      title: "Lost in Rhythm",
      artist: "Movement Creations",
      status: "Pending",
      statusBg: "bg-violet-100",
      statusText: "text-violet-700",
    },
    {
      title: "Sunset Vibes",
      artist: "Movement Creations",
      status: "Review",
      statusBg: "bg-amber-100",
      statusText: "text-amber-700",
    },
  ];

  return (
    <LinearGradient
      colors={["#F5EEFF", "#F8F8FC", "#FFFFFF"]}
      style={{ flex: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
            paddingTop: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-lg">
                <Text className="text-xl font-bold text-white">MC</Text>
              </View>

              <View>
                <Text className="text-2xl font-bold text-gray-900 md:text-3xl">
                  Dashboard
                </Text>

                <Text className="mt-1 text-sm text-gray-500 md:text-base">
                  Movement Creations Studio
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              className="h-11 w-11 items-center justify-center rounded-xl border border-violet-100 bg-white shadow"
            >
              <Feather name="log-out" size={19} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          <View className="mt-8 rounded-3xl bg-white p-6 shadow-lg md:p-8">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
                <MaterialIcons name="library-music" size={24} color="#7C3AED" />
              </View>

              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900 md:text-2xl">
                  Welcome back
                </Text>

                <Text className="mt-1 text-gray-500 md:text-base">
                  Here's an overview of your music distribution.
                </Text>
              </View>
            </View>

            <TouchableOpacity className="mt-6 flex-row items-center justify-center rounded-xl bg-violet-600 py-4 shadow md:py-5">
              <Feather name="upload-cloud" size={20} color="#FFFFFF" />

              <Text className="ml-2 text-lg font-bold text-white md:text-xl">
                Upload New Release
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8 flex-row flex-wrap justify-between gap-2">
            {stats.map((item) => (
              <View
                key={item.title}
                className="mb-4 w-[48%] rounded-2xl border border-violet-50 bg-white p-5 shadow"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                  <Feather name={item.icon} size={18} color="#7C3AED" />
                </View>

                <Text className="mt-4 text-gray-500">{item.title}</Text>

                <Text className="mt-1 text-2xl font-bold text-gray-900">
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          <View className="mt-2 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Text className="text-xl font-bold text-gray-900 md:text-2xl">
              Recent Releases
            </Text>

            <TouchableOpacity>
              <Text className="font-semibold text-violet-600">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-4 space-y-4">
            {releases.map((release) => (
              <View
                key={release.title}
                className="rounded-2xl border border-violet-50 bg-white p-5 shadow md:p-6"
              >
                <View className="flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <View className="flex-1 pr-0 md:pr-4">
                    <Text className="text-lg font-bold text-gray-900 md:text-xl">
                      {release.title}
                    </Text>

                    <Text className="mt-1 text-gray-500">{release.artist}</Text>
                  </View>

                  <View
                    className={`rounded-full px-3 py-1 ${release.statusBg}`}
                  >
                    <Text
                      className={`text-sm font-semibold ${release.statusText}`}
                    >
                      {release.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity className="mt-2 flex-row items-center justify-center rounded-xl border border-gray-300 bg-white py-4 shadow md:py-5">
            <Feather name="bar-chart-2" size={20} color="#666" />

            <Text className="ml-2 text-lg font-semibold text-gray-700 md:text-xl">
              View Analytics
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
