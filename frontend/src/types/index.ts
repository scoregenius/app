// frontend/src/types/index.ts
import type { LucideIcon } from "lucide-react";

export type IconType = LucideIcon;
export type Sport = "NBA" | "MLB" | "NFL";

// Define interfaces for chart data structures, if not already present
export interface BarChartData {
  category: string;
  Home: number; // Assuming this structure from your BarChartComponent
  Away: number;
}

export interface RadarChartData {
  metric: string;
  home_raw: number | string;
  away_raw: number | string;
  home_idx: number;
  away_idx: number;
}

export interface PieChartDataItem {
  category: string;
  value: number;
  color?: string; // Color might be optional
}

export interface NbaPreGameOffenseDataItem {
  metric: string;
  Home: number;
  Away: number;
}

// Define interface for Headline Stats
export interface HeadlineStat {
  label: string;
  value: string | number;
}

/**
 * The odds columns arrive either as a JSON string or as an already-parsed
 * object, depending on the feed and the column — which is why `robustParse`
 * in game_card exists. Both shapes are legal, so the type says so.
 */
export type RawJson<T> = T | string | null;

export interface MoneylineClean {
  home?: string | number;
  away?: string | number;
}

export interface SpreadCleanSide {
  line?: number;
  /** The same price under whichever key this feed happens to use. */
  price?: number | string;
  odds?: number | string;
  american?: number | string;
}

export interface SpreadClean {
  home?: SpreadCleanSide;
  away?: SpreadCleanSide;
}

export interface TotalClean {
  line?: number;
  over?: number;
}

export interface UnifiedGame {
  id: string;
  game_date: string; // YYYY-MM-DD (ET, based on backend logic)
  scheduled_time: string;
  scheduled_time_utc?: string;
  homeTeamName: string;
  awayTeamName: string;
  gameTimeUTC?: string | null; // ISO UTC timestamp for scheduled or historical
  statusState?: string | null; // Status description + short code
  // Schedule specific (may be null if historical)
  sport: Sport;
  homePitcher?: string | null;
  awayPitcher?: string | null;
  homePitcherHand?: string | null;
  awayPitcherHand?: string | null;
  moneylineHome?: string | number | null;
  moneylineAway?: string | number | null;
  spreadLine?: number | null; // Check type from backend mapping
  totalLine?: number | null; // Check type from backend mapping
  /* Odds columns. Each arrives in snake_case or camelCase depending on the
   * feed, and as a JSON string or a parsed object depending on the column.
   * game_card's deriveOdds reads every spelling; declaring them here is what
   * lets it do so without casting, and turns a mistyped field name into a
   * compile error rather than a silent undefined. */
  moneyline_clean?: RawJson<MoneylineClean>;
  moneylineClean?: RawJson<MoneylineClean>;
  spread_clean?: RawJson<SpreadClean>;
  spreadClean?: RawJson<SpreadClean>;
  total_clean?: RawJson<TotalClean>;
  totalClean?: RawJson<TotalClean>;

  /** Last-resort moneyline shape: prices keyed by team name as stored. */
  moneyline?: Record<string, string | number>;

  /* Team-name variants, used only to key into `moneyline` above. */
  homeTeam?: string;
  home_team?: string;
  awayTeam?: string;
  away_team?: string;

  // NBA Predictions
  predictionHome?: number | null;
  predictionAway?: number | null;
  /** Defensive aliases — some payloads shorten these. */
  predHome?: number | null;
  predAway?: number | null;

  // Added for MLB Predictions
  predicted_home_runs?: number | null;
  predicted_away_runs?: number | null;
  predictedHomeRuns?: number | null;
  predictedAwayRuns?: number | null;

  //  NFL Predictions
  predicted_home_score?: number | null;
  predicted_away_score?: number | null;
  predictedHomeScore?: number | null;
  predictedAwayScore?: number | null;

  spread?: number | null; // NBA specific schedule (duplicate?) -> Consolidate in backend mapping
  total?: number | null; // NBA specific schedule (duplicate?) -> Consolidate in backend mapping
  tipoff?: string | null; // NBA specific schedule (duplicate?) -> Use gameTimeUTC
  // Historical specific (might be null if schedule)
  home_final_score?: number | null;
  away_final_score?: number | null;
  // Discriminator
  dataType: "schedule" | "historical";
  // Implicit: sport (can be derived from context if needed, or added here by backend)

  venueLocation?: VenueLocation;
}

export interface UnifiedTeamStats {
  team_id: string | number; // DB sometimes returns BIGINT
  team_name: string;
  season: number;

