// src/hooks/useReleasesData.ts
//
// Wires ReleasePage.tsx to:
//   GET /api/submissions
//
// Adjust the import paths below to match your actual file locations.

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";
export type ReleaseType = "audio" | "ringtone" | "video";
export type ReleaseStatus = "Live" | "Draft" | "Review" | "Rejected";

export interface Release {
  id: string;
  title: string;
  release_type: ReleaseType;
  primary_artist: string;
  status: ReleaseStatus;
  cover_url: string;
  date: string;
  label?: string;
  isrc?: string;
}

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80";

// Backend "release_type" values may include "video" — this app doesn't
// support video releases on this screen, so those rows are dropped entirely
// rather than mismapped into "audio".
function normalizeReleaseType(raw: unknown): ReleaseType | null {
  const normalized = String(raw || "").toLowerCase();
  if (normalized === "ringtone") return "ringtone";
  if (normalized === "video") return "video"; // excluded
  if (
    normalized === "audio" ||
    normalized === "single" ||
    normalized === "album" ||
    normalized === "ep"
  ) {
    return "audio";
  }
  // Unknown/未指定 types default to audio rather than being silently dropped —
  // change this to `return null;` if you'd rather exclude unknowns too.
  return "audio";
}

function normalizeStatus(raw: unknown): ReleaseStatus {
  const normalized = String(raw || "").toLowerCase();
  if (
    normalized === "live" ||
    normalized === "approved" ||
    normalized === "published"
  ) {
    return "Live";
  }
  if (
    normalized === "review" ||
    normalized === "pending" ||
    normalized === "submitted"
  ) {
    return "Review";
  }
  if (normalized === "rejected" || normalized === "declined") {
    return "Rejected";
  }
  return "Draft";
}

function formatDate(raw: unknown): string {
  if (!raw) return "";
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function mapSubmissionToRelease(raw: any): Release | null {
  const release_type = normalizeReleaseType(raw.release_type);
  if (release_type === null) return null; // video (or excluded type) — skip

  return {
    id: String(raw.id),
    title: raw.title || raw.release_title || "Untitled release",
    release_type,
    primary_artist: raw.primary_artist || raw.artist_name || "Unknown artist",
    status: normalizeStatus(raw.status),
    cover_url: raw.cover_url || raw.artwork_url || FALLBACK_COVER,
    date: formatDate(raw.created_at),
    label: raw.label_name || raw.label || undefined,
    isrc: raw.isrc || raw.upc_ean || undefined,
  };
}

export function useReleasesData(releaseType?: "all" | ReleaseType) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReleases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/api/submissions", {
        params:
          releaseType && releaseType !== "all"
            ? { release_type: releaseType }
            : undefined,
      });

      const rawSubmissions = res.data?.submissions || [];
      const mapped = rawSubmissions
        .map(mapSubmissionToRelease)
        .filter((r: Release | null): r is Release => r !== null);

      setReleases(mapped);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
      setError("Couldn't load your releases. Pull to refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, [releaseType]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  return {
    releases,
    loading,
    error,
    refetch: fetchReleases,
  };
}
