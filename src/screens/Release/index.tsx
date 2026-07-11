import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Disc,
  Film,
  LayoutGrid,
  List as ListIcon,
  Music,
  Pencil,
  PhoneOutgoing,
  Search,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";

/* ─────────────────────────────────────────
   TYPES + STATIC DATA
   Replace this array with your real fetch
   (e.g. GET /api/submissions) whenever the
   backend is wired up on mobile.
───────────────────────────────────────── */

type ReleaseType = "audio"  | "ringtone";

interface Release {
  id: string;
  title: string;
  release_type: ReleaseType;
  primary_artist: string;
  status: "Live" | "Draft" | "Review" | "Rejected";
  cover_url: string;
  date: string;
  label?: string;
  isrc?: string;
}

const STATIC_RELEASES: Release[] = [
  { id: "1", title: "Midnight Echoes", release_type: "audio", primary_artist: "Nova Reyes", status: "Live", cover_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80", date: "Oct 12, 2024", label: "Movement Creations", isrc: "INMC42400001" },
  { id: "2", title: "Summer Vibes", release_type: "ringtone", primary_artist: "DJ Kairo", status: "Draft", cover_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80", date: "Sep 24, 2024", label: "Movement Creations" },
  { id: "3", title: "Morning Alarm", release_type: "ringtone", primary_artist: "Nova Reyes", status: "Review", cover_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80", date: "Aug 11, 2024" },
//   { id: "4", title: "Neon Skyline", release_type: "video", primary_artist: "TUNERAAGA", status: "Live", cover_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80", date: "Jul 30, 2024", isrc: "INMC42400004" },
  { id: "5", title: "Silent Static", release_type: "audio", primary_artist: "Nova Reyes", status: "Rejected", cover_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80", date: "Jul 02, 2024" },
  { id: "6", title: "Golden Hour", release_type: "audio", primary_artist: "Ari Vale", status: "Live", cover_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80", date: "Jun 18, 2024" },
//   { id: "7", title: "City Lights", release_type: "video", primary_artist: "TUNERAAGA", status: "Draft", cover_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80", date: "May 27, 2024" },
  { id: "8", title: "Wave Rider", release_type: "ringtone", primary_artist: "DJ Kairo", status: "Live", cover_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80", date: "May 02, 2024" },
];

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
  const [releases, setReleases] = useState<Release[]>(STATIC_RELEASES);
  const [viewingRelease, setViewingRelease] = useState<Release | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  /* ── same filtering logic as web ── */
  const filteredReleases = useMemo(() => {
    let result = releases;
    if (activeTab !== "all") {
      result = result.filter((r) => r.release_type === activeTab);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.primary_artist.toLowerCase().includes(term)
      );
    }
    return result;
  }, [releases, activeTab, searchTerm]);

  /* ── same pagination logic as web ── */
  const totalCount = filteredReleases.length;
  const maxPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginatedReleases = filteredReleases.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
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
          onPress: () => {
            setReleases((prev) => prev.filter((r) => r.id !== release.id));
          },
        },
      ]
    );
  };

  const handleCreate = (type: ReleaseType) => {
    Alert.alert(
      `New ${type} release`,
      "Hook this up to your form screen when it's ready."
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 170 }}
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
              onPress={() => handleCreate("audio")}
            />
          
            <CreateActionCard
              title="New Ringtone"
              description="Ringtones for mobile"
              icon={Bell}
              count={counts.ringtone}
              colors={["#10b981", "#14b8a6", "#06b6d4"]}
              onPress={() => handleCreate("ringtone")}
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
                  <LayoutGrid size={16} color={viewMode === "grid" ? "#fff" : "#94a3b8"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-slate-900" : "bg-slate-50"}`}
                >
                  <ListIcon size={16} color={viewMode === "list" ? "#fff" : "#94a3b8"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* List / grid */}
            <View className="p-4">
              {filteredReleases.length === 0 ? (
                <View className="items-center justify-center py-16 gap-2">
                  <Music size={36} color="#cbd5e1" />
                  <Text className="font-medium text-slate-500">No releases found</Text>
                  <Text className="text-sm text-slate-400">
                    {searchTerm ? "Try a different search term" : "Create your first release above"}
                  </Text>
                  {!!searchTerm && (
                    <TouchableOpacity onPress={() => setSearchTerm("")} className="mt-1">
                      <Text style={{ color: ACCENT }} className="text-sm font-medium">
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
              {totalCount > PAGE_SIZE && (
                <View className="mt-5 pt-4 border-t border-slate-100 flex-row items-center justify-between">
                  <Text className="text-sm text-slate-400">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
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

      {/* ── DETAILS MODAL ── */}
      <ReleaseViewModal
        release={viewingRelease}
        visible={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   SUBCOMPONENTS
───────────────────────────────────────── */

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
    <TouchableOpacity onPress={onPress} className="flex-1 min-w-[47%]" activeOpacity={0.85}>
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
      <Text style={{ color: ACCENT }} className="text-xs font-semibold capitalize">
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
      <Image source={{ uri: release.cover_url }} className="h-14 w-14 rounded-lg" />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text numberOfLines={1} className="text-slate-900 font-semibold flex-1 pr-2">
            {release.title}
          </Text>
          <StatusBadge status={release.status} />
        </View>
        <Text className="text-slate-500 text-sm mt-0.5">{release.primary_artist}</Text>
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
      <Image source={{ uri: release.cover_url }} className="h-28 w-full rounded-lg" />
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

function ReleaseViewModal({
  release,
  visible,
  onClose,
}: {
  release: Release | null;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-2xl max-h-[85%]">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
            <Text className="text-lg font-bold text-slate-900">Release Details</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {release && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Image
                source={{ uri: release.cover_url }}
                className="h-40 w-40 self-center rounded-xl mb-4"
              />
              <Detail label="Title" value={release.title} />
              <Detail label="Primary Artist" value={release.primary_artist} />
              <Detail label="Type" value={release.release_type} />
              <Detail label="Status" value={release.status} />
              <Detail label="Release Date" value={release.date} />
              <Detail label="Label" value={release.label} />
              <Detail label="ISRC" value={release.isrc} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}