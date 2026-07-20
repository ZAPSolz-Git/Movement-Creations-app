// ReleaseViewModal.tsx
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Globe,
  Info,
  ListMusic,
  Music,
  Pause,
  PhoneOutgoing,
  Play,
  Shield,
  User,
  Video,
  X,
  XCircle,
  
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  LayoutAnimation,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiClient } from "@/lib/apiClient";
// ⚠️ adjust this import to wherever getSubgenreLabel actually lives in the RN app
import { getSubgenreLabel } from "@/lib/genres-subgenres";

const SCREEN_W = Dimensions.get("window").width;

// ── Helpers ──
function formatDuration(secs?: number | null) {
  if (secs === null || secs === undefined) return null;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Status badge (submission status: approved / rejected / pending / draft) ──
const STATUS_MAP: Record<string, { icon: any; bg: string; fg: string; border: string }> = {
  approved: { icon: CheckCircle2, bg: "#ecfdf5", fg: "#047857", border: "#a7f3d0" },
  rejected: { icon: XCircle, bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" },
  pending: { icon: Clock, bg: "#fffbeb", fg: "#92400e", border: "#fde68a" },
  draft: { icon: AlertCircle, bg: "#f1f5f9", fg: "#475569", border: "#cbd5e1" },
};

function StatusBadge({ status }: { status?: string }) {
  const s = STATUS_MAP[status?.toLowerCase() || ""] || STATUS_MAP.draft;
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Draft";
  return (
    <View
      style={{ backgroundColor: s.bg, borderColor: s.border }}
      className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border"
    >
      <s.icon size={11} color={s.fg} />
      <Text style={{ color: s.fg }} className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </Text>
    </View>
  );
}

// ── Section header ──
function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-2.5">
      <Icon size={13} color="#64748b" />
      <Text className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </Text>
      <View className="flex-1 h-px bg-slate-200" />
    </View>
  );
}

// ── Detail pill ──
function DetailPill({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <View className="p-2.5 rounded-xl bg-slate-50 border border-slate-200" style={{ width: "48%" }}>
      <Text className="text-[9px] font-black uppercase tracking-wide text-slate-500 mb-0.5">
        {label}
      </Text>
      <Text
        className={`text-sm font-semibold text-slate-900 ${mono ? "font-mono text-xs" : ""}`}
        numberOfLines={3}
      >
        {display}
      </Text>
    </View>
  );
}

