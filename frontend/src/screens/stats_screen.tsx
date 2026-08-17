// frontend/src/screens/stats_screen.tsx

/* -------------------------------------------------------------------------- */
/*  Stats — a league table you re-sort. See docs/design_system.md §8.2.        */
/* -------------------------------------------------------------------------- */

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, SearchX } from "lucide-react";

import { useSport } from "@/contexts/sport_context";
import { useDate } from "@/contexts/date_context";
import { useOnline } from "@/contexts/online_context";
import OfflineCentered from "@/components/offline_centered";

import { useTeamStats } from "@/api/use_team_stats";
import { usePlayerStats } from "@/api/use_player_stats";
import { useAdvancedStats as useNbaAdvancedStats } from "@/api/use_nba_advanced_stats";
import { useMlbAdvancedStats } from "@/api/use_mlb_advanced_stats";
import { useNflAdvancedStats } from "@/api/use_nfl_advanced_stats";
import { useNflTeamSummary } from "@/api/use_nfl_team_summary";
import { useSeasonAvailability } from "@/api/use_season_available";

import SegmentedControl from "@/components/ui/segmented_control";
import EmptyState from "@/components/ui/empty_state";
import DataTable from "@/components/stats/data_table";
import type { Column, StatRow } from "@/components/stats/data_table";
import TableSkeleton from "@/components/stats/table_skeleton";
import {
  seasonLabel,
  perGame,
  sortRows,
  sortRowsByText,
  nextSort,
} from "@/utils/stats_format";
import type { SortState } from "@/utils/stats_format";
import { isLeagueTeam } from "@/utils/team_abbr";
import type { Sport } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Column configurations                                                     */
/*                                                                            */
/*  These are the whole of what the five old tables differed by. Everything    */
/*  else about them — markup, sorting, skeleton, empty state — was duplicated. */
/* -------------------------------------------------------------------------- */

type Tab = "teams" | "players" | "advanced";

/**
 * Guided-tour anchors. Matched by CSS selector from `joyride_tour.tsx`,
 * which makes them contracts — see design_system §6.10.
 *
 * The win-percentage column ships under two different keys: NFL's teams
 * tab renders `winPct` while MLB and NBA render `wins_all_percentage`.
 * Anchoring only the latter left NFL with no target at all.
 */
const TOUR_WIN_PCT = "stats-column-winpct";
const TOUR_ADVANCED_TAB = "stats-subtab-advanced";

const MLB_TEAM_COLUMNS: ReadonlyArray<Column> = [
  { key: "team_name", label: "Team", type: "text" },
  { key: "wins_all_percentage", label: "Win %", tourId: TOUR_WIN_PCT },
  { key: "runs_for_avg_all", label: "Runs For" },
  { key: "runs_against_avg_all", label: "Runs Vs" },
  { key: "current_form", label: "Streak", type: "sub" },
];

const NBA_TEAM_COLUMNS: ReadonlyArray<Column> = [
  { key: "team_name", label: "Team", type: "text" },
  { key: "wins_all_percentage", label: "Win %", tourId: TOUR_WIN_PCT },
  { key: "points_for_avg_all", label: "Off Pts" },
  { key: "points_against_avg_all", label: "Def Pts" },
];

/** NFL teams come from the summary endpoint, which `normalize.ts` camel-cases. */
const NFL_TEAM_COLUMNS: ReadonlyArray<Column> = [
  { key: "teamName", label: "Team", type: "text" },
  { key: "winPct", label: "Win %", tourId: TOUR_WIN_PCT },
  { key: "avgYardsPerDrive", label: "Yds / Drive" },
  { key: "avgRedZonePct", label: "Red Zone %" },
  { key: "possessionTimeAvgSec", label: "TOP" },
  { key: "avgTurnoversPerGame", label: "TOs / Game" },
  { key: "streak", label: "Streak", type: "sub" },
];

