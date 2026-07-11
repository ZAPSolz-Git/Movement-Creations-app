import { LinearGradient } from "expo-linear-gradient";
import {
  AlertCircle,
  Award,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Disc3,
  Eye,
  FileText,
  Globe,
  Info,
  Mail,
  Pencil,
  Search,
  ShieldCheck,
  Tag,
  User,
  X,
  XCircle,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Image, Linking, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";

/* ─────────────────────────────────────────
   TYPES + STATIC DATA
   Replace with GET /api/submissions/search
   and GET /api/claims/user/:id once wired up.
───────────────────────────────────────── */

type ClaimStatus = "pending" | "approved" | "rejected";

interface ReleaseRights {
  id: string;
  title: string;
  primary_artist: string;
  featuring_artists?: string;
  label_name?: string;
  status: string;
  cover_url?: string;
  release_type: string;
  release_date: string;
  genre?: string;
  upc_ean?: string;
  userFullName?: string;
  userEmail?: string;
  distribution_platforms?: string[];
  distribution_territories?: string[];
  rightsHolder: string;
  publisher: string;
  territories: string;
  notes: string;
  mechanicalRights: boolean;
  performanceRights: boolean;
  synchronizationRights: boolean;
}

interface Claim {
  id: string;
  release_title: string;
  claim_type: "Audio" | "Video" | "Ringtone";
  request_type: string;
  platforms: string[];
  content_links: string[];
  created_at: string;
  status: ClaimStatus;
}

const STATIC_RELEASES: ReleaseRights[] = [
  {
    id: "1",
    title: "Midnight Echoes",
    primary_artist: "Nova Reyes",
    featuring_artists: "Ari Vale",
    label_name: "Movement Creations",
    status: "approved",
    cover_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80",
    release_type: "Audio",
    release_date: "2026-06-02",
    genre: "Electronic",
    upc_ean: "INMC42400001",
    userFullName: "Zap M.",
    userEmail: "zap@movementcreations.in",
    distribution_platforms: ["Spotify", "Apple Music", "Amazon Music"],
    distribution_territories: ["US", "UK", "India", "Canada"],
    rightsHolder: "Movement Creations",
    publisher: "MC Publishing",
    territories: "US, UK, India, Canada",
    notes: "Fetched from submission by Nova Reyes.",
    mechanicalRights: true,
    performanceRights: true,
    synchronizationRights: false,
  },
  {
    id: "2",
    title: "Neon Skyline",
    primary_artist: "TUNERAAGA",
    label_name: "Movement Creations",
    status: "approved",
    cover_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    release_type: "Video",
    release_date: "2026-05-18",
    genre: "Pop",
    upc_ean: "INMC42400004",
    userFullName: "Zap M.",
    userEmail: "zap@movementcreations.in",
    distribution_platforms: ["YouTube", "Spotify"],
    distribution_territories: ["Worldwide"],
    rightsHolder: "TUNERAAGA",
    publisher: "N/A",
    territories: "Worldwide",
    notes: "Fetched from submission by TUNERAAGA.",
    mechanicalRights: true,
    performanceRights: true,
    synchronizationRights: true,
  },
];

const STATIC_CLAIMS: Claim[] = [
  {
    id: "c1",
    release_title: "Midnight Echoes",
    claim_type: "Audio",
    request_type: "Ownership Conflict",
    platforms: ["YouTube", "Spotify"],
    content_links: ["https://youtube.com/watch?v=abc123"],
    created_at: "2026-07-01",
    status: "pending",
  },
  {
    id: "c2",
    release_title: "Neon Skyline",
    claim_type: "Video",
    request_type: "Claim UGC Video: Monetize",
    platforms: ["YouTube"],
    content_links: ["https://youtube.com/watch?v=def456", "https://youtube.com/watch?v=ghi789"],
    created_at: "2026-06-20",
    status: "approved",
  },
  {
    id: "c3",
    release_title: "Golden Hour",
    claim_type: "Audio",
    request_type: "Disputed Claims",
    platforms: ["Apple Music"],
    content_links: [],
    created_at: "2026-06-05",
    status: "rejected",
  },
  {
    id: "c4",
    release_title: "Wave Rider",
    claim_type: "Ringtone",
    request_type: "Strike",
    platforms: ["YouTube"],
    content_links: ["https://youtube.com/watch?v=jkl012"],
    created_at: "2026-05-11",
    status: "pending",
  },
];

const CLAIM_TYPE_OPTIONS = ["All Types", "Audio", "Video", "Ringtone"];
const STATUS_OPTIONS: { label: string; value: "all" | ClaimStatus }[] = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];
const REQUEST_TYPE_OPTIONS = [
  "All",
  "Ownership Conflict",
  "Reference Overlap",
  "Disputed Claims",
  "Appealed Claims",
  "Art Track Removal",
  "Strike",
  "Takedown Video",
  "Claim UGC Video: Block",
  "Release Claim",
  "Allow List a Channel",
  "Outgoing Legal Claim",
  "Claim UGC Video: Monetize",
];

