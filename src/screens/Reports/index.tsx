import { LinearGradient } from "expo-linear-gradient";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Headphones,
  Layers,
  MapPin,
  Music,
  Radio,
  Search,
  Zap,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Dimensions, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { Circle, Line as SvgLine, Svg, Text as SvgText } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";

/* ─────────────────────────────────────────
   STATIC DATA
   Replace with your useReportsData / useFilters
   hooks once the mobile API layer is ready.
───────────────────────────────────────── */

const REPORTS = [
  { id: "r1", title: "Midnight Echoes", created_at: "2026-06-02", streams: 184320, revenue: 812.4, line_count: 1204 },
  { id: "r2", title: "Neon Skyline", created_at: "2026-05-18", streams: 96210, revenue: 401.1, line_count: 880 },
  { id: "r3", title: "Golden Hour", created_at: "2026-05-04", streams: 143870, revenue: 640.75, line_count: 1032 },
  { id: "r4", title: "Silent Static", created_at: "2026-04-21", streams: 52040, revenue: 208.9, line_count: 511 },
  { id: "r5", title: "City Lights", created_at: "2026-04-09", streams: 71100, revenue: 299.5, line_count: 640 },
  { id: "r6", title: "Wave Rider", created_at: "2026-03-27", streams: 38900, revenue: 151.2, line_count: 402 },
];

const MONTHLY_TREND = [
  { month: "Feb", streams: 41200, revenue: 172 },
  { month: "Mar", streams: 58900, revenue: 231 },
  { month: "Apr", streams: 76500, revenue: 305 },
  { month: "May", streams: 112400, revenue: 468 },
  { month: "Jun", streams: 154800, revenue: 642 },
  { month: "Jul", streams: 184320, revenue: 812 },
];

const PLATFORM_DATA = [
  { platform: "Spotify", streams: 240500, revenue: 980.2, color: "#22c55e" },
  { platform: "Apple Music", streams: 132400, revenue: 610.5, color: "#ec4899" },
  { platform: "Amazon Music", streams: 61200, revenue: 240.1, color: "#0ea5e9" },
  { platform: "YouTube Music", streams: 44300, revenue: 155.6, color: "#f43f5e" },
  { platform: "Others", streams: 26100, revenue: 94.3, color: "#eab308" },
];

const TOP_TRACKS = [
  { track: "Midnight Echoes", artist: "Nova Reyes", streams: 184320, revenue: 812.4 },
  { track: "Golden Hour", artist: "Ari Vale", streams: 143870, revenue: 640.75 },
  { track: "Neon Skyline", artist: "TUNERAAGA", streams: 96210, revenue: 401.1 },
  { track: "City Lights", artist: "TUNERAAGA", streams: 71100, revenue: 299.5 },
];

const TOP_RELEASES = [
  { title: "Midnight Echoes", streams: 184320, revenue: 812.4 },
  { title: "Golden Hour", streams: 143870, revenue: 640.75 },
  { title: "Neon Skyline", streams: 96210, revenue: 401.1 },
];

const TERRITORY_DATA = [
  { country: "United States", streams: 210400, percentage: 38 },
  { country: "United Kingdom", streams: 98200, percentage: 18 },
  { country: "India", streams: 84600, percentage: 15 },
  { country: "Canada", streams: 52100, percentage: 9 },
  { country: "Germany", streams: 41300, percentage: 7 },
];

const SCATTER_DATA = REPORTS.map((r) => ({ x: r.streams, y: r.revenue, label: r.title }));

const CREATION_STATS = { total_creations: 342, total_creation_revenue: 1204.5 };
const STREAMING_STATS = { total_streams: 504500, total_streaming_revenue: 2081.65 };

const SALES_TYPE_DISTRIBUTION = [
  { type: "Stream", revenue: 1680.4, percentage: 80.7 },
  { type: "Download", revenue: 251.3, percentage: 12.1 },
  { type: "Ringtone", revenue: 149.95, percentage: 7.2 },
];

const PLATFORM_DISTRIBUTION = [
  { platform: "Spotify", creation: 480.2, streaming: 980.2 },
  { platform: "Apple Music", creation: 310.5, streaming: 610.5 },
  { platform: "Amazon Music", creation: 120.1, streaming: 240.1 },
];

const TOP_CREATION_TRACKS = [
  { track: "Midnight Echoes", streams: 61200, revenue: 280.4 },
  { track: "Golden Hour", streams: 48900, revenue: 210.75 },
];

