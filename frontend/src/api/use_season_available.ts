// frontend/src/api/use_season_available.ts
//
// Answers one question: does this sport have team stats for this season?
//
// The stats screen derives its default season from the calendar, which rolls the
// season over before any games are played -- the NFL year rolls in August for the
// preseason ramp, MLB in March before opening day, NBA on 22 October. In those
// windows the newest season exists on the calendar but has no rows, and offering
// it in the picker produces an empty or misleading screen.
//
// The three sports signal "no data for that season" in three different ways, so
// this normalises them:
//
//   NFL   HTTP 200 with an empty data array
//   NBA   HTTP 404, {"message": "No NBA team stats found for season N"}
//   MLB   HTTP 200 with a full payload, but status "served_latest_available" --
//         it substitutes the newest season it does have rather than returning
//         nothing, so row count alone cannot detect it
//
// The result is deliberately tri-state. "unknown" covers network failures, 5xx
// and anything unrecognised, and callers must treat unknown as available: a
// transient outage must never hide a season that genuinely exists.

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { Sport } from "@/types";

export type SeasonAvailability = "available" | "unavailable" | "unknown";

function endpointFor(sport: Sport, season: number): string {
  // Probe whatever the Teams tab actually renders for that sport, so an
  // "unavailable" answer means the same thing the table would show.
  return sport === "NFL"
    ? `/api/v1/nfl/team-stats/summary?season=${season}`
    : `/api/v1/${sport.toLowerCase()}/team-stats?season=${season}`;
}

async function fetchSeasonAvailability(
  sport: Sport,
  season: number
): Promise<SeasonAvailability> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 10_000);

  let res: Response;
  try {
    res = await apiFetch(endpointFor(sport, season), {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
  } finally {
    clearTimeout(tid);
  }

  // NBA reports a missing season this way. It is a definite answer, not a fault.
  if (res.status === 404) return "unavailable";

  // Anything else non-OK is a fault, not an answer. Throwing lands the query in
  // an error state, which the hook surfaces as "unknown".
  if (!res.ok) {
    throw new Error(`${sport} availability check failed (${res.status})`);
  }
  if (!(res.headers.get("content-type") ?? "").includes("application/json")) {
    throw new Error(`${sport} availability check returned non-JSON`);
  }

  const body = (await res.json()) as {
    data?: unknown;
    status?: string;
    season?: number;
    requestedSeason?: number;
  };

  // NFL reports a missing season as a successful empty payload.
  if (!Array.isArray(body.data) || body.data.length === 0) return "unavailable";

  // MLB serves a different season's rows rather than none. Trust the explicit
  // status first, then fall back to comparing what was asked for against what
  // came back, in case the status string changes.
  if (body.status === "served_latest_available") return "unavailable";
  if (
    typeof body.requestedSeason === "number" &&
    typeof body.season === "number" &&
    body.requestedSeason !== body.season
  ) {
    return "unavailable";
  }

  return "available";
}

/**
 * Returns whether `season` has team stats for `sport`.
 *
 * Loading, errors and unrecognised responses all yield "unknown", which callers
 * must treat as available.
 */
export function useSeasonAvailability({
  sport,
  season,
  enabled = true,
}: {
  sport: Sport;
  season: number;
  enabled?: boolean;
}): SeasonAvailability {
  const { data, isSuccess } = useQuery<SeasonAvailability>({
    queryKey: ["seasonAvailability", sport, season],
    queryFn: () => fetchSeasonAvailability(sport, season),
    enabled,
    staleTime: 1_800_000, // 30 minutes; a season does not appear mid-visit
    retry: (failures) => failures < 2,
    refetchOnWindowFocus: false,
  });

  return isSuccess ? data : "unknown";
}
