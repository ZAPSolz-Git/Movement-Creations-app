// src/hooks/useReportsData.ts
//
// Mobile port of the web useReportsData hook.
// Differences from web version:
//   - uses apiClient (your 401-refresh-retry axios instance) instead of raw axios + localStorage
//   - reads user id from SupabaseAuthContext instead of localStorage.getItem("user_id")
//   - download handler is stubbed (RN needs expo-file-system / expo-sharing, see note at bottom)
//
// Adjust the two import paths below to match your actual file locations.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { apiClient } from "../lib/apiClient";
import { Platform } from "react-native";
// ── platform color map (port from your web constants) ──────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  Spotify: "#22c55e",
  "Apple Music": "#ec4899",
  "Amazon Music": "#0ea5e9",
  "YouTube Music": "#f43f5e",
};
const DEFAULT_PLATFORM_COLOR = "#eab308";

const getPlatformColor = (platform: string) =>
  PLATFORM_COLORS[platform] || DEFAULT_PLATFORM_COLOR;

const safeNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// analytics rows come back with different key names depending on endpoint
// (streams vs quantity, revenue vs creation_revenue etc) — these normalize them
const getStreams = (d: any) =>
  safeNum(d?.streams ?? d?.quantity ?? d?.creations);
const getRevenue = (d: any) => safeNum(d?.revenue ?? d?.creation_revenue);

export interface UseReportsDataFilters {
  selectedReleases: string[];
  selectedMonths: string[];
  selectedPlatforms: string[];
}

