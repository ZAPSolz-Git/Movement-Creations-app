import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Disc,
  LayoutGrid,
  List as ListIcon,
  Music,
  Pencil,
  PhoneOutgoing,
  Search,
  Sparkles,
  Trash2
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";
import { Modal } from "react-native";
import ReleaseViewModal from "@/components/ReleaseViewModal";
import { Release, ReleaseType, useReleasesData } from "@/hooks/useReleaseData";
import { apiClient } from "../../lib/apiClient"; // ⚠️ adjust path if needed

const PAGE_SIZE = 5;
const ACCENT = "#ec5b13";

const TAB_CONFIG: { value: "all" | ReleaseType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "audio", label: "Audio" },
  { value: "ringtone", label: "Ringtone" },
];

const STATUS_STYLES: Record<Release["status"], { bg: string; text: string }> = {
  Live: { bg: "bg-green-100", text: "text-green-700" },
  Draft: { bg: "bg-slate-100", text: "text-slate-600" },
  Review: { bg: "bg-amber-100", text: "text-amber-700" },
  Rejected: { bg: "bg-red-100", text: "text-red-700" },
};

const TYPE_ICON: Record<ReleaseType, any> = {
  audio: Music,
  ringtone: PhoneOutgoing,
};

export default function ReleasePage() {
  const [activeTab, setActiveTab] = useState<"all" | ReleaseType>("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [viewingRelease, setViewingRelease] = useState<Release | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
const [loginPromptType, setLoginPromptType] = useState<"audio" | "ringtone">("audio");
  /* ── live data from backend ── */
  const { releases, loading, error, refetch } = useReleasesData(activeTab);

  /* ── search filter only (type filtering already done server-side) ── */
  const filteredReleases = useMemo(() => {
    let result = releases;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.primary_artist.toLowerCase().includes(term),
      );
    }
    return result;
  }, [releases, searchTerm]);

  /* ── same pagination logic as before ── */
  const totalCount = filteredReleases.length;
  const maxPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginatedReleases = filteredReleases.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const counts = {
    audio: releases.filter((r) => r.release_type === "audio").length,
    ringtone: releases.filter((r) => r.release_type === "ringtone").length,
  };

  const handleTabPress = (tab: "all" | ReleaseType) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleViewDetails = (release: Release) => {
    setViewingRelease(release);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = (release: Release) => {
    Alert.alert(
      "Delete release?",
      `"${release.title}" will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/api/submissions/${release.id}`); // ⚠️ confirm this endpoint exists
              refetch();
            } catch (err) {
              console.error("Failed to delete release", err);
              Alert.alert("Error", "Couldn't delete this release. Try again.");
            }
          },
        },
      ],
    );
  };

  const handleCreate = (type: ReleaseType) => {
    Alert.alert(
      `New ${type} release`,
      "Hook this up to your form screen when it's ready.",
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1">
        {/* ambient glows */}
        <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
          <View
            className="absolute rounded-full"
            style={{
              top: -120,
              right: -120,
              width: 320,
              height: 320,
              backgroundColor: `${ACCENT}1A`,
            }}
          />
          <View
            className="absolute rounded-full"
            style={{
              bottom: -120,
              left: -120,
              width: 260,
              height: 260,
              backgroundColor: "#60a5fa1A",
            }}
          />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 170,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View className="flex-row items-center gap-2">
            <View
              className="h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: ACCENT }}
            >
              <Sparkles size={18} color="#fff" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-slate-900">
                Release Management
              </Text>
              <Text className="text-sm text-slate-500 mt-0.5">
                Manage and distribute your music portfolio
              </Text>
            </View>
          </View>

          {/* ── CREATE CARDS ── */}
          <View className="flex-row flex-wrap gap-3 mt-6">
     <CreateActionCard
  title="New Audio"
  description="Singles, EPs, albums"
  icon={Disc}
  count={counts.audio}
  colors={["#f43f5e", "#ec4899", "#9333ea"]}
  onPress={() => {
    setLoginPromptType("audio");
    setLoginPromptVisible(true);
  }}
/>

<CreateActionCard
  title="New Ringtone"
  description="Ringtones for mobile"
  icon={Bell}
  count={counts.ringtone}
  colors={["#10b981", "#14b8a6", "#06b6d4"]}
  onPress={() => {
    setLoginPromptType("ringtone");
    setLoginPromptVisible(true);
  }}
/>
          </View>

          {/* ── PANEL ── */}
          <View className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 12, gap: 4 }}
              className="border-b border-slate-100"
            >
              {TAB_CONFIG.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <TouchableOpacity
                    key={tab.value}
                    onPress={() => handleTabPress(tab.value)}
                    className={`px-4 py-1.5 rounded-md ${
                      isActive ? "bg-slate-900" : "bg-slate-100"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search + view toggle */}
            <View className="flex-row items-center gap-2 px-4 py-3 border-b border-slate-100">
              <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-200 rounded-lg px-3">
                <Search size={16} color="#94a3b8" />
                <TextInput
                  placeholder="Search releases..."
                  placeholderTextColor="#94a3b8"
                  value={searchTerm}
                  onChangeText={(t) => {
                    setSearchTerm(t);
                    setPage(1);
                  }}
                  className="flex-1 py-2 px-2 text-slate-900"
                />
              </View>
              <View className="flex-row border border-slate-200 rounded-lg overflow-hidden">
                <TouchableOpacity
                  onPress={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-slate-900" : "bg-slate-50"}`}
                >
                  <LayoutGrid
                    size={16}
                    color={viewMode === "grid" ? "#fff" : "#94a3b8"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-slate-900" : "bg-slate-50"}`}
                >
                  <ListIcon
                    size={16}
                    color={viewMode === "list" ? "#fff" : "#94a3b8"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* List / grid */}
            <View className="p-4">
              {loading ? (
                <View className="items-center justify-center py-16 gap-2">
                  <ActivityIndicator size="small" color={ACCENT} />
                  <Text className="text-sm text-slate-500">
                    Loading releases…
                  </Text>
                </View>
              ) : error ? (
                <View className="items-center justify-center py-16 gap-2">
                  <Music size={36} color="#cbd5e1" />
                  <Text className="font-medium text-slate-500">
                    Unable to load releases
                  </Text>
                  <Text className="text-sm text-slate-400 text-center">
                    {error}
                  </Text>
                  <TouchableOpacity onPress={refetch} className="mt-1">
                    <Text
                      style={{ color: ACCENT }}
                      className="text-sm font-medium"
                    >
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : filteredReleases.length === 0 ? (
                <View className="items-center justify-center py-16 gap-2">
                  <Music size={36} color="#cbd5e1" />
                  <Text className="font-medium text-slate-500">
                    No releases found
                  </Text>
                  <Text className="text-sm text-slate-400">
                    {searchTerm
                      ? "Try a different search term"
                      : "Create your first release above"}
                  </Text>
                  {!!searchTerm && (
                    <TouchableOpacity
                      onPress={() => setSearchTerm("")}
                      className="mt-1"
                    >
                      <Text
                        style={{ color: ACCENT }}
                        className="text-sm font-medium"
                      >
                        Clear search
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : viewMode === "grid" ? (
                <View className="flex-row flex-wrap gap-3">
                  {paginatedReleases.map((r) => (
                    <ReleaseGridItem
                      key={r.id}
                      release={r}
                      onView={() => handleViewDetails(r)}
                      onDelete={() => handleDelete(r)}
                    />
                  ))}
                </View>
              ) : (
                <View className="gap-2">
                  {paginatedReleases.map((r) => (
                    <ReleaseListItem
                      key={r.id}
                      release={r}
                      onView={() => handleViewDetails(r)}
                      onDelete={() => handleDelete(r)}
                    />
                  ))}
                </View>
              )}

              {/* Pagination */}
              {!loading && !error && totalCount > PAGE_SIZE && (
                <View className="mt-5 pt-4 border-t border-slate-100 flex-row items-center justify-between">
                  <Text className="text-sm text-slate-400">
                    {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={`flex-row items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 ${
                        page === 1 ? "opacity-40" : ""
                      }`}
                    >
                      <ArrowLeft size={14} color="#475569" />
                      <Text className="text-sm text-slate-600">Prev</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setPage((p) => Math.min(maxPages, p + 1))}
                      disabled={page === maxPages}
                      className={`flex-row items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 ${
                        page === maxPages ? "opacity-40" : ""
                      }`}
                    >
                      <Text className="text-sm text-slate-600">Next</Text>
                      <ArrowRight size={14} color="#475569" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <Footer />
      </View>

      <Modal
  visible={loginPromptVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setLoginPromptVisible(false)}
>
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}
  >
    <View
      style={{
        width: "100%",
        maxWidth: 380,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${ACCENT}1A` }}
        >
          <Sparkles size={20} color={ACCENT} />
        </View>
        <TouchableOpacity
          onPress={() => setLoginPromptVisible(false)}
          className="p-1"
        >
        
        </TouchableOpacity>
      </View>

      <Text className="text-lg font-bold text-slate-900 mt-4">
        Log in to continue
      </Text>
      <Text className="text-sm text-slate-500 mt-1.5 leading-5">
        To release your {loginPromptType === "audio" ? "audio" : "ringtone"}, please
        log in to Movement Creations on the website at your desktop                                                                                                     .
      </Text>

      <View className="flex-row gap-2 mt-5">
        <TouchableOpacity
          onPress={() => setLoginPromptVisible(false)}
          className="flex-1 items-center justify-center rounded-xl border border-slate-200 py-3"
        >
          <Text className="text-slate-600 font-medium">Cancel</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  </View>
</Modal>

      {/* ── DETAILS MODAL ── */}
      <ReleaseViewModal
        release={viewingRelease}
        visible={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </SafeAreaView>
  );
}

function CreateActionCard({
  title,
  description,
  icon: Icon,
  count,
  colors,
  onPress,
}: {
  title: string;
  description: string;
  icon: any;
  count: number;
  colors: [string, string, string];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 min-w-[47%]"
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, padding: 14, minHeight: 120 }}
      >
        <View className="flex-row justify-between items-start">
          <Icon size={22} color="#fff" />
          <View className="bg-white/20 rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-semibold">{count}</Text>
          </View>
        </View>
        <Text className="text-white font-bold mt-3">{title}</Text>
        <Text className="text-white/80 text-xs mt-1">{description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function StatusBadge({ status }: { status: Release["status"] }) {
  const s = STATUS_STYLES[status];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${s.bg}`}>
      <Text className={`text-xs font-semibold ${s.text}`}>{status}</Text>
    </View>
  );
}

function TypeBadge({ type }: { type: ReleaseType }) {
  const Icon = TYPE_ICON[type];
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5">
      <Icon size={11} color={ACCENT} />
      <Text
        style={{ color: ACCENT }}
        className="text-xs font-semibold capitalize"
      >
        {type}
      </Text>
    </View>
  );
}

function ReleaseListItem({
  release,
  onView,
  onDelete,
}: {
  release: Release;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onView}
      activeOpacity={0.8}
      className="flex-row items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
    >
      <Image
        source={{ uri: release.cover_url }}
        className="h-14 w-14 rounded-lg"
      />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            numberOfLines={1}
            className="text-slate-900 font-semibold flex-1 pr-2"
          >
            {release.title}
          </Text>
          <StatusBadge status={release.status} />
        </View>
        <Text className="text-slate-500 text-sm mt-0.5">
          {release.primary_artist}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <TypeBadge type={release.release_type} />
          <Text className="text-xs text-slate-400">{release.date}</Text>
        </View>
      </View>
      <View className="gap-2">
        <TouchableOpacity onPress={onView} className="p-1.5">
          <Pencil size={15} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} className="p-1.5">
          <Trash2 size={15} color="#f87171" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ReleaseGridItem({
  release,
  onView,
  onDelete,
}: {
  release: Release;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onView}
      activeOpacity={0.85}
      className="w-[47%] rounded-xl border border-slate-100 bg-slate-50/50 p-3"
    >
      <Image
        source={{ uri: release.cover_url }}
        className="h-28 w-full rounded-lg"
      />
      <Text numberOfLines={1} className="text-slate-900 font-semibold mt-2">
        {release.title}
      </Text>
      <Text numberOfLines={1} className="text-slate-500 text-xs mt-0.5">
        {release.primary_artist}
      </Text>
      <View className="flex-row items-center justify-between mt-2">
        <TypeBadge type={release.release_type} />
        <StatusBadge status={release.status} />
      </View>
      <View className="flex-row justify-end gap-3 mt-2">
        <TouchableOpacity onPress={onView} className="p-1">
          <Pencil size={14} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} className="p-1">
          <Trash2 size={14} color="#f87171" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="mb-3">
      <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
        {label}
      </Text>
      <Text className="text-sm text-slate-800">{value}</Text>
    </View>
  );
}