// ── Mini audio player (expo-audio) ──
function MiniAudioPlayer({
  url,
  label,
  accent = "#a78bfa",
}: {
  url: string;
  label?: string;
  accent?: string;
}) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const [barWidth, setBarWidth] = useState(0);

  const toggle = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const seek = (locationX: number) => {
    if (!status.duration || !barWidth) return;
    try {
      const ratio = Math.min(1, Math.max(0, locationX / barWidth));
      player.seekTo(ratio * status.duration);
    } catch {
      // seek target likely isn't buffered yet (remote stream) — ignore and let playback continue
    }
  };

  const progress = status.duration ? (status.currentTime / status.duration) * 100 : 0;

  return (
    <View className="flex-row items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
      <TouchableOpacity
        onPress={toggle}
        style={{
          backgroundColor: status.playing ? accent : "transparent",
          borderColor: accent + "40",
        }}
        className="w-8 h-8 rounded-full border items-center justify-center"
      >
        {!status.isLoaded ? (
          <ActivityIndicator size="small" color={accent} />
        ) : status.playing ? (
          <Pause size={14} color="#fff" />
        ) : (
          <Play size={14} color={accent} />
        )}
      </TouchableOpacity>
      <View className="flex-1">
        {label && (
          <Text className="text-xs font-semibold text-slate-700 mb-1.5" numberOfLines={1}>
            {label}
          </Text>
        )}
        <Pressable
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          onPress={(e) => seek(e.nativeEvent.locationX)}
          className="h-1.5 rounded-full bg-slate-200 overflow-hidden"
        >
          <View style={{ width: `${progress}%`, backgroundColor: accent }} className="h-full rounded-full" />
        </Pressable>
        <View className="flex-row justify-between mt-1">
          <Text className="text-[9px] text-slate-500">{formatDuration(status.currentTime) || "0:00"}</Text>
          <Text className="text-[9px] text-slate-500">{formatDuration(status.duration) || "--:--"}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Track card ──
function TrackCard({ track, index }: { track: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const subgenreLabel = getSubgenreLabel?.(track.subgenre, track.genre);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  const detailFields: Array<[string, any, boolean?]> = [
    ["Content Type", track.content_type],
    ["Track Type", track.primaryTrackType],
    ["Secondary Type", track.secondary_track_type],
    ["Instrumental", track.instrumental],
    ["Version", track.versionSubtitle],
    ["Featuring", track.featuring],
    ["Remixer", track.remixer],
    ["Author", track.author],
    ["Composer", track.composer],
    ["Arranger", track.arranger],
    ["Producer", track.producer],
    ["Publisher", track.publisher],
    ["P-Line", track.pline],
    ["Production Year", track.productionYear],
    ["Subgenre", subgenreLabel],
    ["Secondary Genre", track.secondaryGenre],
    ["Track Language", track.trackTitleLanguage],
    ["Lyrics Language", track.lyricsLanguage],
    ["Parental Advisory", track.parentalAdvisory],
    ["Price", track.price],
    ["Generate ISRC", track.generateISRC],
    ["Preview Start", track.previewStart ? `${track.previewStart}s` : null],
  ];

  return (
    <View className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      <View className="flex-row items-center gap-3 px-3 py-3">
        <View className="w-6 h-6 rounded-full bg-violet-100 items-center justify-center">
          <Text className="text-violet-600 text-xs font-bold">{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
            {track.title || "Untitled Track"}
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-0.5">
            {track.primaryArtist && (
              <Text className="text-[10px] text-violet-600 font-semibold">{track.primaryArtist}</Text>
            )}
            {track.duration != null && (
              <Text className="text-[10px] text-slate-500">⏱ {formatDuration(track.duration)}</Text>
            )}
            {track.genre && (
              <Text className="text-[10px] text-slate-600 bg-slate-200 px-1.5 rounded">{track.genre}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={toggle} className="p-1.5">
          {expanded ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
        </TouchableOpacity>
      </View>

      {track.audio_file_url && (
        <View className="px-3 pb-3">
          <MiniAudioPlayer url={track.audio_file_url} accent="#7c3aed" />
        </View>
      )}

      {expanded && (
        <View className="px-3 pb-3 flex-row flex-wrap gap-2 border-t border-slate-200 pt-3">
          {detailFields.map(([label, value]) => (
            <DetailPill key={label} label={label} value={value} />
          ))}
          {track.lyrics && (
            <View className="w-full p-3 rounded-xl bg-white border border-slate-200">
              <Text className="text-[9px] font-black uppercase tracking-wide text-slate-500 mb-1.5">
                Lyrics
              </Text>
              <Text className="text-xs text-slate-600 leading-relaxed">{track.lyrics}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Territory viewer (handles both grouped-region and flat-country schemas) ──
function TerritoryViewer({ territories }: { territories: any[] }) {
  const parsed = useMemo(() => {
    if (!territories?.length) return [];
    return territories.map((t) => {
      if (typeof t === "string") {
        try {
          return JSON.parse(t);
        } catch {
          return t;
        }
      }
      return t;
    });
  }, [territories]);

  if (!parsed.length) return <Text className="text-xs text-slate-400 italic">Empty</Text>;

  const grouped = parsed.some(
    (t) => typeof t === "object" && t !== null && !Array.isArray(t) && t.region
  );

  if (grouped) {
    return (
      <View className="gap-2">
        {parsed.map((regionObj, i) => {
          if (!regionObj?.region) return null;
          return (
            <View key={i} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <View className="flex-row items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-100/50">
                <Globe size={13} color="#6366f1" />
                <Text className="text-xs font-bold text-slate-700">{regionObj.region}</Text>
                <Text className="ml-auto text-[10px] text-slate-500 font-medium">
                  {regionObj.countries?.length || 0} countries
                </Text>
              </View>
              <View className="px-3 py-2 flex-row flex-wrap gap-1.5">
                {regionObj.countries?.map((c: string, idx: number) => (
                  <View key={idx} className="px-2 py-0.5 bg-white rounded-md border border-slate-200">
                    <Text className="text-[11px] text-slate-700">{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  const flat = parsed.flatMap((t) => (Array.isArray(t) ? t : typeof t === "string" ? [t] : []));
  return (
    <View className="px-3 py-2.5 flex-row flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50">
      {flat.map((country, idx) => (
        <View key={idx} className="px-2 py-0.5 bg-white rounded-md border border-slate-200">
          <Text className="text-[11px] text-slate-700">{country}</Text>
        </View>
      ))}
    </View>
  );
}

function DistributionSection({ release }: { release: any }) {
  const hasPlatforms = release.distribution_platforms?.length > 0;
  const hasTerritories = release.distribution_territories?.length > 0;
  if (!hasPlatforms && !hasTerritories) return null;

  return (
    <View>
      <SectionHeader icon={Globe} label="Distribution" />
      {hasPlatforms && (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {release.distribution_platforms.map((p: string, i: number) => (
            <View key={i} className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{p}</Text>
            </View>
          ))}
        </View>
      )}
      <TerritoryViewer territories={release.distribution_territories} />
    </View>
  );
}

const ACCENT_MAP: Record<string, { color: string; from: string; to: string; glow: string }> = {
  audio: { color: "#db2777", from: "#db2777", to: "#be185d", glow: "rgba(219,39,119,0.15)" },
  video: { color: "#2563eb", from: "#2563eb", to: "#4f46e5", glow: "rgba(37,99,235,0.15)" },
  ringtone: { color: "#059669", from: "#059669", to: "#0d9488", glow: "rgba(5,150,105,0.15)" },
};

// ── Main modal ──
export default function ReleaseViewModal({
  release,
  visible,
  onClose,
  isSuperAdmin = false,
  isAdmin = false,
}: {
  release: any | null;
  visible: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
}) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!visible || !release?.id) {
      setTracks([]);
      return;
    }
    if (release.tracks?.length > 0) {
      setTracks(release.tracks);
      return;
    }
    (async () => {
      setTracksLoading(true);
      try {
        const { data } = await apiClient.get(`/api/submissions/${release.id}/tracks`);
        setTracks(data?.tracks || []);
      } catch {
        setTracks([]);
      } finally {
        setTracksLoading(false);
      }
    })();
  }, [visible, release?.id]);

  if (!release) return null;

  const releaseType = (release.release_type || "audio").toLowerCase();
  const accent = ACCENT_MAP[releaseType] || ACCENT_MAP.audio;
  const releaseSubgenreLabel = getSubgenreLabel?.(release.subgenre, release.genre);

  const mainAudioUrl =
    release.audio_url || release.ringtone_url || (tracks.length === 1 ? tracks[0]?.audio_file_url : null);

  // Mobile doesn't zip assets locally like the web download button — instead this
  // shares the direct asset links so the admin can save them from their device's share sheet.
  const handleShareLinks = async () => {
    setSharing(true);
    try {
      const lines = [
        `${release.title || "Release"} — ${release.primary_artist || ""}`,
        release.cover_url ? `Cover: ${release.cover_url}` : null,
        mainAudioUrl ? `Main audio: ${mainAudioUrl}` : null,
        ...tracks.map((t, i) => (t.audio_file_url ? `Track ${i + 1} (${t.title}): ${t.audio_file_url}` : null)),
      ].filter(Boolean);
      await Share.share({ message: lines.join("\n") });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-2xl overflow-hidden" style={{ maxHeight: "92%" }}>
          {/* Hero */}
          <View style={{ height: 190 }} className="overflow-hidden">
            {release.cover_url ? (
              <>
                <Image
                  source={{ uri: release.cover_url }}
                  style={{ width: SCREEN_W, height: 190, position: "absolute" }}
                  blurRadius={20}
                />
                <BlurView intensity={30} tint="light" style={{ flex: 1 }} />
              </>
            ) : (
              <LinearGradient
                colors={[accent.glow, "#f8fafc"]}
                style={{ flex: 1 }}
              />
            )}
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.9)", "#fff"]}
              style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 130 }}
            />
            <View style={{ position: "absolute", top: 2, left: 0, right: 0, height: 2, backgroundColor: accent.color }} />

            <View className="absolute top-4 left-4 right-4 flex-row items-start justify-between">
              <StatusBadge status={release.status} />
              {isSuperAdmin && release.users?.admins?.brand_name && (
                <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200">
                  <Building2 size={10} color="#7c3aed" />
                  <Text className="text-[10px] font-bold uppercase text-violet-700">
                    {release.users.admins.brand_name}
                  </Text>
                </View>
              )}
            </View>

            <View className="absolute bottom-4 left-4 right-4 flex-row items-end gap-3">
              <View
                style={{ width: 68, height: 68, borderColor: accent.color + "30" }}
                className="rounded-xl overflow-hidden border"
              >
                {release.cover_url ? (
                  <Image source={{ uri: release.cover_url }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-slate-100">
                    {releaseType === "video" ? (
                      <Video size={26} color="#3b82f6" />
                    ) : releaseType === "ringtone" ? (
                      <PhoneOutgoing size={26} color="#10b981" />
                    ) : (
                      <Music size={26} color="#ec4899" />
                    )}
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text style={{ color: accent.color }} className="text-[9px] font-black uppercase tracking-widest mb-0.5">
                  {releaseType} release
                </Text>
                <Text className="text-lg font-black text-slate-900" numberOfLines={1}>
                  {release.title || "Untitled"}
                </Text>
                <Text style={{ color: accent.color }} className="text-sm font-semibold" numberOfLines={1}>
                  {release.primary_artist || "Unknown Artist"}
                </Text>
                {release.oac_address && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://youtube.com/channel/${release.oac_address}`)}
                    className="flex-row items-center gap-1.5 mt-1"
                  >
                    
                    <Text className="text-xs font-semibold text-red-500">Official Artist Channel</Text>
                    <ExternalLink size={11} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {(isSuperAdmin || isAdmin) && (release.users?.full_name || release.userInfo?.full_name) && (
            <View className="flex-row items-center gap-2.5 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <User size={13} color="#64748b" />
              <Text className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Submitted by</Text>
              <Text className="text-xs font-bold text-slate-800">
                {release.users?.full_name || release.userInfo?.full_name}
              </Text>
            </View>
          )}

          {mainAudioUrl && (
            <View className="px-4 pt-4">
              <MiniAudioPlayer url={mainAudioUrl} label="Main Release Audio" accent={accent.color} />
            </View>
          )}

          <ScrollView className="px-4" contentContainerStyle={{ paddingVertical: 16, gap: 20 }}>
            <View>
              <SectionHeader icon={Info} label="Release Info" />
              <View className="flex-row flex-wrap gap-2">
                <DetailPill label="Genre" value={release.genre} />
                <DetailPill label="Subgenre" value={releaseSubgenreLabel} />
                <DetailPill label="Language" value={release.language} />
                <DetailPill label="Explicit" value={release.explicit_content} />
                <DetailPill label="Format" value={release.format} />
                <DetailPill label="Label" value={release.label_name} />
                <DetailPill label="Version" value={release.version_subtitle} />
                <DetailPill
                  label="Release Date"
                  value={
                    release.release_date
                      ? new Date(release.release_date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : null
                  }
                />
                <DetailPill
                  label="Created"
                  value={
                    release.created_at
                      ? new Date(release.created_at).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : null
                  }
                />
              </View>
            </View>

            <View>
              <SectionHeader icon={Shield} label="Rights & Identifiers" />
              <View className="flex-row flex-wrap gap-2">
                <DetailPill label="UPC / EAN" value={release.upc_ean} mono />
                <DetailPill label="ISRC" value={release.isrc} mono />
                <DetailPill label="GRID" value={release.grid} mono />
                <DetailPill label="OAC" value={release.oac_address} mono />
                <DetailPill label="Copyright Holder" value={release.copyright_holder} />
                <DetailPill label="Copyright Year" value={release.copyright_year} />
                <DetailPill label="Publisher" value={release.publisher} />
                <DetailPill label="P-Line" value={release.p_line} />
                <DetailPill label="C-Line" value={release.c_line} />
                <DetailPill label="Production Year" value={release.production_year} />
                <DetailPill label="Producer Cat. No." value={release.producer_catalog_number} mono />
              </View>
            </View>

            {tracksLoading ? (
              <View className="flex-row items-center gap-2 py-1">
                <ActivityIndicator size="small" color="#6366f1" />
                <Text className="text-xs text-slate-400">Loading tracks…</Text>
              </View>
            ) : tracks.length > 0 ? (
              <View>
                <SectionHeader icon={ListMusic} label={`Tracks (${tracks.length})`} />
                <View className="gap-2">
                  {tracks.map((track, i) => (
                    <TrackCard key={track.id || i} track={track} index={i} />
                  ))}
                </View>
              </View>
            ) : null}

            <DistributionSection release={release} />

            {release.video_metadata && (
              <View>
                <SectionHeader icon={Video} label="Video Details" />
                <View className="flex-row flex-wrap gap-2">
                  <DetailPill label="Director" value={release.video_metadata.director} />
                  <DetailPill label="Producer" value={release.video_metadata.producer} />
                  <DetailPill label="Duration" value={release.video_metadata.duration} />
                  {release.video_metadata.video_description && (
                    <View className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <Text className="text-[9px] font-black uppercase tracking-wide text-slate-500 mb-1.5">
                        Description
                      </Text>
                      <Text className="text-xs text-slate-600 leading-relaxed">
                        {release.video_metadata.video_description}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {release.ringtone_metadata && (
              <View>
                <SectionHeader icon={PhoneOutgoing} label="Ringtone Details" />
                <View className="flex-row flex-wrap gap-2">
                  <DetailPill label="Original Song" value={release.ringtone_metadata.original_song_title} />
                  <DetailPill
                    label="Duration"
                    value={
                      release.ringtone_metadata.duration_seconds
                        ? `${release.ringtone_metadata.duration_seconds}s`
                        : null
                    }
                  />
                  <DetailPill label="Target Devices" value={release.ringtone_metadata.target_devices} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex-row items-center justify-between gap-3">
            {isSuperAdmin && (
              <TouchableOpacity
                onPress={handleShareLinks}
                disabled={sharing}
                style={{
                  backgroundColor: accent.color + "10",
                  borderColor: accent.color + "30",
                }}
                className="flex-row items-center gap-2 px-4 py-2 rounded-xl border"
              >
                {sharing ? (
                  <ActivityIndicator size="small" color={accent.color} />
                ) : (
                  <Download size={14} color={accent.color} />
                )}
                <Text style={{ color: accent.color }} className="text-xs font-bold uppercase tracking-wide">
                  {sharing ? "Preparing…" : "Share Assets"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              className="ml-auto px-5 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <Text className="text-sm font-semibold text-slate-700">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}