export function useReportsData({
  selectedReleases,
  selectedMonths,
  selectedPlatforms,
}: UseReportsDataFilters) {
  const { user } = useAuth(); // expects { user: { id, ... } | null }

  const [reports, setReports] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch reports list ─────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // apiClient already attaches the Bearer token via interceptor
      const res = await apiClient.get("/api/reports/user");
      setReports(res.data || []);
    } catch (err) {
      console.error("Failed to fetch reports", err);
      setError("Couldn't load your reports. Pull to refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch analytics ─────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;
    setAnalyticsLoading(true);
    try {
      const res = await apiClient.get("/api/reports/analytics", {
        params: { user_id: user.id },
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (reports.length) fetchAnalytics();
  }, [reports.length, fetchAnalytics]);

  // ── Raw platform data (DSP-level) ───────────────────────────────────────
  const rawPlatformData = useMemo(() => {
    if (!analytics?.platform_distribution) return [];
    return analytics.platform_distribution.map((d: any) => ({
      name: d.platform,
      streams: getStreams(d),
      revenue: getRevenue(d),
      color: getPlatformColor(d.platform),
    }));
  }, [analytics]);

  // ── Grand totals (waterfall fallback chain) ─────────────────────────────
  const grandTotalStreams = useMemo(() => {
    const fromPlatform = rawPlatformData.reduce(
      (s: number, d: any) => s + d.streams,
      0,
    );
    if (fromPlatform > 0) return fromPlatform;
    const fromMonthly = (analytics?.monthly_streams || []).reduce(
      (s: number, d: any) => s + getStreams(d),
      0,
    );
    if (fromMonthly > 0) return fromMonthly;
    const fromReleases = (analytics?.top_releases || []).reduce(
      (s: number, r: any) => s + getStreams(r),
      0,
    );
    if (fromReleases > 0) return fromReleases;
    return reports.reduce((s, r) => s + safeNum(r.total_streams), 0);
  }, [rawPlatformData, analytics, reports]);

  const grandTotalRevenue = useMemo(() => {
    const fromPlatform = rawPlatformData.reduce(
      (s: number, d: any) => s + d.revenue,
      0,
    );
    if (fromPlatform > 0) return fromPlatform;
    const fromMonthly = (analytics?.monthly_revenue || []).reduce(
      (s: number, d: any) => s + getRevenue(d),
      0,
    );
    if (fromMonthly > 0) return fromMonthly;
    const fromReleases = (analytics?.top_releases || []).reduce(
      (s: number, r: any) => s + getRevenue(r),
      0,
    );
    if (fromReleases > 0) return fromReleases;
    return reports.reduce((s, r) => s + safeNum(r.total_revenue), 0);
  }, [rawPlatformData, analytics, reports]);

  // ── Per-report metrics (mirrors web hook's releaseStreamsMap) ───────────
  const releaseStreamsMap = useMemo(() => {
    const map: Record<string, { streams: number; revenue: number }> = {};

    reports.forEach((report) => {
      map[report.id] = {
        streams: safeNum(report.total_streams),
        revenue: safeNum(report.total_revenue),
      };
    });

    (analytics?.top_releases || []).forEach((release: any) => {
      const matchingReport = reports.find(
        (rep) =>
          rep.id === release.id ||
          rep.release_title?.toLowerCase().trim() ===
            release.title?.toLowerCase().trim(),
      );
      if (matchingReport && map[matchingReport.id]) {
        const streams = getStreams(release);
        const revenue = getRevenue(release);
        if (streams > 0) map[matchingReport.id].streams = streams;
        if (revenue > 0) map[matchingReport.id].revenue = revenue;
      }
    });

    (analytics?.top_tracks || []).forEach((track: any) => {
      const parentReport = reports.find(
        (rep) =>
          rep.id === track.release_id ||
          rep.id === track.report_id ||
          rep.release_title
            ?.toLowerCase()
            .includes(track.title?.toLowerCase().substring(0, 20)),
      );
      if (parentReport && map[parentReport.id]) {
        map[parentReport.id].streams += getStreams(track);
        map[parentReport.id].revenue += getRevenue(track);
      }
    });

    (analytics?.top_creation_tracks || []).forEach((track: any) => {
      const parentReport = reports.find((rep) =>
        rep.release_title
          ?.toLowerCase()
          .includes(track.title?.toLowerCase().substring(0, 20)),
      );
      if (parentReport && map[parentReport.id]) {
        map[parentReport.id].streams += track.quantity || 0;
        map[parentReport.id].revenue += track.revenue || 0;
      }
    });

    return map;
  }, [analytics, reports]);

  const getReportStreams = useCallback(
    (report: any) => {
      const metrics = releaseStreamsMap[report.id];
      if (metrics && metrics.streams > 0) return metrics.streams;
      return safeNum(report.total_streams);
    },
    [releaseStreamsMap],
  );

  const getReportRevenue = useCallback(
    (report: any) => {
      const metrics = releaseStreamsMap[report.id];
      if (metrics && metrics.revenue > 0) return metrics.revenue;
      return safeNum(report.total_revenue);
    },
    [releaseStreamsMap],
  );

  const topReport = useMemo(() => {
    if (!reports.length) return null;
    return reports.reduce(
      (best, r) => (getReportStreams(r) > getReportStreams(best) ? r : best),
      reports[0],
    );
  }, [reports, getReportStreams]);

  const allPlatforms = useMemo<string[]>(
    () => rawPlatformData.map((d: { name: string }) => d.name),
    [rawPlatformData],
  );

  const allMonths = useMemo<string[]>(() => {
    if (!analytics) return [];
    return Array.from(
      new Set([
        ...(analytics.monthly_streams || []).map((d: any) => d.period),
        ...(analytics.monthly_revenue || []).map((d: any) => d.period),
      ]),
    ).sort() as string[];
  }, [analytics]);

  const monthlyChartData = useMemo(
    () =>
      (analytics?.monthly_streams || [])
        .filter(
          (d: any) =>
            !selectedMonths.length || selectedMonths.includes(d.period),
        )
        .map((d: any, i: number) => ({
          month: d.period,
          Streams: getStreams(d),
          Creations: analytics?.monthly_creations?.[i]?.creations || 0,
          Revenue: analytics?.monthly_revenue?.[i]
            ? getRevenue(analytics.monthly_revenue[i])
            : 0,
        })),
    [analytics, selectedMonths],
  );

  const platformChartData = useMemo(
    () =>
      rawPlatformData.filter(
        (d: any) =>
          !selectedPlatforms.length || selectedPlatforms.includes(d.name),
      ),
    [rawPlatformData, selectedPlatforms],
  );

  const topTracks = useMemo(
    () =>
      (analytics?.top_tracks || []).slice(0, 8).map((t: any, idx: number) => ({
        ...t,
        name: t.title || t.track_title || "Unknown Track",
        streams: getStreams(t),
        revenue: getRevenue(t),
        rank: idx + 1,
      })),
    [analytics],
  );

  const topReleases = useMemo(() => {
    if (!reports.length) return [];
    return [...reports]
      .map((r) => ({
        ...r,
        name: r.release_title || "Untitled",
        streams: getReportStreams(r),
        revenue: getReportRevenue(r),
      }))
      .sort((a, b) => b.streams - a.streams)
      .slice(0, 6);
  }, [reports, getReportStreams, getReportRevenue]);

  const territoryData = useMemo(
    () =>
      (analytics?.territory_distribution || []).slice(0, 8).map((t: any) => ({
        ...t,
        streams: getStreams(t),
        revenue: getRevenue(t),
      })),
    [analytics],
  );

  const scatterData = useMemo(
    () =>
      topReleases.map((r) => ({
        name: r.name,
        x: r.streams,
        y: r.revenue,
      })),
    [topReleases],
  );

  // ── Download handler ─────────────────────────────────────────────────────
  // RN can't do the blob+<a> trick from web. Use expo-file-system to download
  // to cache, then expo-sharing to hand it off to the OS share sheet.
  // npx expo install expo-file-system expo-sharing
const handleDownload = useCallback(async (id: string) => {
  const url = `${apiClient.defaults.baseURL}/api/report/download/${id}`;
  const token = apiClient.defaults.headers?.common?.Authorization as string | undefined;

  if (Platform.OS === "web") {
    const res = await fetch(url, { headers: token ? { Authorization: token } : undefined });
    if (!res.ok) return;
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: objUrl, download: `report-${id}.pdf` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
    return;
  }

  try {
    // legacy subpath keeps cacheDirectory / downloadAsync (removed from
    // the top-level export in the SDK 54 File/Directory rewrite)
    const FileSystem = await import("expo-file-system/legacy");
    const Sharing = await import("expo-sharing");

    const dest = `${FileSystem.cacheDirectory}report-${id}.pdf`;
    const { uri } = await FileSystem.downloadAsync(url, dest, {
      headers: token ? { Authorization: token } : undefined,
    });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  } catch (err) {
    console.error("Download error:", err);
  }
}, []);
  return {
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
    refetch: fetchReports,
  };
}
