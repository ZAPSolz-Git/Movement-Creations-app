import { Ionicons } from "@expo/vector-icons";
import { FlatList, Text, View } from "react-native";

const tracks = [
  {
    id: "1",
    name: "Midnight Dreams",
    artist: "Alex Sound",
    streams: "245,890",
  },
  {
    id: "2",
    name: "Ocean Waves",
    artist: "SoundSync",
    streams: "189,420",
  },
  {
    id: "3",
    name: "Lost Memories",
    artist: "Alex Sound",
    streams: "98,340",
  },
];

export default function TracksScreen() {
  return (
    <View className="flex-1 bg-[#F8F5FF] px-5 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Tracks</Text>

      <Text className="mt-2 text-gray-500">Manage your released music</Text>

      <FlatList
        className="mt-6"
        data={tracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-4 rounded-2xl bg-white p-5">
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Ionicons name="musical-notes" size={24} color="#7C3AED" />
              </View>

              <View className="ml-4">
                <Text className="text-lg font-bold">{item.name}</Text>

                <Text className="text-gray-500">{item.artist}</Text>
              </View>
            </View>

            <View className="mt-4 flex-row justify-between">
              <Text className="text-gray-500">Streams</Text>

              <Text className="font-bold text-purple-600">{item.streams}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
