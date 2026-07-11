import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const releases = [
  {
    id: "1",
    title: "Midnight Echoes",
    type: "audio",
    status: "Live",
    date: "Oct 12, 2024",
    artwork: "https://picsum.photos/200",
  },
  {
    id: "2",
    title: "Summer Vibes",
    type: "video",
    status: "Processing",
    date: "Sep 24, 2024",
    artwork: "https://picsum.photos/201",
  },
  {
    id: "3",
    title: "Morning Alarm",
    type: "ringtone",
    status: "Draft",
    date: "Aug 11, 2024",
    artwork: "https://picsum.photos/202",
  },
];

const filters = ["All", "Audio", "Video", "Ringtone"];

export default function ReleaseScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const data = useMemo(() => {
    return releases.filter((item) => {
      const matchType =
        activeFilter === "All" || item.type === activeFilter.toLowerCase();

      const matchSearch = item.title
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchType && matchSearch;
    });
  }, [activeFilter, search]);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7FC] px-5">
      {/* Header */}
      <View className="mt-3">
        <Text className="text-4xl font-bold text-gray-900">Releases</Text>

        <Text className="mt-2 text-gray-500">
          Manage all your published releases
        </Text>
      </View>

      {/* Search */}
      <View className="mt-6 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 h-14">
        <Ionicons name="search" size={20} color="#9CA3AF" />

        <TextInput
          placeholder="Search releases..."
          value={search}
          onChangeText={setSearch}
          className="ml-3 flex-1 text-base"
        />
      </View>

      {/* Filters */}
      <View className="mt-5 flex-row justify-between">
        {filters.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setActiveFilter(item)}
            className={`rounded-full px-5 py-3 ${
              activeFilter === item ? "bg-violet-600" : "bg-white"
            }`}
          >
            <Text
              className={`font-semibold ${
                activeFilter === item ? "text-white" : "text-gray-700"
              }`}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        className="mt-6"
        showsVerticalScrollIndicator={false}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity className="mb-4 flex-row rounded-3xl bg-white p-4 shadow-sm">
            <Image
              source={{ uri: item.artwork }}
              className="h-20 w-20 rounded-2xl"
            />

            <View className="ml-4 flex-1 justify-center">
              <Text className="text-lg font-bold text-gray-900">
                {item.title}
              </Text>

              <Text className="mt-1 text-gray-500">
                {item.type.toUpperCase()} • {item.date}
              </Text>

              <View
                className={`mt-3 self-start rounded-full px-3 py-1 ${
                  item.status === "Live"
                    ? "bg-green-100"
                    : item.status === "Processing"
                      ? "bg-yellow-100"
                      : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    item.status === "Live"
                      ? "text-green-700"
                      : item.status === "Processing"
                        ? "text-yellow-700"
                        : "text-gray-700"
                  }`}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#A1A1AA" />
          </TouchableOpacity>
        )}
      />

      {/* Floating Button */}
      <TouchableOpacity className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full bg-violet-600 shadow-lg">
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
