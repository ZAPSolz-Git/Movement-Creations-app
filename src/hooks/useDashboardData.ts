// src/hooks/useDashboardData.ts
//
// Combines revenue + releases data for the mobile home/dashboard screen.
// Reuses useRevenueData and useReleasesData under the hood so there's one
// source of truth for each — no duplicate fetch logic.

import { useMemo } from "react";

import { useReleasesData } from "./useReleaseData";
import { useRevenueData } from "./useRevenueData"; // ⚠️ adjust path if needed

const RECENT_RELEASES_LIMIT = 3;

export function useDashboardData() {
  const {
    totalRevenue,
    lastTransaction,
    outstandingBalance,
    platformBreakdown,
    loading: revenueLoading,
    error: revenueError,
    refetch: refetchRevenue,
  } = useRevenueData();

  const {
    releases,
    loading: releasesLoading,
    error: releasesError,
    refetch: refetchReleases,
  } = useReleasesData("all");

  const recentReleases = useMemo(
    () => releases.slice(0, RECENT_RELEASES_LIMIT),
    [releases],
  );

  const stats = useMemo(
    () => ({
      totalReleases: releases.length,
      activePlatforms: platformBreakdown.length,
      liveReleases: releases.filter((r) => r.status === "Live").length,
    }),
    [releases, platformBreakdown],
  );

  const loading = revenueLoading || releasesLoading;
  const error = revenueError || releasesError || null;

  const refetch = () => {
    refetchRevenue();
    refetchReleases();
  };

  return {
    stats,
    totalRevenue,
    lastTransaction,
    outstandingBalance,
    recentReleases,
    loading,
    error,
    refetch,
  };
}
