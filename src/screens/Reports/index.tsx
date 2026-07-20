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
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Circle,
  Svg,
  Line as SvgLine,
  Text as SvgText,
} from "react-native-svg";
import Footer from "../../components/Footer";
import { useReportsData } from "../../hooks/useReportsData"; // adjust path

const ACCENT = {
  blue: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  violet: "#8b5cf6",
};
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const {
    reports,
    analytics,
    loading,
    analyticsLoading,
    error,

    grandTotalStreams,
    grandTotalRevenue,
    allPlatforms,
    allMonths,
    topReport,

    getReportStreams,
    getReportRevenue,

    monthlyChartData,
    platformChartData,
    topTracks,
    topReleases,
    territoryData,
    scatterData,

    handleDownload,
    refetch,
  } = useReportsData({ selectedReleases, selectedMonths, selectedPlatforms });

  const toggleFrom = (
    list: string[],
    setList: (v: string[]) => void,
    value: string,
  ) => {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  };

  // Wraps the hook's handleDownload so a specific row can show a spinner
  // while the file generates/downloads. Guards against double-taps and
  // always clears state even if the download throws.
  const handleDownloadWithLoading = async (id: string) => {
    if (downloadingId) return;
    setDownloadingId(id);
    try {
      await handleDownload(id);
    } catch (err) {
      console.warn("Download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredCards = useMemo(
    () =>
      reports.filter((r) =>
        (r.release_title || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim()),
      ),
    [reports, searchTerm],
  );
  const filteredReportList = useMemo(
    () =>
      reports.filter((r) =>
        (r.release_title || "")
          .toLowerCase()
          .includes(searchReports.toLowerCase().trim()),
      ),
    [reports, searchReports],
  );

  const lineData = monthlyChartData.map((m: any) => ({
    value: m.Streams,
    label: m.month,
  }));
  const pieData = platformChartData.map((p: any) => ({
    value: p.streams,
    color: p.color,
    text: grandTotalStreams
      ? `${Math.round((p.streams / grandTotalStreams) * 100)}%`
      : "0%",
  }));
  const barData = platformChartData.map((p: any) => ({
    value: p.revenue,
    label: p.name.split(" ")[0],
    frontColor: p.color,
  }));

  const creationStats = analytics?.creation_stats;
  const streamingStats = analytics?.streaming_stats;
  const salesTypeDistribution = analytics?.sales_type_distribution || [];
  const platformDistribution = analytics?.platform_distribution || [];
  const topCreationTracks = analytics?.top_creation_tracks || [];

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading && !reports.length) {
    return (
      <LinearGradient
        colors={["#F0F6FF", "#F8F8FC", "#FFFFFF"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ACCENT.blue} />
          <Text className="text-sm text-slate-400 mt-3">
            Loading your reports…
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#F0F6FF", "#F8F8FC", "#FFFFFF"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 24,
              paddingBottom: 170,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refetch}
                tintColor={ACCENT.blue}
              />
            }
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
              {reports.length} releases across {allPlatforms.length} platforms
            </Text>

            {error && (
              <View className="mt-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <Text className="text-xs text-red-500">{error}</Text>
              </View>
            )}

            {/* ── KPI STAT CARDS ── */}
            <View className="flex-row flex-wrap gap-3 mt-5">
              <StatCard
                icon={Music}
                label="Releases"
                value={String(reports.length)}
                sub="All time"
                color={ACCENT.blue}
              />
              <StatCard
                icon={Headphones}
                label="Total Streams"
                value={formatNumber(grandTotalStreams)}
                sub="Across all DSPs"
                color={ACCENT.emerald}
              />
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={`$${grandTotalRevenue.toFixed(2)}`}
                sub="Estimated earnings"
                color={ACCENT.amber}
              />
              <StatCard
                icon={Radio}
                label="Platforms"
                value={String(allPlatforms.length)}
                sub="Active DSPs"
                color={ACCENT.violet}
              />
            </View>

            {/* ── RELEASE SELECTOR ── */}
            <View className="mt-6 bg-white/80 border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <View className="px-4 pt-4 pb-3 border-b border-slate-100">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search releases…"
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 12, gap: 8 }}
              >
                {filteredCards.length > 0 ? (
                  filteredCards.map((r) => (
                    <ReleaseChip
                      key={r.id}
                      title={r.release_title || "Untitled"}
                      streams={getReportStreams(r)}
                      revenue={getReportRevenue(r)}
                      isTop={r.id === topReport?.id}
                      selected={selectedReleases.includes(r.id)}
                      onPress={() =>
                        toggleFrom(selectedReleases, setSelectedReleases, r.id)
                      }
                    />
                  ))
                ) : (
                  <Text className="text-slate-400 text-sm py-6">
                    No songs found
                  </Text>
                )}
              </ScrollView>
            </View>

            {/* ── FILTERS ── */}
            <View className="mt-6 bg-white/80 border border-slate-100 rounded-2xl shadow-sm p-4">
              <SectionLabel icon={Calendar}>Filter by Month</SectionLabel>
              <View className="flex-row flex-wrap gap-1.5 mb-4">
                {allMonths.map((m: string) => (
                  <Pill
                    key={m}
                    active={selectedMonths.includes(m)}
                    onPress={() =>
                      toggleFrom(selectedMonths, setSelectedMonths, m)
                    }
                  >
                    {m}
                  </Pill>
                ))}
              </View>
              <SectionLabel icon={Radio}>Filter by Platform</SectionLabel>
              <View className="flex-row flex-wrap gap-1.5">
                {allPlatforms.map((p: string) => (
                  <Pill
                    key={p}
                    active={selectedPlatforms.includes(p)}
                    onPress={() =>
                      toggleFrom(selectedPlatforms, setSelectedPlatforms, p)
                    }
                  >
                    {p}
                  </Pill>
                ))}
              </View>
            </View>

            {/* ── MONTHLY TREND ── */}
            <ChartCard
              title="Monthly Streams Trend"
              icon={BarChart3}
              loading={analyticsLoading}
            >
              <ChartErrorBoundary fallbackLabel="Couldn't render this chart">
                {lineData.length > 1 ? (
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
                    spacing={
                      CHART_WIDTH / Math.max(monthlyChartData.length, 1) - 12
                    }
                    initialSpacing={16}
                  />
                ) : lineData.length === 1 ? (
                  // A curved/area line chart needs 2+ points to compute a
                  // segment and can crash on a single point — show a simple
                  // stat instead of risking that here.
                  <View className="items-center py-6">
                    <Text className="text-2xl font-black text-slate-900">
                      {formatNumber(lineData[0].value)}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-1">
                      {lineData[0].label} · not enough data yet for a trend
                      line
                    </Text>
                  </View>
                ) : (
                  <EmptyState label="No monthly data yet" />
                )}
              </ChartErrorBoundary>
            </ChartCard>

            {/* ── PLATFORM PIE ── */}
            <ChartCard
              title="Streams by Platform"
              icon={Radio}
              loading={analyticsLoading}
            >
              <ChartErrorBoundary fallbackLabel="Couldn't render this chart">
                {pieData.length > 0 ? (
                  <>
                    <View className="items-center">
                      <PieChart
                        data={pieData}
                        donut
                        radius={80}
                        innerRadius={52}
                        centerLabelComponent={() => (
                          <View className="items-center">
                            <Text className="text-xs text-slate-400">
                              Total
                            </Text>
                            <Text className="text-sm font-bold text-slate-800">
                              {formatNumber(grandTotalStreams)}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                    <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 mt-4 justify-center">
                      {platformChartData.map((p: any) => (
                        <View
                          key={p.name}
                          className="flex-row items-center gap-1.5"
                        >
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: p.color,
                            }}
                          />
                          <Text className="text-xs text-slate-500">
                            {p.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <EmptyState label="No platform data yet" />
                )}
              </ChartErrorBoundary>
            </ChartCard>

            {/* ── PLATFORM BAR (revenue) ── */}
            <ChartCard
              title="Revenue by Platform"
              icon={DollarSign}
              loading={analyticsLoading}
            >
              <ChartErrorBoundary fallbackLabel="Couldn't render this chart">
                {barData.length > 0 ? (
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
                ) : (
                  <EmptyState label="No revenue data yet" />
                )}
              </ChartErrorBoundary>
            </ChartCard>

            {/* ── TRACK LEADERBOARD ── */}
            <ChartCard
              title="Top Tracks"
              icon={Music}
              loading={analyticsLoading}
            >
              {topTracks.length > 0 ? (
                <View className="gap-2">
                  {topTracks.map((t: any, i: number) => (
                    <LeaderboardRow
                      key={t.id ?? t.name}
                      rank={i + 1}
                      title={t.name}
                      sub={t.artist}
                      streams={t.streams}
                      revenue={t.revenue}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState label="No track data yet" />
              )}
            </ChartCard>

            {/* ── TERRITORY ── */}
            <ChartCard
              title="Top Territories"
              icon={MapPin}
              loading={analyticsLoading}
            >
              {territoryData.length > 0 ? (
                <View className="gap-3">
                  {territoryData.map((t: any) => {
                    const pct = grandTotalStreams
                      ? Math.round((t.streams / grandTotalStreams) * 100)
                      : 0;
                    return (
                      <View key={t.territory}>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-sm font-medium text-slate-700">
                            {t.territory}
                          </Text>
                          <Text className="text-xs text-slate-400">
                            {formatNumber(t.streams)} · {pct}%
                          </Text>
                        </View>
                        <View className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <View
                            style={{
                              width: `${pct}%`,
                              backgroundColor: ACCENT.blue,
                            }}
                            className="h-2 rounded-full"
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <EmptyState label="No territory data yet" />
              )}
            </ChartCard>

            {/* ── RELEASE LEADERBOARD ── */}
            <ChartCard
              title="Top Releases"
              icon={Layers}
              loading={analyticsLoading}
            >
              {topReleases.length > 0 ? (
                <View className="gap-2">
                  {topReleases.map((r: any, i: number) => (
                    <LeaderboardRow
                      key={r.id}
                      rank={i + 1}
                      title={r.name}
                      streams={r.streams}
                      revenue={r.revenue}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState label="No releases yet" />
              )}
            </ChartCard>

            {/* ── SCATTER INSIGHT ── */}
            <ChartCard
              title="Streams vs Revenue"
              icon={BarChart3}
              loading={analyticsLoading}
            >
              <ChartErrorBoundary fallbackLabel="Couldn't render this chart">
                {scatterData.length > 0 ? (
                  <ScatterInsightChart
                    data={scatterData.map((d: any) => ({
                      x: d.x,
                      y: d.y,
                      label: d.name,
                    }))}
                    width={CHART_WIDTH - 40}
                    height={200}
                  />
                ) : (
                  <EmptyState label="Not enough data yet" />
                )}
              </ChartErrorBoundary>
            </ChartCard>

            {/* ── CREATION STATS ── */}
            {(creationStats || streamingStats) && (
              <View className="flex-row gap-3 mt-6">
                <CreationStatCard
                  icon={Zap}
                  label="Total Creations"
                  value={String(creationStats?.total_creations ?? 0)}
                  revenue={creationStats?.total_creation_revenue ?? 0}
                  color={ACCENT.violet}
                />
                <CreationStatCard
                  icon={Headphones}
                  label="Total Streams"
                  value={formatNumber(streamingStats?.total_streams ?? 0)}
                  revenue={streamingStats?.total_streaming_revenue ?? 0}
                  color={ACCENT.emerald}
                />
              </View>
            )}

            {/* ── SALES TYPE BREAKDOWN ── */}
            {salesTypeDistribution.length > 0 && (
              <ChartCard
                title="Sales Type Breakdown"
                icon={DollarSign}
                loading={analyticsLoading}
              >
                <View className="gap-4">
                  {salesTypeDistribution.map((s: any) => {
                    const totalRev = salesTypeDistribution.reduce(
                      (sum: number, x: any) => sum + (x.revenue || 0),
                      0,
                    );
                    const pct = totalRev
                      ? Math.round((s.revenue / totalRev) * 100)
                      : 0;
                    return (
                      <View key={s.name}>
                        <View className="flex-row justify-between mb-1.5">
                          <Text className="text-sm font-semibold text-slate-700">
                            {s.name}
                          </Text>
                          <Text className="text-sm font-bold text-slate-800">
                            ${(s.revenue || 0).toFixed(2)}
                          </Text>
                        </View>
                        <View className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <View
                            style={{
                              width: `${pct}%`,
                              backgroundColor: ACCENT.amber,
                            }}
                            className="h-2.5 rounded-full"
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ChartCard>
            )}

            {/* ── PLATFORM COMPARISON (creation vs streaming) ── */}
            {platformDistribution.length > 0 && (
              <ChartCard
                title="Creation vs Streaming Revenue"
                icon={Radio}
                loading={analyticsLoading}
              >
                <View className="gap-4">
                  {platformDistribution.map((p: any) => {
                    const creation = p.creation_revenue || 0;
                    const streaming = p.revenue || 0;
                    const max = Math.max(creation, streaming, 1);
                    return (
                      <View key={p.platform}>
                        <Text className="text-sm font-semibold text-slate-700 mb-1.5">
                          {p.platform}
                        </Text>
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-[10px] w-16 text-slate-400">
                            Creation
                          </Text>
                          <View className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <View
                              style={{
                                width: `${(creation / max) * 100}%`,
                                backgroundColor: ACCENT.violet,
                              }}
                              className="h-2 rounded-full"
                            />
                          </View>
                          <Text className="text-[10px] text-slate-400 w-14 text-right">
                            ${creation.toFixed(0)}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-[10px] w-16 text-slate-400">
                            Streaming
                          </Text>
                          <View className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <View
                              style={{
                                width: `${(streaming / max) * 100}%`,
                                backgroundColor: ACCENT.emerald,
                              }}
                              className="h-2 rounded-full"
                            />
                          </View>
                          <Text className="text-[10px] text-slate-400 w-14 text-right">
                            ${streaming.toFixed(0)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ChartCard>
            )}

            {/* ── CREATION TRACK LIST ── */}
            {topCreationTracks.length > 0 && (
              <ChartCard
                title="Top Creation Tracks"
                icon={Zap}
                loading={analyticsLoading}
              >
                <View className="gap-2">
                  {topCreationTracks.map((t: any, i: number) => (
                    <LeaderboardRow
                      key={t.id ?? t.title}
                      rank={i + 1}
                      title={t.title}
                      streams={t.quantity}
                      revenue={t.revenue}
                    />
                  ))}
                </View>
              </ChartCard>
            )}

            {/* ── AVAILABLE REPORTS ── */}
            <View className="mt-6 bg-white/80 border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <View className="px-4 pt-4 pb-3 border-b border-slate-100">
                <SectionLabel icon={Layers}>Available Reports</SectionLabel>
                <Text className="text-xs text-slate-400 ml-6 -mt-1 mb-2">
                  Official reports uploaded by your admin
                </Text>
                <SearchInput
                  value={searchReports}
                  onChange={setSearchReports}
                  placeholder="Search reports…"
                />
              </View>
              <View className="p-3 gap-2">
                {filteredReportList.length > 0 ? (
                  filteredReportList.map((r) => (
                    <ReportRow
                      key={r.id}
                      report={r}
                      streams={getReportStreams(r)}
                      revenue={getReportRevenue(r)}
                      isDownloading={downloadingId === r.id}
                      onDownload={() => handleDownloadWithLoading(r.id)}
                    />
                  ))
                ) : (
                  <Text className="text-center text-slate-400 py-8 text-sm">
                    No reports match your search.
                  </Text>
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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <View
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
      style={{ width: (SCREEN_WIDTH - 32 - 12) / 2 }}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: `${color}1A` }}
      >
        <Icon size={16} color={color} />
      </View>
      <Text className="text-xs text-slate-400 font-medium">{label}</Text>
      <Text className="text-lg font-bold text-slate-900 mt-0.5">{value}</Text>
      <Text className="text-[10px] text-slate-400 mt-0.5">{sub}</Text>
    </View>
  );
}

function CreationStatCard({
  icon: Icon,
  label,
  value,
  revenue,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  revenue: number;
  color: string;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: `${color}1A` }}
      >
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

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: any;
  children: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5 mb-2">
      <Icon size={13} color="#3b82f6" />
      <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {children}
      </Text>
    </View>
  );
}

function Pill({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full border ${active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
    >
      <Text
        className={`text-xs font-medium ${active ? "text-blue-600" : "text-slate-500"}`}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
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
      <Text className="text-xs text-emerald-600 font-medium mt-1">
        {formatNumber(streams)} streams
      </Text>
      <Text className="text-xs text-amber-600 font-medium">
        ${revenue.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
  loading,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <View className="mt-6 bg-white/80 border border-slate-100 rounded-2xl shadow-sm p-4">
      <View className="flex-row items-center gap-2 mb-4">
        <Icon size={15} color="#3b82f6" />
        <Text className="text-sm font-bold text-slate-800">{title}</Text>
        {loading && (
          <ActivityIndicator
            size="small"
            color="#3b82f6"
            style={{ marginLeft: "auto" }}
          />
        )}
      </View>
      {children}
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View className="items-center justify-center py-8">
      <Text className="text-xs text-slate-400">{label}</Text>
    </View>
  );
}

/* Catches render-time errors thrown by chart libraries (e.g. gifted-charts
   choking on edge-case data such as a single data point on web) so a bad
   dataset only blanks out one card instead of crashing the whole screen. */
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackLabel?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallbackLabel?: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("Chart render error:", error);
  }
  render() {
    if (this.state.hasError) {
      return <EmptyState label={this.props.fallbackLabel || "Couldn't render this chart"} />;
    }
    return this.props.children;
  }
}

function LeaderboardRow({
  rank,
  title,
  sub,
  streams,
  revenue,
}: {
  rank: number;
  title: string;
  sub?: string;
  streams: number;
  revenue: number;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
        <Text className="text-xs font-bold text-blue-600">{rank}</Text>
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="text-sm font-semibold text-slate-800"
        >
          {title}
        </Text>
        {!!sub && <Text className="text-xs text-slate-400">{sub}</Text>}
      </View>
      <View className="items-end">
        <Text className="text-xs font-semibold text-emerald-600">
          {formatNumber(streams)}
        </Text>
        <Text className="text-xs font-semibold text-amber-600">
          ${revenue.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

function ReportRow({
  report,
  streams,
  revenue,
  onDownload,
  isDownloading,
}: {
  report: any;
  streams: number;
  revenue: number;
  onDownload: () => void;
  isDownloading?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3">
      <View className="flex-row items-center gap-3 flex-1 min-w-0">
        <View className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center">
          <Music size={14} color="#3b82f6" />
        </View>
        <View className="flex-1 min-w-0">
          <Text
            numberOfLines={1}
            className="text-sm font-semibold text-slate-800"
          >
            {report.release_title || "Untitled"}
          </Text>
          <Text numberOfLines={1} className="text-[11px] text-slate-400">
            {report.created_at
              ? new Date(report.created_at).toLocaleDateString()
              : "—"}{" "}
            · {formatNumber(streams)} streams · $
            {revenue.toFixed(1)} · {report.line_count || 0}{" "}
            rows
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onDownload}
        disabled={isDownloading}
        activeOpacity={0.7}
        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
          isDownloading ? "border-blue-200 bg-blue-50" : "border-slate-200"
        }`}
        style={{ minWidth: 76, justifyContent: "center" }}
      >
        {isDownloading ? (
          <>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className="text-xs font-semibold text-blue-600">
              Getting…
            </Text>
          </>
        ) : (
          <>
            <Download size={12} color="#64748b" />
            <Text className="text-xs font-semibold text-slate-500">Get</Text>
          </>
        )}
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
  const scaleY = (v: number) =>
    height - padding - (v / maxY) * (height - padding * 1.5);

  return (
    <Svg width={width} height={height}>
      <SvgLine
        x1={padding}
        y1={0}
        x2={padding}
        y2={height - padding}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
      <SvgLine
        x1={padding}
        y1={height - padding}
        x2={width}
        y2={height - padding}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
      <SvgText x={2} y={12} fontSize={9} fill="#94a3b8">
        Revenue
      </SvgText>
      <SvgText x={width - 46} y={height - 8} fontSize={9} fill="#94a3b8">
        Streams
      </SvgText>

      {data.map((d, i) => (
        <Circle
          key={`${d.label}-${i}`}
          cx={scaleX(d.x)}
          cy={scaleY(d.y)}
          r={6}
          fill="#3b82f6"
          opacity={0.75}
        />
      ))}
    </Svg>
  );
}