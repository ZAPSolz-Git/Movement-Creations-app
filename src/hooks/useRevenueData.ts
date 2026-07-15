// src/hooks/useRevenueData.ts
//
// Wires RevenuePage.tsx to:
//   GET  /api/user/revenue
//   GET  /api/user/payout-history
//   POST /api/user/withdraw-request
//
// Adjust the two import paths below to match your actual file locations.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { apiClient } from "../lib/apiClient";

export type PayoutStatus = "approved" | "pending" | "rejected";

export interface NormalizedPayout {
  id: string;
  date: string; // ISO
  amount: number;
  status: PayoutStatus;
  notes?: string;
}

export interface PlatformRevenue {
  platform: string;
  rawAmount: number;
  color: string;
}

export interface RevenueSummary {
  total_revenue: number;
  current_balance: number;
  last_transaction: number;
  avg_revenue: number;
  total_withdrawals: number;
  total_transactions: number;
}

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

// backend statuses should already be "approved" | "pending" | "rejected",
// but this guards against anything unexpected instead of crashing the UI
const normalizeStatus = (raw: string | undefined): PayoutStatus => {
  if (raw === "approved" || raw === "pending" || raw === "rejected") return raw;
  return "pending";
};

export function useRevenueData() {
  const { user } = useAuth(); // expects { user: { id, role, ... } | null }

  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [rawPayouts, setRawPayouts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch revenue summary + transactions ────────────────────────────────
  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/api/user/revenue");
      setSummary(res.data?.summary || null);
      setTransactions(res.data?.transactions || []);
    } catch (err) {
      console.error("Failed to fetch revenue", err);
      setError("Couldn't load your revenue. Pull to refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch payout history ─────────────────────────────────────────────────
  const fetchPayoutHistory = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const res = await apiClient.get("/api/user/payout-history");
      setRawPayouts(res.data?.history || []);
    } catch (err) {
      console.error("Failed to fetch payout history", err);
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenue();
    fetchPayoutHistory();
  }, [fetchRevenue, fetchPayoutHistory]);

  // ── Submit withdrawal request ────────────────────────────────────────────
  const requestWithdrawal = useCallback(
    async (amount: number): Promise<{ success: boolean; message: string }> => {
      setSubmitting(true);
      try {
        const res = await apiClient.post("/api/user/withdraw-request", { amount });
        // refresh balance + history so the new pending request shows up
        await Promise.all([fetchRevenue(), fetchPayoutHistory()]);
        return { success: true, message: res.data?.message || "Withdrawal request submitted." };
      } catch (err: any) {
        const message =
          err?.response?.data?.message || "Withdrawal request failed. Please try again.";
        return { success: false, message };
      } finally {
        setSubmitting(false);
      }
    },
    [fetchRevenue, fetchPayoutHistory],
  );

  // ── Derived: stat cards ───────────────────────────────────────────────────
  const totalRevenue = safeNum(summary?.total_revenue);
  const lastTransaction = safeNum(summary?.last_transaction);
  const outstandingBalance = safeNum(summary?.current_balance);

  // ── Derived: platform breakdown from raw transactions ────────────────────
  // admin_revenue rows are expected to carry a `platform` field alongside
  // `amount` — adjust the key names here if your table uses different ones.
  const platformBreakdown = useMemo<PlatformRevenue[]>(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      const platform = t.platform || t.source || "Other";
      map[platform] = (map[platform] || 0) + safeNum(t.amount ?? t.revenue);
    });
    return Object.entries(map)
      .map(([platform, rawAmount]) => ({
        platform,
        rawAmount,
        color: getPlatformColor(platform),
      }))
      .sort((a, b) => b.rawAmount - a.rawAmount);
  }, [transactions]);

  const breakdownTotal = useMemo(
    () => platformBreakdown.reduce((sum, p) => sum + p.rawAmount, 0),
    [platformBreakdown],
  );

  // ── Derived: normalized payout history ───────────────────────────────────
  const payouts = useMemo<NormalizedPayout[]>(
    () =>
      rawPayouts.map((p) => ({
        id: p.id,
        date: p.created_at,
        amount: Math.abs(safeNum(p.amount)),
        status: normalizeStatus(p.status),
        notes:
          p.type === "withdraw_request"
            ? "Withdrawal request"
            : p.type || undefined,
      })),
    [rawPayouts],
  );

  return {
    role: (user?.role as "user" | "admin" | undefined) || "user",

    summary,
    totalRevenue,
    lastTransaction,
    outstandingBalance,

    platformBreakdown,
    breakdownTotal,

    payouts,
    payoutsLoading,

    loading,
    error,
    submitting,

    requestWithdrawal,
    refetch: useCallback(() => {
      fetchRevenue();
      fetchPayoutHistory();
    }, [fetchRevenue, fetchPayoutHistory]),
  };
}