const ACCENT = { blue: "#3b82f6", emerald: "#10b981", amber: "#f59e0b", violet: "#8b5cf6" };
const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 32 - 32; // screen padding + card padding

function formatNumber(n: number, decimals = 0) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(decimals);
}

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchReports, setSearchReports] = useState("");
  const [selectedReleases, setSelectedReleases] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const toggleFrom = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const grandTotalStreams = REPORTS.reduce((s, r) => s + r.streams, 0);
  const grandTotalRevenue = REPORTS.reduce((s, r) => s + r.revenue, 0);
  const allPlatforms = PLATFORM_DATA.map((p) => p.platform);
  const allMonths = MONTHLY_TREND.map((m) => m.month);
  const topReport = useMemo(
    () => REPORTS.reduce((top, r) => (r.streams > (top?.streams || 0) ? r : top), REPORTS[0]),
    []
  );

  const filteredCards = useMemo(
    () => REPORTS.filter((r) => r.title.toLowerCase().includes(searchTerm.toLowerCase().trim())),
    [searchTerm]
  );
  const filteredReportList = useMemo(
    () => REPORTS.filter((r) => r.title.toLowerCase().includes(searchReports.toLowerCase().trim())),
    [searchReports]
  );

  const lineData = MONTHLY_TREND.map((m) => ({ value: m.streams, label: m.month }));
  const pieData = PLATFORM_DATA.map((p) => ({
    value: p.streams,
    color: p.color,
    text: `${Math.round((p.streams / grandTotalStreams) * 100)}%`,
  }));
  const barData = PLATFORM_DATA.map((p) => ({
    value: p.revenue,
    label: p.platform.split(" ")[0],
    frontColor: p.color,
  }));

  return (
    <LinearGradient colors={["#F0F6FF", "#F8F8FC", "#FFFFFF"]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 170 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── HERO HEADER ── */}
            <View className="flex-row items-center gap-2 mb-1">
              <View className="w-2 h-2 rounded-full bg-blue-500" />
              <Text className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                Live Analytics
              </Text>
            </View>
            <Text className="text-3xl font-black text-slate-900 tracking-tight">
              Your Music <Text className="text-blue-500">Reports</Text>
            </Text>
            <Text className="text-sm text-slate-400 mt-1.5">
              {REPORTS.length} releases across {allPlatforms.length} platforms
            </Text>

            {/* ── KPI STAT CARDS ── */}
            <View className="flex-row flex-wrap gap-3 mt-5">
              <StatCard icon={Music} label="Releases" value={String(REPORTS.length)} sub="All time" color={ACCENT.blue} />
              <StatCard icon={Headphones} label="Total Streams" value={formatNumber(grandTotalStreams)} sub="Across all DSPs" color={ACCENT.emerald} />
              <StatCard icon={DollarSign} label="Total Revenue" value={`$${grandTotalRevenue.toFixed(2)}`} sub="Estimated earnings" color={ACCENT.amber} />
              <StatCard icon={Radio} label="Platforms" value={String(allPlatforms.length)} sub="Active DSPs" color={ACCENT.violet} />
            </View>

            {/* ── RELEASE SELECTOR ── */}
            <View className="mt-6 bg-white/80 border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <View className="px-4 pt-4 pb-3 border-b border-slate-100">
                <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search releases…" />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }}>
                {filteredCards.length > 0 ? (
                  filteredCards.map((r) => (
                    <ReleaseChip
                      key={r.id}
                      title={r.title}
                      streams={r.streams}
                      revenue={r.revenue}
                      isTop={r.id === topReport?.id}
                      selected={selectedReleases.includes(r.id)}
                      onPress={() => toggleFrom(selectedReleases, setSelectedReleases, r.id)}
                    />
                  ))
                ) : (
                  <Text className="text-slate-400 text-sm py-6">No songs found</Text>
                )}
              </ScrollView>
            </View>

            {/* ── FILTERS ── */}
            <View className="mt-6 bg-white/80 border border-slate-100 rounded-2xl shadow-sm p-4">
              <SectionLabel icon={Calendar}>Filter by Month</SectionLabel>
              <View className="flex-row flex-wrap gap-1.5 mb-4">
                {allMonths.map((m) => (
                  <Pill key={m} active={selectedMonths.includes(m)} onPress={() => toggleFrom(selectedMonths, setSelectedMonths, m)}>
                    {m}
                  </Pill>
                ))}
              </View>
              <SectionLabel icon={Radio}>Filter by Platform</SectionLabel>
              <View className="flex-row flex-wrap gap-1.5">
                {allPlatforms.map((p) => (
                  <Pill key={p} active={selectedPlatforms.includes(p)} onPress={() => toggleFrom(selectedPlatforms, setSelectedPlatforms, p)}>
                    {p}
                  </Pill>
                ))}
              </View>
            </View>

            {/* ── MONTHLY TREND ── */}
            <ChartCard title="Monthly Streams Trend" icon={BarChart3}>
              <LineChart
                data={lineData}
                width={CHART_WIDTH - 40}
                height={180}
                thickness={2.5}
                color={ACCENT.blue}
                curved
                areaChart
                startFillColor={ACCENT.blue}
                startOpacity={0.25}
                endOpacity={0.02}
                dataPointsColor={ACCENT.blue}
                dataPointsRadius={4}
                hideRules
                yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
                xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 10 }}
                xAxisColor="#e2e8f0"
                yAxisColor="#e2e8f0"
                noOfSections={4}
                spacing={CHART_WIDTH / MONTHLY_TREND.length - 12}
                initialSpacing={16}
              />
            </ChartCard>

            {/* ── PLATFORM PIE ── */}
            <ChartCard title="Streams by Platform" icon={Radio}>
              <View className="items-center">
                <PieChart
                  data={pieData}
                  donut
                  radius={80}
                  innerRadius={52}
                  centerLabelComponent={() => (
                    <View className="items-center">
                      <Text className="text-xs text-slate-400">Total</Text>
                      <Text className="text-sm font-bold text-slate-800">{formatNumber(grandTotalStreams)}</Text>
                    </View>
                  )}
                />
              </View>
              <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 mt-4 justify-center">
                {PLATFORM_DATA.map((p) => (
                  <View key={p.platform} className="flex-row items-center gap-1.5">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
                    <Text className="text-xs text-slate-500">{p.platform}</Text>
                  </View>
                ))}
              </View>
            </ChartCard>

            {/* ── PLATFORM BAR (revenue) ── */}
            <ChartCard title="Revenue by Platform" icon={DollarSign}>
              <BarChart
                data={barData}
                width={CHART_WIDTH - 40}
                height={180}
                barWidth={22}
                spacing={22}
                roundedTop
                hideRules
                yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
                xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 9 }}
                xAxisColor="#e2e8f0"
                yAxisColor="#e2e8f0"
                noOfSections={4}
              />
            </ChartCard>

            {/* ── TRACK LEADERBOARD ── */}
            <ChartCard title="Top Tracks" icon={Music}>
              <View className="gap-2">
                {TOP_TRACKS.map((t, i) => (
                  <LeaderboardRow key={t.track} rank={i + 1} title={t.track} sub={t.artist} streams={t.streams} revenue={t.revenue} />
                ))}
              </View>
            </ChartCard>

            {/* ── TERRITORY ── */}
            <ChartCard title="Top Territories" icon={MapPin}>
              <View className="gap-3">
                {TERRITORY_DATA.map((t) => (
                  <View key={t.country}>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm font-medium text-slate-700">{t.country}</Text>
                      <Text className="text-xs text-slate-400">
                        {formatNumber(t.streams)} · {t.percentage}%
                      </Text>
                    </View>
                    <View className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <View style={{ width: `${t.percentage}%`, backgroundColor: ACCENT.blue }} className="h-2 rounded-full" />
                    </View>
                  </View>
                ))}
              </View>
            </ChartCard>

            {/* ── RELEASE LEADERBOARD ── */}
            <ChartCard title="Top Releases" icon={Layers}>
              <View className="gap-2">
                {TOP_RELEASES.map((r, i) => (
                  <LeaderboardRow key={r.title} rank={i + 1} title={r.title} streams={r.streams} revenue={r.revenue} />
                ))}
              </View>
            </ChartCard>

            {/* ── SCATTER INSIGHT ── */}
            <ChartCard title="Streams vs Revenue" icon={BarChart3}>
              <ScatterInsightChart data={SCATTER_DATA} width={CHART_WIDTH - 40} height={200} />
            </ChartCard>

            {/* ── CREATION STATS ── */}
            <View className="flex-row gap-3 mt-6">
              <CreationStatCard icon={Zap} label="Total Creations" value={String(CREATION_STATS.total_creations)} revenue={CREATION_STATS.total_creation_revenue} color={ACCENT.violet} />
              <CreationStatCard icon={Headphones} label="Total Streams" value={formatNumber(STREAMING_STATS.total_streams)} revenue={STREAMING_STATS.total_streaming_revenue} color={ACCENT.emerald} />
            </View>

            {/* ── SALES TYPE BREAKDOWN ── */}
            <ChartCard title="Sales Type Breakdown" icon={DollarSign}>
              <View className="gap-4">
                {SALES_TYPE_DISTRIBUTION.map((s) => (
                  <View key={s.type}>
                    <View className="flex-row justify-between mb-1.5">
                      <Text className="text-sm font-semibold text-slate-700">{s.type}</Text>
                      <Text className="text-sm font-bold text-slate-800">${s.revenue.toFixed(2)}</Text>
                    </View>
                    <View className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <View style={{ width: `${s.percentage}%`, backgroundColor: ACCENT.amber }} className="h-2.5 rounded-full" />
                    </View>
                  </View>
                ))}
              </View>
            </ChartCard>

            {/* ── PLATFORM COMPARISON (creation vs streaming) ── */}
            <ChartCard title="Creation vs Streaming Revenue" icon={Radio}>
              <View className="gap-4">
                {PLATFORM_DISTRIBUTION.map((p) => {
                  const max = Math.max(p.creation, p.streaming);
                  return (
                    <View key={p.platform}>
                      <Text className="text-sm font-semibold text-slate-700 mb-1.5">{p.platform}</Text>
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-[10px] w-16 text-slate-400">Creation</Text>
                        <View className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <View style={{ width: `${(p.creation / max) * 100}%`, backgroundColor: ACCENT.violet }} className="h-2 rounded-full" />
                        </View>
                        <Text className="text-[10px] text-slate-400 w-14 text-right">${p.creation.toFixed(0)}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[10px] w-16 text-slate-400">Streaming</Text>
                        <View className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <View style={{ width: `${(p.streaming / max) * 100}%`, backgroundColor: ACCENT.emerald }} className="h-2 rounded-full" />
                        </View>
                        <Text className="text-[10px] text-slate-400 w-14 text-right">${p.streaming.toFixed(0)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ChartCard>

            {/* ── CREATION TRACK LIST ── */}
            <ChartCard title="Top Creation Tracks" icon={Zap}>
              <View className="gap-2">
                {TOP_CREATION_TRACKS.map((t, i) => (
                  <LeaderboardRow key={t.track} rank={i + 1} title={t.track} streams={t.streams} revenue={t.revenue} />
                ))}
              </View>
            </ChartCard>

            {/* ── AVAILABLE REPORTS ── */}
            <View className="mt-6 bg-white/80 border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <View className="px-4 pt-4 pb-3 border-b border-slate-100">
                <SectionLabel icon={Layers}>Available Reports</SectionLabel>
                <Text className="text-xs text-slate-400 ml-6 -mt-1 mb-2">Official reports uploaded by your admin</Text>
                <SearchInput value={searchReports} onChange={setSearchReports} placeholder="Search reports…" />
              </View>
              <View className="p-3 gap-2">
                {filteredReportList.length > 0 ? (
                  filteredReportList.map((r) => <ReportRow key={r.id} report={r} />)
                ) : (
                  <Text className="text-center text-slate-400 py-8 text-sm">No reports match your search.</Text>
                )}
              </View>
            </View>
          </ScrollView>

          <Footer />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────
   SUBCOMPONENTS
───────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <View className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm" style={{ width: (SCREEN_WIDTH - 32 - 12) / 2 }}>
      <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${color}1A` }}>
        <Icon size={16} color={color} />
      </View>
      <Text className="text-xs text-slate-400 font-medium">{label}</Text>
      <Text className="text-lg font-bold text-slate-900 mt-0.5">{value}</Text>
      <Text className="text-[10px] text-slate-400 mt-0.5">{sub}</Text>
    </View>
  );
}

function CreationStatCard({ icon: Icon, label, value, revenue, color }: { icon: any; label: string; value: string; revenue: number; color: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${color}1A` }}>
        <Icon size={16} color={color} />
      </View>
      <Text className="text-xs text-slate-400 font-medium">{label}</Text>
      <Text className="text-lg font-bold text-slate-900 mt-0.5">{value}</Text>
      <Text className="text-[11px] font-semibold mt-0.5" style={{ color }}>
        ${revenue.toFixed(2)} revenue
      </Text>
    </View>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: any; children: string }) {
  return (
    <View className="flex-row items-center gap-1.5 mb-2">
      <Icon size={13} color="#3b82f6" />
      <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{children}</Text>
    </View>
  );
}

function Pill({ active, onPress, children }: { active: boolean; onPress: () => void; children: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full border ${active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
    >
      <Text className={`text-xs font-medium ${active ? "text-blue-600" : "text-slate-500"}`}>{children}</Text>
    </TouchableOpacity>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3">
      <Search size={13} color="#94a3b8" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        className="flex-1 py-2 px-2 text-sm text-slate-700"
      />
    </View>
  );
}

function ReleaseChip({
  title,
  streams,
  revenue,
  isTop,
  selected,
  onPress,
}: {
  title: string;
  streams: number;
  revenue: number;
  isTop: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`w-40 rounded-xl border p-3 ${selected ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white"}`}
    >
      {isTop && (
        <View className="self-start bg-amber-100 rounded-full px-2 py-0.5 mb-1.5">
          <Text className="text-[9px] font-bold text-amber-700">TOP</Text>
        </View>
      )}
      <Text numberOfLines={1} className="text-sm font-semibold text-slate-800">
        {title}
      </Text>
      <Text className="text-xs text-emerald-600 font-medium mt-1">{formatNumber(streams)} streams</Text>
      <Text className="text-xs text-amber-600 font-medium">${revenue.toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <View className="mt-6 bg-white/80 border border-slate-100 rounded-2xl shadow-sm p-4">
      <View className="flex-row items-center gap-2 mb-4">
        <Icon size={15} color="#3b82f6" />
        <Text className="text-sm font-bold text-slate-800">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function LeaderboardRow({ rank, title, sub, streams, revenue }: { rank: number; title: string; sub?: string; streams: number; revenue: number }) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
        <Text className="text-xs font-bold text-blue-600">{rank}</Text>
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm font-semibold text-slate-800">
          {title}
        </Text>
        {!!sub && <Text className="text-xs text-slate-400">{sub}</Text>}
      </View>
      <View className="items-end">
        <Text className="text-xs font-semibold text-emerald-600">{formatNumber(streams)}</Text>
        <Text className="text-xs font-semibold text-amber-600">${revenue.toFixed(2)}</Text>
      </View>
    </View>
  );
}

function ReportRow({ report }: { report: (typeof REPORTS)[number] }) {
  const handleDownload = () => {
    // Wire this to your real download endpoint, e.g.
    // GET `${API_BASE_URL}/api/reports/${report.id}/download`
    console.log("download", report.id);
  };
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3">
      <View className="flex-row items-center gap-3 flex-1 min-w-0">
        <View className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center">
          <Music size={14} color="#3b82f6" />
        </View>
        <View className="flex-1 min-w-0">
          <Text numberOfLines={1} className="text-sm font-semibold text-slate-800">
            {report.title}
          </Text>
          <Text numberOfLines={1} className="text-[11px] text-slate-400">
            {new Date(report.created_at).toLocaleDateString()} · {formatNumber(report.streams)} streams · $
            {report.revenue.toFixed(1)} · {report.line_count} rows
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={handleDownload} className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200">
        <Download size={12} color="#64748b" />
        <Text className="text-xs font-semibold text-slate-500">Get</Text>
      </TouchableOpacity>
    </View>
  );
}

/* Custom scatter plot — react-native-gifted-charts has no first-class
   scatter chart, so this is a small hand-rolled react-native-svg plot. */
function ScatterInsightChart({
  data,
  width,
  height,
}: {
  data: { x: number; y: number; label: string }[];
  width: number;
  height: number;
}) {
  const padding = 28;
  const maxX = Math.max(...data.map((d) => d.x), 1);
  const maxY = Math.max(...data.map((d) => d.y), 1);

  const scaleX = (v: number) => padding + (v / maxX) * (width - padding * 1.5);
  const scaleY = (v: number) => height - padding - (v / maxY) * (height - padding * 1.5);

  return (
    <Svg width={width} height={height}>
      {/* axes */}
      <SvgLine x1={padding} y1={0} x2={padding} y2={height - padding} stroke="#e2e8f0" strokeWidth={1} />
      <SvgLine x1={padding} y1={height - padding} x2={width} y2={height - padding} stroke="#e2e8f0" strokeWidth={1} />
      <SvgText x={2} y={12} fontSize={9} fill="#94a3b8">
        Revenue
      </SvgText>
      <SvgText x={width - 46} y={height - 8} fontSize={9} fill="#94a3b8">
        Streams
      </SvgText>

      {data.map((d) => (
        <Circle key={d.label} cx={scaleX(d.x)} cy={scaleY(d.y)} r={6} fill="#3b82f6" opacity={0.75} />
      ))}
    </Svg>
  );
}