/**
 * The four counting columns render **per-game averages**, derived here
 * rather than read from the feed (defect 61).
 *
 * The feed sends season totals — `points: 2212`, `minutes: 3003` against
 * `games_played: 85` — under Pts, Reb, Ast and Min, which are the
 * headers every stats site uses for averages. Two ways out of that:
 * relabel the totals, or divide by the games played the same row
 * already carries. Dividing is exact arithmetic on two supplied numbers,
 * and it gives the reader the figure the header has always claimed and
 * the one a player is actually compared on.
 *
 * The header still says which it is, because a table that changed
 * meaning should say so rather than leave the reader to notice that
 * 26.0 is not 2212.
 *
 * `3P%` is already a rate. `GP` is the divisor, and stays: it is what
 * makes an average readable — 26.0 over 8 games is not 26.0 over 85 —
 * and without it the division could not be checked.
 *
 * **`FT%` is deliberately absent.** The feed under-reports free-throw
 * attempts badly enough that the percentage built on them is wrong
 * rather than imprecise: 37 players read exactly 100%, on lines like
 * 14-for-14 across 39 games and 1-for-1 across 15 — attempt counts no
 * rotation player has. `ft_attempted` is unreliable in the same way
 * `fg_attempted` is, which arrives null for every player, so there is
 * no rate to compute and nothing to correct client-side. The API still
 * sends `ft_pct`; this table stops rendering it. See defect 77.
 */
const PLAYER_COLUMNS: ReadonlyArray<Column> = [
  { key: "player_name", label: "Player", type: "text" },
  { key: "team_name", label: "Team", type: "sub" },
  { key: "points_per_game", label: "Pts", note: "Per game" },
  { key: "rebounds_per_game", label: "Reb", note: "Per game" },
  { key: "assists_per_game", label: "Ast", note: "Per game" },
  { key: "three_pct", label: "3P%" },
  { key: "minutes_per_game", label: "Min", note: "Per game" },
  { key: "games_played", label: "GP" },
];

/**
 * The season totals each per-game column is derived from. One place, so
 * the derivation, the columns and any future total cannot drift apart.
 */
const PER_GAME_FROM: ReadonlyArray<readonly [string, string]> = [
  ["points_per_game", "points"],
  ["rebounds_per_game", "rebounds"],
  ["assists_per_game", "assists"],
  ["minutes_per_game", "minutes"],
];

const NBA_ADV_COLUMNS: ReadonlyArray<Column> = [
  { key: "team_name", label: "Team", type: "text" },
  { key: "pace", label: "Pace" },
  { key: "off_rtg", label: "OffRtg" },
  { key: "def_rtg", label: "DefRtg" },
  { key: "efg_pct", label: "eFG%" },
  { key: "tov_pct", label: "TOV%" },
  { key: "oreb_pct", label: "ORB%" },
  { key: "games_played", label: "GP" },
];

const MLB_ADV_COLUMNS: ReadonlyArray<Column> = [
  { key: "team_name", label: "Team", type: "text" },
  { key: "win_pct", label: "Win %" },
  { key: "pythag_win_pct", label: "Pyth W%" },
  { key: "run_differential", label: "Run Diff" },
  { key: "run_differential_avg", label: "Run Diff Avg" },
  { key: "luck_factor", label: "Luck" },
  { key: "gp", label: "GP" },
];

const NFL_ADV_COLUMNS: ReadonlyArray<Column> = [
  { key: "team_name", label: "Team", type: "text" },
  { key: "pythagorean_win_pct", label: "Pythag W %" },
  { key: "avg_third_down_pct", label: "3rd %" },
  { key: "srs", label: "SRS" },
  { key: "sos", label: "SoS" },
];

interface View {
  columns: ReadonlyArray<Column>;
  defaultSort: SortState;
  /** Screen-reader table caption. */
  caption: string;
  /** What the rows are, for the heading and the caption. */
  noun: string;
  /** Appended to the caption where the values need explaining. */
  captionNote?: string;
}

