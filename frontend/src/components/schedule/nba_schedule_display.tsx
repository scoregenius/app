// frontend/src/components/schedule/nba_schedule_display.tsx
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { startOfDay, isBefore } from "date-fns";
import { useDate } from "@/contexts/date_context";
import { useNBASchedule } from "@/api/use_nba_schedule";
import { useInjuries, type Injury } from "@/api/use_injuries";
import { useNetworkStatus } from "@/hooks/use_network_status";
import type { UnifiedGame } from "@/types";

import SkeletonBox from "@/components/ui/skeleton_box";
import EmptyState from "@/components/ui/empty_state";
import { CalendarOff, CircleCheck } from "lucide-react";

/* ────────────────────────────────────────────────────────── */
/* Helpers                                                   */
/* ────────────────────────────────────────────────────────── */

const formatLocalDate = (d: Date | null | undefined): string => {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/* ────────────────────────────────────────────────────────── */
/* Lazy-loaded sub-components                                */
/* ────────────────────────────────────────────────────────── */

const LazyGameCard = lazy(() => import("@/components/games/game_card"));
const LazyInjuryReport = lazy(
  () => import("@/components/shared/injury_report"),
);

/* ────────────────────────────────────────────────────────── */
/* Main component                                            */
/* ────────────────────────────────────────────────────────── */

interface ScheduleDisplayProps {
  showHeader?: boolean;
}

const NBAScheduleDisplay: React.FC<ScheduleDisplayProps> = () => {
  /* ── context & network status ─────────────────────────── */
  /* useDate throws when no provider is mounted and its return type is
   * non-nullable, so the `if (!dateCtx) return null` guard that used to
   * sit here could never fire. It did, however, put every hook below it
   * behind an early return, which React counts as conditional: had the
   * guard ever been reachable, the next render would have thrown
   * "rendered more hooks than during the previous render". */
  const { date } = useDate();
  const online = useNetworkStatus();

  /* ── derived date info ───────────────────────────────── */
  const isoDate = formatLocalDate(date);
  const displayDate = date?.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const today = startOfDay(new Date());
  const selectedDay = date ? startOfDay(date) : null;
  const isPastDate = selectedDay ? isBefore(selectedDay, today) : false;

  /* ── current time ticker (for live-game filtering) ─────── */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  /* ── schedule query ───────────────────────────────────── */
  const {
    data: rawGamesData, // Fetched data can be non-array
    isLoading: isLoadingGames,
    isError: gamesError,
  } = useNBASchedule(isoDate);

  // --- NEW FIX ---
  // Ensure `games` is always an array. If the API returns an empty object {} or something else, default to [].
  const games: UnifiedGame[] = useMemo(
    () => (Array.isArray(rawGamesData) ? rawGamesData : []),
    [rawGamesData],
  );
  // --- END FIX ---

  /* ── injuries query ───────────────────────────────────── */
  const {
    data: injuries = [],
    isLoading: isLoadingInjuries,
    error: injuriesError,
  } = useInjuries("NBA", isoDate);

  /* ── teams playing today (lower-case) ─────────────────── */
  const playingTeams = useMemo(() => {
    const set = new Set<string>();
    games.forEach(({ homeTeamName, awayTeamName }) => {
      [homeTeamName, awayTeamName].forEach((t) => {
        if (t) set.add(t.trim().toLowerCase());
      });
    });
    return set;
  }, [games]);

  /* ── injuries grouped by playing team ─────────────────── */
  const injuriesByTeam = useMemo(() => {
    const grouped: Record<string, Injury[]> = {};
    injuries.forEach((inj) => {
      const t = inj.team_display_name?.trim();
      if (!t) return;
      const key = t.toLowerCase();
      if (!playingTeams.has(key)) return;
      (grouped[t] ||= []).push(inj);
    });
    return grouped;
  }, [injuries, playingTeams]);

  const teamsWithInjuries = useMemo(
    () => Object.keys(injuriesByTeam).sort(),
    [injuriesByTeam],
  );

  /* ── filter out completed games (except past dates) ───── */
  const filteredGames = useMemo(() => {
    if (isPastDate) return games;

    const bufferMs = 3.5 * 60 * 60 * 1000;
    return games.filter(({ gameTimeUTC }: UnifiedGame) => {
      const ms = new Date(gameTimeUTC ?? "").getTime();
      return Number.isNaN(ms) ? true : now < ms + bufferMs;
    });
  }, [games, now, isPastDate]);

  const noGamesInitiallyScheduled = games.length === 0;
  const allGamesFilteredOut = games.length > 0 && filteredGames.length === 0;

  /* ─────────────────────────────────────────────────────── */
  /* Render                                                 */
  /* ─────────────────────────────────────────────────────── */

  if (isLoadingGames)
    return (
      <div className="space-y-4 px-4">
        <h2 className="animate-pulse text-center text-lg font-semibold italic text-gray-500 dark:text-text-secondary">
          Loading NBA games for {displayDate}…
        </h2>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} className="h-24 w-full" />
        ))}
      </div>
    );

  if (gamesError)
    return (
      <p className="text-center text-slate-500 dark:text-slate-400 px-4">
        Error fetching NBA games for {displayDate}.
      </p>
    );

  return (
    <div className="pt-4 space-y-8">
      {/* ── games list ── */}
      {filteredGames.length > 0 ? (
        <Suspense
          fallback={
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonBox key={i} className="h-24 w-full" />
              ))}
            </div>
          }
        >
          <div className="space-y-4">
            {filteredGames.map((g) => (
              <LazyGameCard key={g.id} game={g} />
            ))}
          </div>
        </Suspense>
      ) : noGamesInitiallyScheduled ? (
        <EmptyState
          icon={CalendarOff}
          title={`No NBA games on ${displayDate}`}
          description="Nothing is scheduled for this date. Pick another date from the calendar, or switch sport above."
        />
      ) : allGamesFilteredOut ? (
        <EmptyState
          icon={CircleCheck}
          title={`All NBA games have finished`}
          description={`Every game on ${displayDate} has ended.`}
        />
      ) : null}

      {/* ── Injury Report ─────────────────────────────────────── */}
      {games.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <h2 className="mb-3 text-left text-lg font-semibold text-slate-800 dark:text-text-primary">
            Daily Injury Report
          </h2>
          <Suspense
            fallback={
              <div className="space-y-4">
                {teamsWithInjuries.map((team) => (
                  <SkeletonBox
                    key={team}
                    className="w-full rounded-md px-4 py-3"
                  />
                ))}
              </div>
            }
          >
            <LazyInjuryReport
              displayDate={displayDate}
              isPastDate={isPastDate}
              allGamesFilteredOut={allGamesFilteredOut}
              isLoadingInjuries={isLoadingInjuries}
              injuriesError={injuriesError ?? undefined}
              teamsWithInjuries={teamsWithInjuries}
              injuriesByTeam={injuriesByTeam}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default NBAScheduleDisplay;