  /* ---------- shared ----------- */
  wins_all_percentage: number;
  current_form: string | null;

  /* ---------- NBA ------------ */
  points_for_avg_all?: number | null;
  points_against_avg_all?: number | null;

  /* ---------- MLB ------------ */
  runs_for_avg_all?: number | null;
  runs_against_avg_all?: number | null;

  /* – you can extend later without breaking existing code – */
  [key: string]: string | number | undefined | null;
}

export interface UnifiedPlayerStats {
  player_id: string | number;
  player_name: string;
  team_name: string;
  games_played: number | null;

  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number | null;
  blocks: number | null;

  fg_made: number | null;
  fg_attempted: number | null;
  three_made: number;
  three_attempted: number;
  ft_made: number;
  ft_attempted: number;

  three_pct: number;
  ft_pct: number;

  [key: string]: string | number | undefined | null;
}

export interface MlbAdvancedTeamStats {
  team_id: number;
  team_name: string;

  /* core advanced metrics we read in the UI */
  win_pct: number;
  pythagorean_win_pct: number;
  run_differential: number;
  run_differential_avg: number;
  luck_factor: number;
  games_played: number;

  /* keep it open-ended for any future fields */
  [key: string]: string | number | undefined | null;
}

// Add NBA advanced stats interface
export interface NbaAdvancedTeamStats {
  team_name: string;
  pace: number;
  off_rtg: number;
  def_rtg: number;
  efg_pct: number;
  tov_pct: number;
  oreb_pct: number;
  games_played: number;

  /* allow extension */
  [key: string]: string | number | undefined | null;
}

export interface NflAdvancedTeamStats {
  team_name: string;
  games_played: number;
  srs: number; // Simple Rating System
  sos: number; // Strength of Schedule
  point_differential: number;
  turnover_differential: number;
  pythagorean_wins: number;
  luck: number; // Actual Wins - Pythagorean Wins

  /* allow extension */
  [key: string]: string | number | undefined | null;
}
interface SnapshotModalProps {
  gameId: string;
  sport: Sport;
  isOpen: boolean;
  onClose: () => void;
}
export interface SnapshotData {
  // ── Shared across sports ──
  headline_stats?: HeadlineStat[];
  bar_chart_data?: BarChartData[];
  radar_chart_data?: RadarChartData[];
  key_metrics_data?: BarChartData[];
  pie_chart_data?: PieChartDataItem[] | NbaPreGameOffenseDataItem[];
  is_historical?: boolean;
  stage?: string;
  home_team_label?: string;
  away_team_label?: string;
  home_team_name?: string;
  away_team_name?: string;

  // ── NBA-specific fields ──
  headline_data?: HeadlineStat[]; // for NBA snapshots (replaces headline_stats)
  chart_data?: BarChartData[]; // for NBA quarter-by-quarter scoring chart
}
export interface WeatherData {
  /* Null for a covered venue or one the service cannot locate — the
   * endpoint returns the envelope either way rather than erroring. */
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: string;
  description: string;
  icon: string | null;
  city: string | null;
  stadium?: string | null;
  ballparkWindText: string;
  ballparkWindAngle: number;
  isIndoor?: boolean | null;
  /**
   * Set when there is no venue on file for the fixture — neutral sites,
   * All-Star and Pro Bowl rosters. The service also returns `reason`,
   * currently only "NO_VENUE".
   */
  unavailable?: boolean;
  reason?: string;
}

/**
 * Defines the structure for a game's location, which will be
 * passed from the GameCard down to the WeatherBadge.
 */
export interface VenueLocation {
  latitude: number;
  longitude: number;
}
export interface NflTeamSummary {
  teamId: string;
  teamName: string;
  season: number;
  srs?: number;
  sos?: number;
  sosRank?: number;
  winPct?: number;
  pythagoreanWinPct?: number;
  avgThirdDownPct?: number;
  avgRedZonePct?: number;
  avgYardsPerDrive?: number;
  avgTurnoversPerGame?: number;
  avgTimeOfPossession?: string;

  [key: string]: any;
}
// ────────────────────────────────────────────────────────────
// Edge / Value types
// ────────────────────────────────────────────────────────────
export type EdgeTier = "HIGH" | "MED" | "LOW";
export type EdgeMarket = "ML" | "SPREAD";
export type EdgeSide = "HOME" | "AWAY";

export interface ValueEdge {
  market: EdgeMarket;
  side: EdgeSide;
  edgePct: number; // (modelProb - marketProb) * 100
  modelProb: number; // 0..1
  marketProb: number; // 0..1 (vig-free)
  z: number; // standardized confidence
  tier: EdgeTier;
}
