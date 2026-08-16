// frontend/src/screens/game_screen.tsx
import React, { memo, useMemo, useEffect } from "react";
import { useOnline } from "@/contexts/online_context";
import OfflineCentered from "@/components/offline_centered";
import { Calendar as CalendarIcon } from "lucide-react";
import { useSport } from "@/contexts/sport_context";
import { useDate } from "@/contexts/date_context";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import GameCard from "@/components/games/game_card";
import { useMLBSchedule } from "@/api/use_mlb_schedule";
import { useNBASchedule } from "@/api/use_nba_schedule";
import { useNFLSchedule } from "@/api/use_nfl_schedule";
import NBAScheduleDisplay from "@/components/schedule/nba_schedule_display";
import MLBScheduleDisplay from "@/components/schedule/mlb_schedule_display";
import NFLScheduleDisplay from "@/components/schedule/nfl_schedule_display";
import SkeletonBox from "@/components/ui/skeleton_box";
import EmptyState from "@/components/ui/empty_state";
import { CircleCheck } from "lucide-react";
import { devLog } from "@/utils/dev_log";
import { getEasternYYYYMMDD } from "@/utils/date";
import { isGameStale } from "@/game";
import type { UnifiedGame } from "@/types";

/* ------------------------------------------------------------ */
/* Hook selector                                                */
/* ------------------------------------------------------------ */

/**
 * The three schedule hooks resolve to different row types — NFL adds a
 * kickoff field, MLB and NBA add an Eastern-time one — and all of them
 * extend UnifiedGame. Without an explicit return type the switch below
 * produces a union of those array types, and TypeScript cannot pick a
 * single call signature for `.filter`, so every consumer of `data` fails
 * to type.
 *
 * Narrowing to the three fields this screen actually reads fixes that
 * and keeps the extra per-sport fields out of the screen's concern.
 */
interface ScheduleResult {
  data?: UnifiedGame[];
  isLoading: boolean;
  isError: boolean;
}

const useGamesForSport = (
  sport: "NBA" | "MLB" | "NFL",
  apiDate: string,
  options: { enabled: boolean }
): ScheduleResult => {
  const nfl = useNFLSchedule(apiDate, {
    enabled: sport === "NFL" && options.enabled,
  });
  const mlb = useMLBSchedule(apiDate, {
    enabled: sport === "MLB" && options.enabled,
  });
  const nba = useNBASchedule(apiDate, {
    enabled: sport === "NBA" && options.enabled,
  });

  switch (sport) {
    case "NFL":
      return nfl;
    case "MLB":
      return mlb;
    case "NBA":
      return nba;
    default:
      return { data: [], isLoading: false, isError: true };
  }
};

