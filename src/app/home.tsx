import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const handleLogout = () => {
    router.replace("/");
  };

  const stats = [
    { title: "Songs", value: "24" },
    { title: "Streams", value: "1.2M" },
    { title: "Revenue", value: "$3,420" },
    { title: "Stores", value: "150+" },
  ];

  const releases = [
    {
      title: "Midnight Dreams",
      artist: "Movement Creations",
      status: "Live",
    },
    {
      title: "Lost in Rhythm",
      artist: "Movement Creations",
      status: "Pending",
    },
    {
      title: "Sunset Vibes",
      artist: "Movement Creations",
      status: "Review",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="px-6 pt-16 pb-10">
        {/* Header */}
        <Text className="text-3xl font-bold text-black">Dashboard 🎵</Text>

        <Text className="mt-2 text-gray-500">
          Welcome back! Here's an overview of your music distribution.
        </Text>

        {/* Stats */}
        <View className="mt-8 flex-row flex-wrap justify-between">
          {stats.map((item) => (
            <View
              key={item.title}
              className="mb-4 w-[48%] rounded-2xl bg-white p-5 shadow"
            >
              <Text className="text-gray-500">{item.title}</Text>

              <Text className="mt-2 text-2xl font-bold text-black">
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text className="mt-4 text-xl font-bold text-black">Quick Actions</Text>

        <View className="mt-4">
          <TouchableOpacity className="mb-3 rounded-xl bg-black py-4">
            <Text className="text-center text-lg font-semibold text-white">
              Upload New Release
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="rounded-xl bg-white py-4 shadow">
            <Text className="text-center text-lg font-semibold text-black">
              View Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Releases */}
        <Text className="mt-8 text-xl font-bold text-black">
          Recent Releases
        </Text>

        <View className="mt-4">
          {releases.map((release) => (
            <View
              key={release.title}
              className="mb-4 rounded-2xl bg-white p-5 shadow"
            >
              <Text className="text-lg font-bold text-black">
                {release.title}
              </Text>

              <Text className="mt-1 text-gray-500">{release.artist}</Text>

              <View className="mt-3 self-start rounded-full bg-green-100 px-3 py-1">
                <Text className="font-semibold text-green-700">
                  {release.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="mt-6 rounded-xl bg-red-500 py-4"
        >
          <Text className="text-center text-lg font-semibold text-white">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
