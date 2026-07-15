import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../components/Footer";
import { useDashboardData } from "../hooks/useDashboardData"; // ⚠️ adjust path if needed

const ACCENT = "#7C3AED";
const ACCENT_DARK = "#4c1d95";

type StatusStyleConfig = {
  bg: string;
  text: string;
};

const STATUS_STYLES: Record<string, StatusStyleConfig> = {
  Live: { bg: "bg-green-100", text: "text-green-700" },
  Draft: { bg: "bg-slate-100", text: "text-slate-600" },
  Review: { bg: "bg-amber-100", text: "text-amber-700" },
  Rejected: { bg: "bg-red-100", text: "text-red-700" },
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function HomePage() {
  const {
    stats,
    totalRevenue,
    lastTransaction,
    outstandingBalance,
    recentReleases,
    loading,
    error,
    refetch,
  } = useDashboardData();

  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    router.replace("/");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const statCards = [
    {
      icon: "music" as const,
      title: "Total Releases",
      value: String(stats.totalReleases),
      featured: true,
    },
    {
      icon: "check-circle" as const,
      title: "Live Releases",
      value: String(stats.liveReleases),
    },
    {
      icon: "trending-up" as const,
      title: "Revenue",
      value: formatCurrency(totalRevenue),
    },
    {
      icon: "globe" as const,
      title: "Platforms",
      value: String(stats.activePlatforms),
    },
  ];

  return (
    <LinearGradient
      colors={["#F5EEFF", "#F8F8FC", "#FFFFFF"]}
      style={{ flex: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 150,
              paddingTop: 32,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            {/* ── HEADER (logout kept exactly where it was) ── */}
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

            {/* ── WELCOME BANNER ── */}
            <LinearGradient
              colors={[ACCENT_DARK, ACCENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 20, marginTop: 24 }}
            >
              <Text className="text-white/70 text-sm font-medium">
                Welcome back,
              </Text>
              <Text className="text-white text-xl font-bold mt-0.5">
                Let's check today's numbers
              </Text>
              <Text className="text-white/60 text-xs mt-1">
                Here's what's happening with your music platform today.
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/release")}
                className="mt-5 flex-row items-center justify-center rounded-xl bg-white/15 border border-white/20 py-3.5"
              >
                <Feather name="upload-cloud" size={18} color="#fff" />
                <Text className="ml-2 text-base font-bold text-white">
                  Upload New Release
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* ── ERROR STATE ── */}
            {!!error && (
              <View className="mt-4 flex-row items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <Feather name="alert-circle" size={16} color="#dc2626" />
                <Text className="flex-1 text-sm text-red-600">{error}</Text>
                <TouchableOpacity onPress={refetch}>
                  <Text className="text-sm font-semibold text-red-700">
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STAT CARDS ── */}
            <View className="mt-6 flex-row flex-wrap justify-between gap-2">
              {statCards.map((item) => (
                <View
                  key={item.title}
                  className={`mb-4 w-[48%] rounded-2xl p-5 shadow ${
                    item.featured ? "" : "border border-violet-50 bg-white"
                  }`}
                  style={item.featured ? undefined : undefined}
                >
                  {item.featured ? (
                    <LinearGradient
                      colors={[ACCENT_DARK, ACCENT]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        padding: 16,
                        margin: -20,
                      }}
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                        <Feather name={item.icon} size={18} color="#fff" />
                      </View>
                      {loading ? (
                        <View className="mt-4 h-8 w-16 rounded-lg bg-white/20" />
                      ) : (
                        <Text className="mt-4 text-2xl font-bold text-white">
                          {item.value}
                        </Text>
                      )}
                      <Text className="mt-1 text-white/80 text-xs uppercase tracking-wide">
                        {item.title}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <>
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                        <Feather name={item.icon} size={18} color="#7C3AED" />
                      </View>
                      <Text className="mt-4 text-gray-500">{item.title}</Text>
                      {loading ? (
                        <View className="mt-1 h-7 w-14 rounded-lg bg-slate-100" />
                      ) : (
                        <Text className="mt-1 text-2xl font-bold text-gray-900">
                          {item.value}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              ))}
            </View>

            {/* ── REVENUE OVERVIEW ── */}
            <View className="mt-2">
              <Text className="text-xl font-bold text-gray-900 md:text-2xl">
                Revenue Overview
              </Text>

              <View className="mt-4 gap-3">
                <View className="rounded-2xl border border-violet-50 bg-white p-5 shadow">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                        <MaterialIcons
                          name="attach-money"
                          size={20}
                          color="#059669"
                        />
                      </View>
                      <View>
                        <Text className="text-sm text-gray-500">
                          Total Revenue
                        </Text>
                        {loading ? (
                          <View className="mt-1 h-6 w-20 rounded bg-slate-100" />
                        ) : (
                          <Text className="text-lg font-bold text-gray-900">
                            {formatCurrency(totalRevenue)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                <View className="rounded-2xl border border-violet-50 bg-white p-5 shadow">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                        <Feather name="calendar" size={18} color="#4f46e5" />
                      </View>
                      <View>
                        <Text className="text-sm text-gray-500">
                          Last Transaction
                        </Text>
                        {loading ? (
                          <View className="mt-1 h-6 w-20 rounded bg-slate-100" />
                        ) : (
                          <Text className="text-lg font-bold text-gray-900">
                            {formatCurrency(lastTransaction)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                <View className="rounded-2xl border border-teal-100 bg-teal-50 p-5 shadow">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                        <Feather name="clock" size={18} color="#0f766e" />
                      </View>
                      <View>
                        <Text className="text-sm text-teal-700">
                          Outstanding Balance
                        </Text>
                        {loading ? (
                          <View className="mt-1 h-6 w-20 rounded bg-white/60" />
                        ) : (
                          <Text className="text-lg font-bold text-teal-900">
                            {formatCurrency(outstandingBalance)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push("/revenue")}>
                      <Feather
                        name="arrow-up-right"
                        size={18}
                        color="#0f766e"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* ── RECENT RELEASES ── */}
            <View className="mt-8 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Text className="text-xl font-bold text-gray-900 md:text-2xl">
                Recent Releases
              </Text>

              <TouchableOpacity onPress={() => router.push("/release")}>
                <Text className="font-semibold text-violet-600">View All</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-4 gap-3">
              {loading ? (
                <View className="items-center justify-center rounded-2xl border border-violet-50 bg-white py-10">
                  <ActivityIndicator size="small" color={ACCENT} />
                  <Text className="mt-2 text-sm text-gray-400">
                    Loading releases…
                  </Text>
                </View>
              ) : recentReleases.length === 0 ? (
                <View className="items-center justify-center rounded-2xl border border-violet-50 bg-white py-10">
                  <Feather name="music" size={28} color="#cbd5e1" />
                  <Text className="mt-2 text-sm text-gray-400">
                    No releases yet
                  </Text>
                </View>
              ) : (
                recentReleases.map((release) => {
                  const s =
                    STATUS_STYLES[release.status] || STATUS_STYLES.Draft;
                  return (
                    <TouchableOpacity
                      key={release.id}
                      onPress={() => router.push("/release")}
                      activeOpacity={0.8}
                      className="rounded-2xl border border-violet-50 bg-white p-5 shadow md:p-6"
                    >
                      <View className="flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <View className="flex-1 pr-0 md:pr-4">
                          <Text
                            numberOfLines={1}
                            className="text-lg font-bold text-gray-900 md:text-xl"
                          >
                            {release.title}
                          </Text>
                          <Text className="mt-1 text-gray-500">
                            {release.primary_artist}
                          </Text>
                        </View>

                        <View className={`rounded-full px-3 py-1 ${s.bg}`}>
                          <Text className={`text-sm font-semibold ${s.text}`}>
                            {release.status}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* ── QUICK LINKS ── */}
            <View className="mt-8">
              <Text className="text-xl font-bold text-gray-900 md:text-2xl">
                Quick Links
              </Text>
              <View className="mt-4 flex-row flex-wrap gap-3">
                <QuickLinkCard
                  label="View Revenue"
                  icon="dollar-sign"
                  onPress={() => router.push("/revenue")}
                />
                <QuickLinkCard
                  label="Manage Releases"
                  icon="disc"
                  onPress={() => router.push("/release")}
                />
                <QuickLinkCard
                  label="Rights Management"
                  icon="shield"
                  onPress={() => router.push("/rights")}
                />
                <QuickLinkCard
                  label="Support"
                  icon="message-square"
                  onPress={() => router.push("/support")}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/revenue")}
              className="mt-6 flex-row items-center justify-center rounded-xl border border-gray-300 bg-white py-4 shadow md:py-5"
            >
              <Feather name="bar-chart-2" size={20} color="#666" />
              <Text className="ml-2 text-lg font-semibold text-gray-700 md:text-xl">
                View Analytics
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <Footer />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function QuickLinkCard({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="w-[47%] flex-row items-center gap-2.5 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3.5"
    >
      <Feather name={icon} size={16} color="#7C3AED" />
      <Text className="flex-1 text-sm font-medium text-violet-700">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