/* ------------------------------------------------------------ */
/* Online-only pane (schedule hooks live here)                  */
/* ------------------------------------------------------------ */
const OnlineGamesPane: React.FC = () => {
  const { sport, isResolving, initSportForDate } = useSport();
  const { date, setDate } = useDate();
  const apiDate = getEasternYYYYMMDD(date);

  // Decide initial sport for the date (NFL if available, else MLB)
  useEffect(() => {
    initSportForDate(apiDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiDate]);

  // Fetch schedules only when we've resolved the preferred sport
  const {
    data: games = [],
    isLoading,
    isError,
  } = useGamesForSport(sport, apiDate, { enabled: !isResolving });

  const visibleGames = useMemo(
    () => games.filter((g) => !isGameStale(g)),
    [games]
  );

  // First upcoming game (not live, not final)
  const firstUpcomingGameId = useMemo(() => {
    const GAME_STALE_MS = 3.5 * 60 * 60 * 1000;
    const now = Date.now();
    return visibleGames.find((g) => {
      const src = g.gameTimeUTC ?? g.game_date;
      if (!src) return false;
      const start = new Date(src).getTime();
      const inProgress = now >= start && now < start + GAME_STALE_MS;
      const status = (g.statusState ?? "").toLowerCase();
      const isFinal =
        ["final", "ended", "ft", "post-game", "postgame", "completed"].some(
          (s) => status.includes(s)
        ) ||
        (g.away_final_score != null && g.home_final_score != null);
      return !inProgress && !isFinal;
    })?.id;
  }, [visibleGames]);

  // Sort: upcoming → live → finals; then by start time
  const sortedGames = useMemo(() => {
    const GAME_STALE_MS = 3.5 * 60 * 60 * 1000;
    const now = Date.now();

    const rank = (g: (typeof games)[number]) => {
      const src = g.gameTimeUTC ?? g.game_date;
      if (!src) return 2; // unknowns to bottom
      const start = new Date(src).getTime();
      const inProgress = now >= start && now < start + GAME_STALE_MS;
      const status = (g.statusState ?? "").toLowerCase();
      const isFinal =
        ["final", "ended", "ft", "post-game", "postgame", "completed"].some(
          (s) => status.includes(s)
        ) ||
        (g.away_final_score != null && g.home_final_score != null);
      if (!inProgress && !isFinal) return 0;
      if (inProgress) return 1;
      return 2;
    };

    return [...visibleGames].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      const aStart = new Date(a.gameTimeUTC ?? a.game_date).getTime();
      const bStart = new Date(b.gameTimeUTC ?? b.game_date).getTime();
      return aStart - bStart;
    });
  }, [visibleGames]);

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  devLog("[games] state", {
    sport,
    isLoading,
    isError,
    rawCount: games.length,
    visibleCount: visibleGames.length,
    isResolving,
  });

  return (
    <>
      {/* Sticky filters-bar */}
      <div className="filters-bar contain-layout px-6">
        <h1 className="text-base sm:text-lg font-semibold">
          {(isResolving ? "" : sport) || ""} {isResolving ? "" : "Games for"}{" "}
          {formattedDate}
        </h1>
        <Popover>
          <PopoverTrigger asChild>
            <button className="pill border text-sm gap-1 bg-surface hover:bg-surface-hover border-border-subtle focus-ring">
              <CalendarIcon size={16} strokeWidth={1.8} />
              {formattedDate}
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            sideOffset={8}
            className="p-4 w-[20rem] bg-[var(--color-panel)] rounded-lg shadow-lg contain-layout"
          >
            <Calendar
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="calendar-reset [--rdp-cell-size:2.5rem]"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Content */}
      <section className="flex-1 overflow-y-auto px-6 py-6 space-y-6 contain-layout">
        {isResolving || isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBox key={i} className="app-card h-32 w-full" />
            ))}
          </div>
        ) : isError ? (
          // Treat fetch errors like offline—consistent with the old UX
          <OfflineCentered />
        ) : games.length === 0 ? (
          // API returned nothing → fall back to legacy schedule displays
          <>
            {sport === "NBA" && <NBAScheduleDisplay />}
            {sport === "MLB" && <MLBScheduleDisplay />}
            {sport === "NFL" && <NFLScheduleDisplay />}
          </>
        ) : visibleGames.length === 0 ? (
          <EmptyState
            icon={CircleCheck}
            title={`All ${sport} games have finished`}
            description={`Every game on ${formattedDate} has ended.`}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedGames.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                isFirst={g.id === firstUpcomingGameId}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
};

/* ------------------------------------------------------------ */
/* Screen component (offline vs online)                         */
/* ------------------------------------------------------------ */
const GamesScreen: React.FC = () => {
  const online = useOnline();
  const { sport } = useSport();
  const { date } = useDate();

  // Pure offline path — no schedule hooks are mounted here
  if (!online) {
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return (
      <main className="flex flex-col flex-1 overflow-hidden">
        <div className="filters-bar contain-layout px-6">
          <h1 className="text-base sm:text-lg font-semibold">
            {sport} Games for {formattedDate}
          </h1>
        </div>
        <section className="flex-1 overflow-y-auto contain-layout">
          <OfflineCentered />
        </section>
      </main>
    );
  }

  // Online path — mounts the pane that includes schedule hooks
  return (
    <main className="flex flex-col flex-1 overflow-hidden">
      <OnlineGamesPane />
    </main>
  );
};

export default memo(GamesScreen);