const STATUS_STYLES: Record<ClaimStatus, { bg: string; text: string; icon: any; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-600", icon: Clock, label: "Pending" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2, label: "Approved" },
  rejected: { bg: "bg-red-50", text: "text-red-600", icon: XCircle, label: "Rejected" },
};

export default function RightsManagementPage() {
  const [activeMainTab, setActiveMainTab] = useState<"rights" | "history">("rights");

  return (
    <LinearGradient colors={["#F5F3FF", "#F8F8FC", "#FFFFFF"]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 170 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── HEADER ── */}
            <View className="flex-row items-center gap-2">
              <View className="w-9 h-9 rounded-xl items-center justify-center bg-indigo-600">
                <ShieldCheck size={18} color="#fff" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-slate-900">Rights Management</Text>
                <Text className="text-sm text-slate-400 mt-0.5">Manage and track music rights for your releases.</Text>
              </View>
            </View>

        

            {/* ── TABS ── */}
            <View className="flex-row bg-white border border-slate-200 rounded-xl p-1 mt-5 gap-1">
              <TabButton
                active={activeMainTab === "rights"}
                icon={ShieldCheck}
                label="Rights Management"
                onPress={() => setActiveMainTab("rights")}
              />
              <TabButton
                active={activeMainTab === "history"}
                icon={FileText}
                label={`Claims History  ${STATIC_CLAIMS.length}`}
                onPress={() => setActiveMainTab("history")}
              />
            </View>

            {activeMainTab === "rights" ? <RightsTab /> : <HistoryTab />}
          </ScrollView>

          <Footer />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────
   RIGHTS TAB
───────────────────────────────────────── */

function RightsTab() {
  const [searchTitle, setSearchTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [releaseRights, setReleaseRights] = useState<ReleaseRights | null>(null);
  const [searchError, setSearchError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updated, setUpdated] = useState({ rightsHolder: "", publisher: "", territories: "", notes: "" });
  const [viewingRelease, setViewingRelease] = useState<ReleaseRights | null>(null);

  const handleSearch = () => {
    if (!searchTitle.trim() && !artistName.trim()) {
      setSearchError("Please enter a release title or artist name.");
      return;
    }
    const found = STATIC_RELEASES.find(
      (r) =>
        (searchTitle.trim() && r.title.toLowerCase().includes(searchTitle.toLowerCase().trim())) ||
        (artistName.trim() && r.primary_artist.toLowerCase().includes(artistName.toLowerCase().trim()))
    );
    if (!found) {
      setSearchError("No approved release found. Try a different title or artist.");
      setReleaseRights(null);
      return;
    }
    setSearchError("");
    setReleaseRights(found);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (!releaseRights) return;
    setUpdated({
      rightsHolder: releaseRights.rightsHolder,
      publisher: releaseRights.publisher,
      territories: releaseRights.territories,
      notes: releaseRights.notes,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!releaseRights) return;
    setReleaseRights({ ...releaseRights, ...updated });
    setIsEditing(false);
  };

  return (
    <View>
      {/* Search card */}
      <View className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-7 h-7 rounded-lg bg-pink-100 items-center justify-center">
            <Search size={13} color="#db2777" />
          </View>
          <Text className="text-sm font-bold text-slate-700">Search Release Rights</Text>
        </View>

        <FieldLabel>Release Title or UPC</FieldLabel>
        <TextInput
          value={searchTitle}
          onChangeText={setSearchTitle}
          placeholder="Enter title or UPC…"
          placeholderTextColor="#cbd5e1"
          className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 mb-3"
        />
        <FieldLabel>Artist Name</FieldLabel>
        <TextInput
          value={artistName}
          onChangeText={setArtistName}
          placeholder="Enter artist name…"
          placeholderTextColor="#cbd5e1"
          className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 mb-3"
        />

        {!!searchError && (
          <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-3">
            <AlertCircle size={15} color="#dc2626" />
            <Text className="text-sm text-red-600 flex-1">{searchError}</Text>
          </View>
        )}

        <TouchableOpacity onPress={handleSearch} activeOpacity={0.85} className="self-end">
          <LinearGradient
            colors={["#ec4899", "#f97316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <View className="flex-row items-center gap-2">
              <Search size={14} color="#fff" />
              <Text className="text-white text-sm font-semibold">Find Rights Info</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Rights details card */}
      {releaseRights && (
        <View className="mt-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2 flex-1">
              <View className="w-7 h-7 rounded-lg bg-indigo-100 items-center justify-center">
                <ShieldCheck size={13} color="#4f46e5" />
              </View>
              <Text numberOfLines={1} className="text-sm font-bold text-slate-700 flex-1">
                Rights Details · <Text className="text-indigo-600">{releaseRights.title}</Text>
              </Text>
            </View>
            <StatusBadge status={releaseRights.status as ClaimStatus} />
          </View>

          {/* Release info grid */}
          <View className="flex-row flex-wrap gap-3 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl mb-4">
            <InfoChip icon={User} label="Primary Artist" value={releaseRights.primary_artist} />
            {!!releaseRights.featuring_artists && (
              <InfoChip icon={Award} label="Featuring" value={releaseRights.featuring_artists} />
            )}
            <InfoChip icon={Building} label="Label" value={releaseRights.label_name} />
            <InfoChip icon={Mail} label="Submitted By" value={releaseRights.userFullName} />
          </View>

          {/* Rights type checkboxes */}
          <View className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4">
            <FieldLabel>Managed Rights Types</FieldLabel>
            <View className="flex-row flex-wrap gap-4 mt-1">
              <RightsCheck label="Mechanical Rights" checked={releaseRights.mechanicalRights} />
              <RightsCheck label="Performance Rights" checked={releaseRights.performanceRights} />
              <RightsCheck label="Synchronization Rights" checked={releaseRights.synchronizationRights} />
            </View>
          </View>

          {/* Editable fields */}
          <EditableField
            label="Rights Holder"
            value={isEditing ? updated.rightsHolder : releaseRights.rightsHolder}
            isEditing={isEditing}
            onChange={(v) => setUpdated((u) => ({ ...u, rightsHolder: v }))}
          />
          <EditableField
            label="Publisher"
            value={isEditing ? updated.publisher : releaseRights.publisher}
            isEditing={isEditing}
            onChange={(v) => setUpdated((u) => ({ ...u, publisher: v }))}
          />
          <EditableField
            label="Territories"
            value={isEditing ? updated.territories : releaseRights.territories}
            isEditing={isEditing}
            onChange={(v) => setUpdated((u) => ({ ...u, territories: v }))}
          />
          <FieldLabel>Rights Notes</FieldLabel>
          <TextInput
            value={isEditing ? updated.notes : releaseRights.notes}
            onChangeText={(v) => setUpdated((u) => ({ ...u, notes: v }))}
            editable={isEditing}
            multiline
            numberOfLines={3}
            className={`rounded-lg px-3 py-2.5 text-sm mb-4 ${
              isEditing ? "bg-white border border-indigo-400 text-slate-800" : "bg-slate-50 border border-slate-200 text-slate-700"
            }`}
            style={{ textAlignVertical: "top", minHeight: 70 }}
          />

          {/* Actions */}
          <View className="flex-row flex-wrap justify-end gap-2">
            <TouchableOpacity
              onPress={() => setViewingRelease(releaseRights)}
              className="flex-row items-center gap-1.5 border border-indigo-200 bg-indigo-50 rounded-lg px-3 py-2"
            >
              <Eye size={14} color="#4f46e5" />
              <Text className="text-indigo-600 text-xs font-semibold">View Full Details</Text>
            </TouchableOpacity>

            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  className="border border-slate-200 rounded-lg px-3 py-2"
                >
                  <Text className="text-slate-600 text-xs font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
                  <LinearGradient
                    colors={["#4f46e5", "#7c3aed"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <View className="flex-row items-center gap-1.5">
                      <CheckCircle2 size={14} color="#fff" />
                      <Text className="text-white text-xs font-semibold">Save Changes</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={handleEditClick} activeOpacity={0.85}>
                <LinearGradient
                  colors={["#4f46e5", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <View className="flex-row items-center gap-1.5">
                    <Pencil size={14} color="#fff" />
                    <Text className="text-white text-xs font-semibold">Edit Rights</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Details modal */}
      <ReleaseDetailsModal release={viewingRelease} onClose={() => setViewingRelease(null)} />
    </View>
  );
}

/* ─────────────────────────────────────────
   HISTORY TAB
───────────────────────────────────────── */

function HistoryTab() {
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState<"all" | ClaimStatus>("all");
  const [filterRequestType, setFilterRequestType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [requestPickerOpen, setRequestPickerOpen] = useState(false);

  const filteredClaims = useMemo(() => {
    let list = STATIC_CLAIMS;
    if (filterType !== "All Types") list = list.filter((c) => c.claim_type === filterType);
    if (filterRequestType !== "All") list = list.filter((c) => c.request_type === filterRequestType);
    if (filterStatus !== "all") list = list.filter((c) => c.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) => c.release_title.toLowerCase().includes(q) || c.request_type.toLowerCase().includes(q) || c.claim_type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filterType, filterRequestType, filterStatus, searchQuery]);

  const hasActiveFilters = filterType !== "All Types" || filterStatus !== "all" || filterRequestType !== "All" || !!searchQuery.trim();

  const clearFilters = () => {
    setFilterType("All Types");
    setFilterStatus("all");
    setFilterRequestType("All");
    setSearchQuery("");
  };

  return (
    <View>
      {/* Filters card */}
      <View className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <View className="flex-row gap-2 mb-2">
          <SelectField label="Claim Type" value={filterType} onPress={() => setTypePickerOpen(true)} />
          <SelectField
            label="Status"
            value={STATUS_OPTIONS.find((s) => s.value === filterStatus)?.label || "All"}
            onPress={() => setStatusPickerOpen(true)}
          />
        </View>
        <SelectField label="Request Type" value={filterRequestType} onPress={() => setRequestPickerOpen(true)} />

        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-lg px-3 mt-3">
          <Search size={13} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by title or type…"
            placeholderTextColor="#94a3b8"
            className="flex-1 py-2.5 px-2 text-sm text-slate-700"
          />
        </View>

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-xs text-slate-400">
            {filteredClaims.length} result{filteredClaims.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " (filtered)" : ""}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters} className="flex-row items-center gap-1">
              <X size={12} color="#f87171" />
              <Text className="text-xs text-red-400 font-medium">Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Claims list */}
      <View className="mt-4 gap-2.5">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => <ClaimCard key={claim.id} claim={claim} />)
        ) : (
          <View className="items-center justify-center py-14 bg-white border border-slate-200 rounded-2xl gap-2">
            <View className="w-14 h-14 rounded-2xl bg-slate-100 items-center justify-center">
              <FileText size={26} color="#cbd5e1" />
            </View>
            <Text className="text-sm font-medium text-slate-500">No claims found</Text>
            <Text className="text-xs text-slate-400">
              {hasActiveFilters ? "Try adjusting your filters." : "Submit a claim to see history here."}
            </Text>
          </View>
        )}
      </View>

      <PickerModal
        visible={typePickerOpen}
        title="Claim Type"
        options={CLAIM_TYPE_OPTIONS}
        selected={filterType}
        onSelect={setFilterType}
        onClose={() => setTypePickerOpen(false)}
      />
      <PickerModal
        visible={statusPickerOpen}
        title="Status"
        options={STATUS_OPTIONS.map((s) => s.label)}
        selected={STATUS_OPTIONS.find((s) => s.value === filterStatus)?.label || "All"}
        onSelect={(label) => setFilterStatus(STATUS_OPTIONS.find((s) => s.label === label)?.value || "all")}
        onClose={() => setStatusPickerOpen(false)}
      />
      <PickerModal
        visible={requestPickerOpen}
        title="Request Type"
        options={REQUEST_TYPE_OPTIONS}
        selected={filterRequestType}
        onSelect={setFilterRequestType}
        onClose={() => setRequestPickerOpen(false)}
      />
    </View>
  );
}

/* ─────────────────────────────────────────
   SHARED SUBCOMPONENTS
───────────────────────────────────────── */

function TabButton({ active, icon: Icon, label, onPress }: { active: boolean; icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg ${active ? "bg-indigo-600" : ""}`}
    >
      <Icon size={14} color={active ? "#fff" : "#64748b"} />
      <Text numberOfLines={1} className={`text-xs font-semibold ${active ? "text-white" : "text-slate-500"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{children}</Text>;
}

function InfoChip({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="flex-row items-center gap-2 min-w-[45%]">
      <Icon size={14} color="#6366f1" />
      <View>
        <Text className="text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</Text>
        <Text className="text-sm font-semibold text-slate-800">{value}</Text>
      </View>
    </View>
  );
}

function RightsCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={`w-4 h-4 rounded items-center justify-center ${checked ? "bg-indigo-600" : "border border-slate-300"}`}>
        {checked && <Check size={11} color="#fff" />}
      </View>
      <Text className={`text-sm ${checked ? "text-slate-700 font-medium" : "text-slate-400"}`}>{label}</Text>
    </View>
  );
}

function EditableField({
  label,
  value,
  isEditing,
  onChange,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-3">
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={isEditing}
        className={`rounded-lg px-3 py-2.5 text-sm ${
          isEditing ? "bg-white border border-indigo-400 text-slate-800" : "bg-slate-50 border border-slate-200 text-slate-700"
        }`}
      />
    </View>
  );
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const Icon = s.icon;
  return (
    <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${s.bg}`}>
      <Icon size={11} color={s.text.includes("emerald") ? "#059669" : s.text.includes("amber") ? "#d97706" : "#dc2626"} />
      <Text className={`text-[11px] font-bold ${s.text}`}>{s.label}</Text>
    </View>
  );
}

function SelectField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-1 mb-2">
      <FieldLabel>{label}</FieldLabel>
      <View className="flex-row items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2.5">
        <Text numberOfLines={1} className="text-xs text-slate-700 font-medium flex-1">
          {value}
        </Text>
        <ChevronDown size={14} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-2xl max-h-[70%]">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
            <Text className="text-base font-bold text-slate-900">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                className={`px-4 py-3 rounded-lg mb-1 ${selected === opt ? "bg-indigo-50" : ""}`}
              >
                <Text className={`text-sm ${selected === opt ? "text-indigo-600 font-semibold" : "text-slate-700"}`}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ClaimCard({ claim }: { claim: Claim }) {
  const dateLabel = new Date(claim.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  return (
    <View className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
      <View className="flex-row items-start justify-between mb-2">
        <Text numberOfLines={1} className="text-sm font-semibold text-slate-800 flex-1 pr-2">
          {claim.release_title}
        </Text>
        <StatusBadge status={claim.status} />
      </View>

      <View className="flex-row flex-wrap gap-1.5 mb-2">
        <View className="bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
          <Text className="text-[10px] font-bold text-orange-600">{claim.claim_type}</Text>
        </View>
        {claim.platforms.map((p) => (
          <View key={p} className="bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
            <Text className="text-[10px] text-slate-600">{p}</Text>
          </View>
        ))}
      </View>

      <Text className="text-xs text-slate-500 mb-1">{claim.request_type}</Text>

      {claim.content_links.length > 0 && (
        <View className="mb-1">
          {claim.content_links.map((link, i) => (
            <TouchableOpacity key={i} onPress={() => Linking.openURL(link)}>
              <Text numberOfLines={1} className="text-xs text-indigo-500">
                {link}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text className="text-[11px] text-slate-400 mt-1">{dateLabel}</Text>
    </View>
  );
}

function DetailPill({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="w-[47%] p-3 rounded-xl bg-slate-50 border border-slate-200 mb-2">
      <View className="flex-row items-center gap-1 mb-1">
        <Icon size={11} color="#818cf8" />
        <Text className="text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</Text>
      </View>
      <Text className="text-xs font-semibold text-slate-800">{value}</Text>
    </View>
  );
}

function ReleaseDetailsModal({ release, onClose }: { release: ReleaseRights | null; onClose: () => void }) {
  return (
    <Modal visible={!!release} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-2xl max-h-[88%]">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
            <Text className="text-base font-bold text-slate-900">Release Details</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {release && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Cover hero */}
              <View className="flex-row items-end gap-3 mb-4">
                <View className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                  {release.cover_url ? (
                    <Image source={{ uri: release.cover_url }} className="w-full h-full" />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Disc3 size={22} color="#cbd5e1" />
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900">{release.title}</Text>
                  <Text className="text-sm text-pink-500 font-semibold">{release.primary_artist}</Text>
                  {!!release.userFullName && (
                    <Text className="text-xs text-slate-400 mt-0.5">Submitted by: {release.userFullName}</Text>
                  )}
                </View>
              </View>

              {/* Details grid */}
              <View className="flex-row flex-wrap justify-between">
                <DetailPill icon={User} label="Featuring" value={release.featuring_artists} />
                <DetailPill icon={Tag} label="Type" value={release.release_type} />
                <DetailPill
                  icon={Calendar}
                  label="Release Date"
                  value={release.release_date ? new Date(release.release_date).toLocaleDateString() : null}
                />
                <DetailPill icon={Tag} label="Status" value={release.status} />
                <DetailPill icon={Disc3} label="Genre" value={release.genre} />
                <DetailPill icon={Info} label="UPC / EAN" value={release.upc_ean} />
                <DetailPill icon={Building} label="Label" value={release.label_name} />
                <DetailPill icon={Mail} label="Email" value={release.userEmail} />
              </View>

              {/* Distribution */}
              {(release.distribution_platforms?.length || release.distribution_territories?.length) ? (
                <View className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mt-1">
                  <View className="flex-row items-center gap-1 mb-2">
                    <Globe size={12} color="#10b981" />
                    <Text className="text-[9px] font-black uppercase tracking-wide text-slate-400">Distribution</Text>
                  </View>
                  <View className="flex-row flex-wrap gap-1.5 mb-2">
                    {release.distribution_platforms?.map((p) => (
                      <View key={p} className="bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        <Text className="text-[11px] font-semibold text-emerald-700">{p}</Text>
                      </View>
                    ))}
                  </View>
                  {!!release.distribution_territories?.length && (
                    <Text className="text-xs text-slate-600">
                      <Text className="font-semibold text-slate-500">Territories: </Text>
                      {release.distribution_territories.join(", ")}
                    </Text>
                  )}
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}