/**
 * The one place that maps sport and tab to a table.
 *
 * The sort state that comes out of here is the *only* writer of the
 * screen's sort. The old screen had four sort states and three effects
 * writing one of them on overlapping dependencies; the last to run set
 * `srs`, a column the NFL teams table does not render, so the table
 * arrived sorted by an invisible column with no header marked active,
 * and corrected itself silently on a tab round-trip (defect 54).
 */
function viewFor(sport: Sport, tab: Tab): View {
  if (tab === "players") {
    return {
      columns: PLAYER_COLUMNS,
      defaultSort: { key: "points_per_game", dir: "desc" },
      caption: "NBA player statistics, per game",
      noun: "players",
      // The feed sends season totals; the table divides them by games
      // played (defect 61). The caption says so, and each derived column
      // repeats it in its own header, which is the part that stays on
      // screen once the reader scrolls.
      captionNote: "per-game averages",
    };
  }

  if (tab === "advanced") {
    if (sport === "NBA") {
      return {
        columns: NBA_ADV_COLUMNS,
        defaultSort: { key: "off_rtg", dir: "desc" },
        caption: "NBA advanced team statistics",
        noun: "teams",
      };
    }
    if (sport === "MLB") {
      return {
        columns: MLB_ADV_COLUMNS,
        defaultSort: { key: "run_differential", dir: "desc" },
        caption: "MLB advanced team statistics",
        noun: "teams",
      };
    }
    return {
      columns: NFL_ADV_COLUMNS,
      defaultSort: { key: "srs", dir: "desc" },
      caption: "NFL advanced team statistics",
      noun: "teams",
    };
  }

  if (sport === "NFL") {
    return {
      columns: NFL_TEAM_COLUMNS,
      defaultSort: { key: "winPct", dir: "desc" },
      caption: "NFL team statistics",
      noun: "teams",
    };
  }

  return {
    columns: sport === "MLB" ? MLB_TEAM_COLUMNS : NBA_TEAM_COLUMNS,
    defaultSort: { key: "wins_all_percentage", dir: "desc" },
    caption: `${sport} team statistics`,
    noun: "teams",
  };
}

/** Stable row identity across five feeds that name their key differently. */
function rowIdentity(row: StatRow, index: number): string {
  const candidates = [
    row.player_id,
    row.team_id,
    row.teamId,
    row.player_name,
    row.team_name,
    row.teamName,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c) return c;
    if (typeof c === "number") return String(c);
  }
  return String(index);
}

/**
 * The five feeds share no interface, and the table reads them by key.
 * One cast at the boundary, rather than the eighteen `any`s the old
 * screen spread through its comparators and its cells.
 */
function asRows(data: unknown): ReadonlyArray<StatRow> {
  return Array.isArray(data) ? (data as StatRow[]) : [];
}

/**
 * Holds a value still until it stops changing. The player search fed
 * straight into the React Query key, so every keystroke was a new cache
 * entry and a new network request (defect 58).
 */
function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

