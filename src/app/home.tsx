import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useExitOnBack } from "@/hooks/useExitOnBack";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../components/Footer";
import { useDashboardData } from "../hooks/useDashboardData"; // ⚠️ adjust path if needed

const ACCENT = "#7C3AED";
const ACCENT_DARK = "#4c1d95";

type StatusStyleConfig = { bg: string; text: string; dot: string };

const STATUS_STYLES: Record<string, StatusStyleConfig> = {
  Live: { bg: "bg-green-100", text: "text-green-700", dot: "#16a34a" },
  Draft: { bg: "bg-slate-100", text: "text-slate-600", dot: "#64748b" },
  Review: { bg: "bg-amber-100", text: "text-amber-700", dot: "#d97706" },
  Rejected: { bg: "bg-red-100", text: "text-red-700", dot: "#dc2626" },
};

function formatCurrency(value: number) {
  return `$${(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

/* ────────────────────────────────────────────────────────────────
   Skeleton — pulsing placeholder block shown while data is loading.
   Lets the screen render its shell instantly instead of blocking on
   a full-page spinner, which is what makes the dashboard feel fast.
──────────────────────────────────────────────────────────────── */
function Skeleton({
  width,
  height,
  radius = 8,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: any;
}) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: "#e2e8f0",
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

/* Fade + slide-up entrance, staggered by index for a lively load-in. */
function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/* Pressable wrapper with a subtle scale-down tap animation. */
function Tappable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function HomePage() {
  useExitOnBack();
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
  const { signOut, user: userProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    await signOut(); // clears SecureStore + signs out Supabase
    router.replace("/");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const statCards = [
    {
      key: "totalReleases",
      icon: "music" as const,
      title: "Total Releases",
      value: String(stats.totalReleases),
      featured: true,
    },
    {
      key: "liveReleases",
      icon: "check-circle" as const,
      title: "Live Releases",
      value: String(stats.liveReleases),
    },
    {
      key: "revenue",
      icon: "trending-up" as const,
      title: "Revenue",
      value: formatCurrency(totalRevenue),
    },
    {
      key: "platforms",
      icon: "globe" as const,
      title: "Platforms",
      value: String(stats.activePlatforms),
    },
  ];

  const quickLinks = [
    { label: "View Revenue", icon: "dollar-sign" as const, path: "/revenue" as const },
    { label: "Manage Releases", icon: "disc" as const, path: "/Release" as const },
    { label: "Rights Management", icon: "shield" as const, path: "/rights" as const },
    { label: "Support", icon: "message-square" as const, path: "/support" as const },
  ];

  const firstName = userProfile?.email?.split("@")[0] ?? "there";

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
              paddingTop: 24,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={ACCENT}
                colors={[ACCENT]}
              />
            }
          >
            {/* ── HEADER ── */}
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-row items-center gap-3">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-lg">
                  <Text className="text-xl font-bold text-white">MC</Text>
                </View>
                <View>
                  <Text className="text-2xl font-bold text-gray-900">
                    Dashboard
                  </Text>
                  <Text className="mt-0.5 text-sm text-gray-500">
                    Movement Creations Studio
                  </Text>
                </View>
              </View>

              <Tappable onPress={handleLogout}>
                <View className="h-11 w-11 items-center justify-center rounded-xl border border-violet-100 bg-white shadow">
                  <Feather name="log-out" size={19} color={ACCENT} />
                </View>
              </Tappable>
            </View>

            {/* ── WELCOME BANNER ── */}
            <FadeIn delay={0} style={{ marginTop: 20 }}>
              <LinearGradient
                colors={[ACCENT_DARK, ACCENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 20 }}
              >
                <Text className="text-white/70 text-sm font-medium">
                  {getGreeting()},
                </Text>
                <Text
                  className="text-white text-xl font-bold mt-0.5"
                  numberOfLines={1}
                >
                  {firstName}
                </Text>
                <Text className="text-white/60 text-xs mt-1">
                  Here's what's happening with your music today.
                </Text>
              </LinearGradient>
            </FadeIn>

            {/* ── ERROR STATE ── */}
            {!!error && (
              <FadeIn delay={0} style={{ marginTop: 16 }}>
                <View className="flex-row items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <Feather name="alert-circle" size={16} color="#dc2626" />
                  <Text className="flex-1 text-sm text-red-600">{error}</Text>
                  <Tappable onPress={refetch}>
                    <Text className="text-sm font-semibold text-red-700">
                      Retry
                    </Text>
                  </Tappable>
                </View>
              </FadeIn>
            )}

            {/* ── STAT CARDS ── */}
            <View className="mt-6 flex-row flex-wrap justify-between gap-y-4">
              {statCards.map((item, i) =>
                loading ? (
                  <View
                    key={item.key}
                    className="w-[48%] rounded-2xl border border-violet-50 bg-white p-5 shadow"
                  >
                    <Skeleton width={40} height={40} radius={12} />
                    <Skeleton
                      width={60}
                      height={22}
                      radius={6}
                      style={{ marginTop: 16 }}
                    />
                    <Skeleton
                      width={80}
                      height={10}
                      radius={4}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                ) : (
                  <FadeIn
                    key={item.key}
                    delay={i * 70}
                    style={{ width: "48%" }}
                  >
                    {item.featured ? (
                      <LinearGradient
                        colors={[ACCENT_DARK, ACCENT]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ borderRadius: 16, padding: 16 }}
                      >
                        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                          <Feather name={item.icon} size={18} color="#fff" />
                        </View>
                        <Text className="mt-4 text-2xl font-bold text-white">
                          {item.value}
                        </Text>
                        <Text className="mt-1 text-white/80 text-xs uppercase tracking-wide">
                          {item.title}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View className="rounded-2xl border border-violet-50 bg-white p-5 shadow">
                        <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                          <Feather name={item.icon} size={18} color={ACCENT} />
                        </View>
                        <Text className="mt-4 text-gray-500">
                          {item.title}
                        </Text>
                        <Text className="mt-1 text-2xl font-bold text-gray-900">
                          {item.value}
                        </Text>
                      </View>
                    )}
                  </FadeIn>
                ),
              )}
            </View>

            {/* ── REVENUE OVERVIEW ── */}
            <View className="mt-8">
              <Text className="text-xl font-bold text-gray-900">
                Revenue Overview
              </Text>

              <View className="mt-4 gap-3">
                {[
                  {
                    key: "total",
                    label: "Total Revenue",
                    value: totalRevenue,
                    icon: "attach-money" as const,
                    iconSet: "material" as const,
                    bg: "bg-emerald-50",
                    color: "#059669",
                    card: "border border-violet-50 bg-white",
                    labelColor: "text-gray-500",
                    valueColor: "text-gray-900",
                    link: false,
                  },
                  {
                    key: "last",
                    label: "Last Transaction",
                    value: lastTransaction,
                    icon: "calendar" as const,
                    iconSet: "feather" as const,
                    bg: "bg-indigo-50",
                    color: "#4f46e5",
                    card: "border border-violet-50 bg-white",
                    labelColor: "text-gray-500",
                    valueColor: "text-gray-900",
                    link: false,
                  },
                  {
                    key: "outstanding",
                    label: "Outstanding Balance",
                    value: outstandingBalance,
                    icon: "clock" as const,
                    iconSet: "feather" as const,
                    bg: "bg-white",
                    color: "#0f766e",
                    card: "border border-teal-100 bg-teal-50",
                    labelColor: "text-teal-700",
                    valueColor: "text-teal-900",
                    link: true,
                  },
                ].map((row, i) => (
                  <FadeIn key={row.key} delay={i * 70}>
                    <View className={`rounded-2xl p-5 shadow ${row.card}`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <View
                            className={`h-10 w-10 items-center justify-center rounded-xl ${row.bg}`}
                          >
                            {row.iconSet === "material" ? (
                              <MaterialIcons
                                name={row.icon as any}
                                size={20}
                                color={row.color}
                              />
                            ) : (
                              <Feather
                                name={row.icon as any}
                                size={18}
                                color={row.color}
                              />
                            )}
                          </View>
                          <View>
                            <Text className={`text-sm ${row.labelColor}`}>
                              {row.label}
                            </Text>
                            {loading ? (
                              <Skeleton
                                width={90}
                                height={20}
                                radius={6}
                                style={{ marginTop: 4 }}
                              />
                            ) : (
                              <Text
                                className={`text-lg font-bold ${row.valueColor}`}
                              >
                                {formatCurrency(row.value)}
                              </Text>
                            )}
                          </View>
                        </View>
                        {row.link && (
                          <Tappable onPress={() => router.push("/revenue")}>
                            <Feather
                              name="arrow-up-right"
                              size={18}
                              color="#0f766e"
                            />
                          </Tappable>
                        )}
                      </View>
                    </View>
                  </FadeIn>
                ))}
              </View>
            </View>

            {/* ── RECENT RELEASES ── */}
            <View className="mt-8 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">
                Recent Releases
              </Text>
              <Tappable onPress={() => router.push("/Release")}>
                <Text className="font-semibold text-violet-600">
                  View All
                </Text>
              </Tappable>
            </View>

            <View className="mt-4 gap-3">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <View
                    key={i}
                    className="rounded-2xl border border-violet-50 bg-white p-5 shadow"
                  >
                    <Skeleton width="70%" height={18} radius={6} />
                    <Skeleton
                      width="40%"
                      height={12}
                      radius={4}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                ))
              ) : recentReleases.length === 0 ? (
                <View className="items-center justify-center rounded-2xl border border-violet-50 bg-white py-10">
                  <Feather name="music" size={28} color="#cbd5e1" />
                  <Text className="mt-2 text-sm text-gray-400">
                    No releases yet
                  </Text>
                </View>
              ) : (
                recentReleases.map((release, i) => {
                  const s =
                    STATUS_STYLES[release.status] || STATUS_STYLES.Draft;
                  return (
                    <FadeIn key={release.id} delay={i * 70}>
                      <Tappable onPress={() => router.push("/Release")}>
                        <View className="rounded-2xl border border-violet-50 bg-white p-5 shadow">
                          <View className="flex-row items-center justify-between gap-4">
                            <View className="flex-1">
                              <Text
                                numberOfLines={1}
                                className="text-lg font-bold text-gray-900"
                              >
                                {release.title}
                              </Text>
                              <Text className="mt-1 text-gray-500">
                                {release.primary_artist}
                              </Text>
                            </View>
                            <View
                              className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${s.bg}`}
                            >
                              <View
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: s.dot }}
                              />
                              <Text
                                className={`text-sm font-semibold ${s.text}`}
                              >
                                {release.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Tappable>
                    </FadeIn>
                  );
                })
              )}
            </View>

            {/* ── QUICK LINKS ── */}
            <View className="mt-8">
              <Text className="text-xl font-bold text-gray-900">
                Quick Links
              </Text>
              <View className="mt-4 flex-row flex-wrap gap-3">
                {quickLinks.map((link, i) => (
                  <FadeIn
                    key={link.label}
                    delay={i * 60}
                    style={{ width: "47%" }}
                  >
                    <Tappable onPress={() => router.push(link.path)}>
                      <View className="flex-row items-center gap-2.5 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3.5">
                        <Feather name={link.icon} size={16} color={ACCENT} />
                        <Text className="flex-1 text-sm font-medium text-violet-700">
                          {link.label}
                        </Text>
                      </View>
                    </Tappable>
                  </FadeIn>
                ))}
              </View>
            </View>

            <Tappable
              onPress={() => router.push("/revenue")}
              style={{ marginTop: 24 }}
            >
              <View className="flex-row items-center justify-center rounded-xl border border-gray-300 bg-white py-4 shadow">
                <Feather name="bar-chart-2" size={20} color="#666" />
                <Text className="ml-2 text-lg font-semibold text-gray-700">
                  View Analytics
                </Text>
              </View>
            </Tappable>
          </ScrollView>

          <Footer />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}