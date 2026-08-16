// frontend/src/api/use_nfl_schedule.ts
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { UnifiedGame } from "@/types";

type GameWithTime = UnifiedGame & {
  /** Normalized kickoff in UTC ISO (Z), safe for sorting & comparisons */
  gameTimeUTC: string | null;
  /** Preformatted label for the card (ET), e.g. "1:00 PM" */
  timeLabelET: string;
};

/* ----------------------------- helpers ---------------------------------- */

/** Robust UTC normalizer: supports epoch sec/ms, numeric strings, naive & spaced datetimes */
function toUtcIso(v: unknown): string | null {
  if (v == null) return null;

  // Number → epoch (sec or ms)
  if (typeof v === "number" && Number.isFinite(v)) {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  // String
  if (typeof v === "string") {
    const s = v.trim();
    // Pure digits → epoch (sec or ms)
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      const ms = n < 1e12 ? n * 1000 : n;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    // Normalize "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SS"
    let iso = s.includes("T") ? s : s.replace(" ", "T");
    // If no TZ info, assume UTC
    if (!/[zZ]$|[+-]\d{2}:\d{2}$/.test(iso)) iso = `${iso}Z`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Anything else → Date try
  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ET label for cards (league-standard) */
function toEtLabel(isoUtc: string | null): string {
  if (!isoUtc) return "";
  const d = new Date(isoUtc);
  return d.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  });
}

// unwrap supports both [{...}] & { data: [{...}] }
function unwrap(json: unknown): any[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object" && "data" in (json as any)) {
    const d = (json as any).data;
    if (Array.isArray(d)) return d;
  }
  return [];
}

/* ----------------------------- hook ------------------------------------- */

export const useNFLSchedule = (
  date: string,
  options?: Partial<UseQueryOptions<GameWithTime[], Error>>
) =>
  useQuery<GameWithTime[], Error>({
    queryKey: ["nflSchedule", date],
    staleTime: 60_000,
    retry: (fails) => navigator.onLine && fails < 3,
    enabled: !!date && (options?.enabled ?? true),

    queryFn: async () => {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await apiFetch(`/api/v1/nfl/schedule?date=${date}`, {
          signal: controller.signal,
          cache: "no-store",
          headers: { accept: "application/json" },
        });
        if (!res.ok) {
          throw new Error(
            `Schedule request failed (${res.status} ${res.statusText})`
          );
        }

        const rows = unwrap(await res.json());

        return rows.map((g: any) => {
          // ✅ Single kickoff source: prefer scheduled_time; else normalized API UTC
          const kickoffIso =
            toUtcIso(g.scheduled_time) ??
            toUtcIso(g.gameTimeUTC) ??
            toUtcIso(g.game_time_utc) ??
            null;

          return {
            ...g,
            sport: "NFL",
            gameTimeUTC: kickoffIso, // normalized for logic/sorting
            timeLabelET: toEtLabel(kickoffIso), // used by Game Screen card subtitle
          } as GameWithTime;
        });
      } finally {
        clearTimeout(tid);
      }
    },
    ...options,
  });