const StatsScreen: React.FC = () => {
  const { sport } = useSport();
  const { date } = useDate();
  const online = useOnline();

  /* ───── season ──────────────────────────────────────────────────────── */
  const defaultSeason = useMemo(() => {
    const m = date.getUTCMonth() + 1;
    if (sport === "MLB") {
      // Flips around spring training / opening day.
      return m >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
    }
    if (sport === "NFL") {
      // Rolls in August for the preseason ramp: Jan 2026 => 2025 season.
      return m >= 8 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
    }
    const d = date.getUTCDate();
    return m > 10 || (m === 10 && d >= 22)
      ? date.getUTCFullYear()
      : date.getUTCFullYear() - 1;
  }, [sport, date]);

  /*
   * The calendar rolls the season over before any games are played, so
   * defaultSeason can name a season that has no stats yet. Rather than
   * guess a cutover date per sport, ask whether the newest season
   * actually has stats and drop it from the picker until it does.
   *
   * Errors and loading both yield "unknown", treated as available, so a
   * transient failure degrades to the previous behaviour rather than
   * hiding seasons that do exist.
   */
  const newestSeasonAvailability = useSeasonAvailability({
    sport,
    season: defaultSeason,
    enabled: online,
  });

  const latestSeason =
    newestSeasonAvailability === "unavailable"
      ? defaultSeason - 1
      : defaultSeason;

  const [season, setSeason] = useState<number>(latestSeason);
  useEffect(() => setSeason(latestSeason), [latestSeason]);

  // True only for the render between discovering the newest season is
  // empty and the effect above moving off it. Without this the table
  // flashes its empty state. Must be `>` and not `!==`: an older season
  // is a legitimate choice, and `!==` would leave a permanent skeleton.
  const seasonShiftPending = season > latestSeason;

  /* ───── tab ─────────────────────────────────────────────────────────── */
  const [tab, setTab] = useState<Tab>("teams");
  useEffect(() => setTab("teams"), [sport]);

  /* ───── sort ─────────────────────────────────────────────────────────
   * One state, one writer. See viewFor. */
  const view = useMemo(() => viewFor(sport, tab), [sport, tab]);
  const [sort, setSort] = useState<SortState>(view.defaultSort);
  useEffect(() => setSort(view.defaultSort), [view]);

  /* ───── search ──────────────────────────────────────────────────────── */
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput, 250);
  useEffect(() => setSearchInput(""), [sport, tab]);

  /* ───── fetching ────────────────────────────────────────────────────── */
  const canFetchSeason = season <= defaultSeason;
  const ready = online && canFetchSeason;

  const teamStats = useTeamStats(
    useMemo(
      () => ({
        sport,
        season,
        enabled: ready && sport !== "NFL" && tab === "teams",
      }),
      [sport, season, ready, tab]
    )
  );

  const nflSummary = useNflTeamSummary({
    season,
    sport: "NFL",
    enabled: ready && sport === "NFL",
  });

  const playerStats = usePlayerStats(
    useMemo(
      () => ({
        sport: "NBA" as Sport,
        season,
        search,
        enabled: ready && sport === "NBA" && tab === "players",
      }),
      [season, search, ready, sport, tab]
    )
  );

  const nbaAdv = useNbaAdvancedStats(
    useMemo(
      () => ({
        sport: "NBA" as Sport,
        season,
        enabled: ready && sport === "NBA" && tab === "advanced",
      }),
      [season, ready, sport, tab]
    )
  );

  const mlbAdv = useMlbAdvancedStats(
    useMemo(
      () => ({
        sport: "MLB" as Sport,
        season,
        enabled: ready && sport === "MLB" && tab === "advanced",
      }),
      [season, ready, sport, tab]
    )
  );

  const nflAdv = useNflAdvancedStats({
    season,
    sport: "NFL",
    enabled: ready && sport === "NFL" && tab === "advanced",
  });

  /* ───── NFL advanced: merge SRS and SoS from the summary ─────────────
   * Neither figure is on the advanced endpoint; both are on the summary,
   * which is already fetched whenever the sport is NFL. The old version
   * of this ran to eighty lines because it also tried to handle three
   * hypothetical payload shapes the endpoint has never returned. */
  const nflAdvRows = useMemo<ReadonlyArray<StatRow>>(() => {
    const rows = asRows(nflAdv.data);
    if (!rows.length) return rows;

    const slug = (row: StatRow) =>
      String(row.team_name ?? row.teamName ?? "")
        .replace(/\s+/g, "")
        .toLowerCase();

    const summary = new Map<string, StatRow>();
    for (const row of asRows(nflSummary.data)) {
      const key = slug(row);
      if (key) summary.set(key, row);
    }

    return rows.map((row) => {
      const match = summary.get(slug(row));
      return {
        ...row,
        srs: row.srs ?? match?.srs ?? null,
        sos: row.sos ?? match?.sos ?? null,
      };
    });
  }, [nflAdv.data, nflSummary.data]);

  /* ───── the active dataset ──────────────────────────────────────────── */
  const source = useMemo(() => {
    if (tab === "players") {
      return {
        rows: asRows(playerStats.data),
        isLoading: playerStats.isLoading,
        isError: !!playerStats.error,
      };
    }
    if (tab === "advanced") {
      if (sport === "NBA") {
        return {
          rows: asRows(nbaAdv.data),
          isLoading: nbaAdv.isLoading,
          isError: !!nbaAdv.error,
        };
      }
      if (sport === "MLB") {
        return {
          rows: asRows(mlbAdv.data),
          isLoading: mlbAdv.isLoading,
          isError: !!mlbAdv.error,
        };
      }
      return {
        rows: nflAdvRows,
        isLoading: nflAdv.isLoading || nflSummary.isLoading,
        isError: !!nflAdv.error,
      };
    }
    if (sport === "NFL") {
      return {
        rows: asRows(nflSummary.data),
        isLoading: nflSummary.isLoading,
        isError: !!nflSummary.error,
      };
    }
    return {
      rows: asRows(teamStats.data),
      isLoading: teamStats.isLoading,
      isError: !!teamStats.error,
    };
  }, [
    tab,
    sport,
    playerStats.data,
    playerStats.isLoading,
    playerStats.error,
    nbaAdv.data,
    nbaAdv.isLoading,
    nbaAdv.error,
    mlbAdv.data,
    mlbAdv.isLoading,
    mlbAdv.error,
    nflAdv.isLoading,
    nflAdv.error,
    nflSummary.data,
    nflSummary.isLoading,
    nflSummary.error,
    nflAdvRows,
    teamStats.data,
    teamStats.isLoading,
    teamStats.error,
  ]);

  /* ───── exhibition sides ─────────────────────────────────────────────
   * Aggregates and exhibition sides are not clubs and must not hold a
   * rank. MLB's advanced feed ships `American League` and
   * `National League` rows during a live season, so a thirty-club league
   * rendered thirty-two.
   *
   * Two different problems, handled two different ways:
   *
   * A team table's row IS the team, so an aggregate row is dropped.
   *
   * A player table's row is a player who has been given the wrong team.
   * Seven NBA players carry `Team World` with 54 to 85 games played —
   * full seasons, not All-Star appearances — so dropping the row would
   * take Wembanyama, Murray and Towns off the leaderboard to fix a
   * label. The label is cleared instead, and §3 principle 3 leaves the
   * cell blank.
   *
   * This is an allowlist, which is the only way to actually guarantee no
   * exhibition side appears — a denylist cannot promise anything about a
   * name it has not seen. The cost is that `utils/team_abbr.ts` now
   * decides whether a club is rendered at all, not just how it is
   * abbreviated: a relocated franchise missing from that map loses its
   * row until it is added. The caption's row count is what makes that
   * visible. */
  const cleaned = useMemo<ReadonlyArray<StatRow>>(() => {
    if (tab === "players") {
      /* The per-game columns are derived here rather than in the cell,
       * because sorting and the magnitude bar both read the row: a value
       * computed at render time would leave the table sorted by the
       * totals it no longer shows. A player with no games played gets
       * `null`, which renders blank and sorts last (§7.3). */
      return source.rows.map((row) => {
        const derived: StatRow = { ...row };
        for (const [key, total] of PER_GAME_FROM) {
          derived[key] = perGame(row[total], row.games_played);
        }
        if (!isLeagueTeam(row.team_name as string)) derived.team_name = null;
        return derived;
      });
    }
    return source.rows.filter((row) =>
      isLeagueTeam((row.team_name ?? row.teamName) as string)
    );
  }, [source.rows, tab]);

  /* ───── ordering ────────────────────────────────────────────────────── */
  const sortedColumn = view.columns.find((c) => c.key === sort.key);
  const sortsAsText =
    sortedColumn?.type === "text" || sortedColumn?.type === "sub";

  const rows = useMemo(
    () =>
      sortsAsText ? sortRowsByText(cleaned, sort) : sortRows(cleaned, sort),
    [cleaned, sort, sortsAsText]
  );

  /* ───── toolbar options ─────────────────────────────────────────────── */
  const tabOptions = useMemo(
    () =>
      sport === "NBA"
        ? [
            { value: "teams" as Tab, label: "Teams" },
            { value: "players" as Tab, label: "Players" },
            {
              value: "advanced" as Tab,
              label: "Advanced",
              tourId: TOUR_ADVANCED_TAB,
            },
          ]
        : [
            { value: "teams" as Tab, label: "Teams" },
            {
              value: "advanced" as Tab,
              label: "Advanced",
              tourId: TOUR_ADVANCED_TAB,
            },
          ],
    [sport]
  );

  // Counts down from latestSeason, not defaultSeason, so a season with
  // no stats yet is never offered.
  const seasonOptions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const yr = latestSeason - i;
        return { value: String(yr), label: seasonLabel(yr, sport) };
      }),
    [latestSeason, sport]
  );

  /* ───── heading ──────────────────────────────────────────────────────
   * Names the column the table is sorted by, so the page states what the
   * reader is looking at. Sorting by the name column has nothing to
   * name, so the clause drops rather than reading "NBA teams by Team".
   *
   * A column's qualifier follows its label here — "by Pts per game" —
   * so the heading states which figure the table is ranked on rather
   * than leaving that to the header the reader has scrolled past. */
  const sortLabel = sortsAsText
    ? null
    : sortedColumn
      ? [sortedColumn.label, sortedColumn.note?.toLowerCase()]
          .filter(Boolean)
          .join(" ")
      : null;

  const caption = [
    `${seasonLabel(season, sport)} season${
      view.captionNote ? ` ${view.captionNote}` : ""
    }`,
    rows.length
      ? `${rows.length} ${
          rows.length === 1 ? view.noun.replace(/s$/, "") : view.noun
        }`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  /* ───── content ─────────────────────────────────────────────────────── */
  let content: React.ReactNode;

  if (source.isLoading || seasonShiftPending) {
    content = (
      <TableSkeleton
        rows={tab === "players" ? 12 : 10}
        numericColumns={Math.max(view.columns.length - 1, 1)}
      />
    );
  } else if (source.isError) {
    content = (
      <EmptyState
        icon={BarChart3}
        title="Stats are not available right now"
        description="The request did not complete."
      />
    );
  } else if (!rows.length) {
    content =
      tab === "players" && search ? (
        <EmptyState
          icon={SearchX}
          title={`No players match “${search}”`}
          description="Search matches on a player's name."
        />
      ) : (
        <EmptyState
          icon={BarChart3}
          title={`No ${sport} ${view.noun} stats for ${seasonLabel(
            season,
            sport
          )}`}
          description="The season control offers the five most recent seasons."
        />
      );
  } else {
    content = (
      <DataTable
        caption={view.caption}
        columns={view.columns}
        rows={rows}
        sortKey={sort.key}
        sortDir={sort.dir}
        onSort={(key) => setSort((prev) => nextSort(prev, key))}
        rowKey={rowIdentity}
      />
    );
  }

  return (
    <section className="p-6 md:px-8 lg:px-12 space-y-5">
      {/* Full-bleed toolbar. The negative margins and the padding step
          together, which is what defect 24 got wrong. */}
      <div className="filters-bar st-toolbar -mx-6 px-6 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12">
        <SegmentedControl
          label="Statistic group"
          options={tabOptions}
          value={tab}
          onChange={setTab}
        />
        <SegmentedControl
          className="st-seasons"
          label="Season"
          options={seasonOptions}
          value={String(season)}
          onChange={(next) => setSeason(Number(next))}
        />
      </div>

      <header>
        <h1 className="st-head">
          {sport} {view.noun}
          {sortLabel && (
            <>
              {" by "}
              <em className="st-head-key">{sortLabel}</em>
            </>
          )}
        </h1>
        <p className="st-cap">{caption}</p>
      </header>

      {sport === "NBA" && tab === "players" && (
        <input
          type="text"
          className="st-search"
          placeholder="Search player"
          aria-label="Search players by name"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      )}

      {online ? content : <OfflineCentered />}
    </section>
  );
};

export default StatsScreen;
