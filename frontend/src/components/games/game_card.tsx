// frontend/src/components/games/game_card.tsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  memo,
} from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { UnifiedGame, Sport } from "@/types";
import { useTour, TourStepId } from "@/contexts/tour_context";
import { computeBestEdge } from "@/utils/edge";
import { marketSegments } from "@/utils/market";
import { abbr, canonicalName } from "@/utils/team_abbr";
import { isKnownIndoor } from "@/utils/venues";

import { useWeather } from "@/hooks/use_weather";
import WeatherBadge from "./weather_badge";
import SnapshotButton from "./snapshot_button";
import TeamRow from "./team_row";
import EdgeChip from "./edge_chip";
import MarketStrip from "./market_strip";
import LeanBar from "./lean_bar";
import PitcherBlock from "./pitcher_block";

const WeatherModal = lazy(() => import("./weather_modal"));
const SnapshotModal = lazy(() => import("./snapshot_modal"));
const InjuriesChipButton = lazy(
  () => import("@/components/ui/injuries_chip_button")
);
const InjuryModal = lazy(() => import("./injury_modal"));

/* ------------------------------------------------------------ */
/* Helpers                                                      */
/* ------------------------------------------------------------ */
const formatTime = (iso?: string | null, fallback?: string | null): string => {
  if (!iso) return fallback ?? "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback ?? "--";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const useIsDesktop = (bp = 1024): boolean => {
  const [isDesk, setIsDesk] = useState<boolean>(
    typeof window === "undefined" ? true : window.innerWidth >= bp
  );
  useEffect(() => {
    const handler = () => setIsDesk(window.innerWidth >= bp);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [bp]);
  return isDesk;
};

// robust JSON parser—handles object, single‐encode, or double‐encode
const robustParse = <T,>(
  src: T | string | null | undefined,
  fallback: T
): T => {
  if (src !== null && src !== undefined && typeof src === "object") {
    return src as T;
  }
  if (typeof src !== "string") {
    return fallback;
  }
  try {
    let parsed = JSON.parse(src);
    // if the first parse still gave you a string, parse again
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return parsed as T;
  } catch {
    return fallback;
  }
};

const deriveOdds = (game: UnifiedGame) => {
  /* ---------- MONEYLINE ---------- */
  // 1️⃣ First, try explicit home/away props (MLB already has them)
  let moneylineHome: string | number | null = game.moneylineHome ?? null;
  let moneylineAway: string | number | null = game.moneylineAway ?? null;

  // 2️⃣ Next, try the JSON-clean column (snake_case or camelCase)
  const rawML =
    game.moneyline_clean ?? game.moneylineClean ?? null;
  const mlClean = robustParse<{
    home?: string | number;
    away?: string | number;
  }>(rawML, {});
  if (moneylineHome == null) moneylineHome = mlClean.home ?? null;
  if (moneylineAway == null) moneylineAway = mlClean.away ?? null;

  // 3️⃣ Finally, fall back to the generic `moneyline` object keyed by team names
  if (moneylineHome == null || moneylineAway == null) {
    const mlObj = game.moneyline as
      | Record<string, string | number>
      | undefined;
    const hName = game.homeTeam ?? game.home_team;
    const aName = game.awayTeam ?? game.away_team;
    if (mlObj && hName && aName) {
      // team names in the object are Title Case exactly as stored
      moneylineHome ??= mlObj[hName] ?? null;
      moneylineAway ??= mlObj[aName] ?? null;
    }
  }

  /* ---------- SPREAD ---------- */
  const rawSpread =
    game.spread_clean ?? game.spreadClean ?? null;
  const spreadClean = robustParse<{
    home?: {
      line?: number;
      price?: number | string;
      odds?: number | string;
      american?: number | string;
    };
    away?: {
      line?: number;
      price?: number | string;
      odds?: number | string;
      american?: number | string;
    };
  }>(rawSpread, { home: {}, away: {} });

  const spreadLine = game.spreadLine ?? spreadClean.home?.line ?? null;

  // price fallbacks: price → odds → american
  const spreadHomePrice =
    spreadClean.home?.price ??
    spreadClean.home?.odds ??
    spreadClean.home?.american ??
    null;

  const spreadAwayPrice =
    spreadClean.away?.price ??
    spreadClean.away?.odds ??
    spreadClean.away?.american ??
    null;

  /* ---------- TOTAL ---------- */
  const rawTotal =
    game.total_clean ?? game.totalClean ?? null;
  const totalClean = robustParse<{ line?: number; over?: number }>(
    rawTotal,
    {}
  );
  const totalLine =
    game.totalLine ?? totalClean.line ?? totalClean.over ?? null;

  return {
    moneylineHome,
    moneylineAway,
    spreadLine,
    totalLine,
    spreadHomePrice,
    spreadAwayPrice,
  };
};

/**
 * The NBA feed carries exhibition and international sides the model has no
 * prediction for. Module scope rather than the render body, where this array
 * was rebuilt on every render.
 */
/**
 * Tour steps whose target only exists inside an expanded card, so the
 * card has to open before they can point at anything.
 */
const STEPS_REQUIRING_EXPANSION = new Set<TourStepId>([
  "game-card",
  "snapshot",
  "weather",
]);

const NBA_TEAMS = new Set([
  "Atlanta Hawks",
  "Boston Celtics",
  "Brooklyn Nets",
  "Charlotte Hornets",
  "Chicago Bulls",
  "Cleveland Cavaliers",
  "Dallas Mavericks",
  "Denver Nuggets",
  "Detroit Pistons",
  "Golden State Warriors",
  "Houston Rockets",
  "Indiana Pacers",
  "Los Angeles Clippers",
  "Los Angeles Lakers",
  "Memphis Grizzlies",
  "Miami Heat",
  "Milwaukee Bucks",
  "Minnesota Timberwolves",
  "New Orleans Pelicans",
  "New York Knicks",
  "Oklahoma City Thunder",
  "Orlando Magic",
  "Philadelphia 76ers",
  "Phoenix Suns",
  "Portland Trail Blazers",
  "Sacramento Kings",
  "San Antonio Spurs",
  "Toronto Raptors",
  "Utah Jazz",
  "Washington Wizards",
]);

/* ------------------------------------------------------------ */
/* Component                                                    */
/* ------------------------------------------------------------ */
interface GameCardProps {
  game: UnifiedGame;
  forceCompact?: boolean;
  /**
   * Marks the first upcoming game of the slate. Unused by the card since the
   * first-run tooltip was removed, but still supplied by game_screen and used
   * by the guided tour to find a card to open.
   */
  isFirst?: boolean;
}

const GameCardComponent: React.FC<GameCardProps> = ({
  game,
  forceCompact,
}) => {
  const isDesktop = useIsDesktop();
  const compactDefault = forceCompact ?? !isDesktop;

  const {
    id: gameId,
    awayTeamName,
    homeTeamName,
    gameTimeUTC,
    statusState,
    game_date,
    sport,
    away_final_score,
    home_final_score,
    awayPitcher,
    awayPitcherHand,
    homePitcher,
    homePitcherHand,
  } = game;

  /* ---------- game state: scheduled → in progress → final ----------
   * There is no live feed. "In progress" is inferred from the start time
   * plus this window; see docs/design_system.md §4.1. */
  const GAME_STALE_MS = 3.5 * 60 * 60 * 1000;

  const gameStartDate = useMemo(() => {
    const dateSrc = game.gameTimeUTC ?? game.game_date;
    return dateSrc ? new Date(dateSrc) : null;
  }, [game.gameTimeUTC, game.game_date]);

  const now = Date.now();

  /**
   * Has first pitch / kickoff / tip-off passed?
   *
   * Derived from the clock rather than the feed, because the feed cannot be
   * trusted for this. Schedule rows routinely still read `statusState: "NS"`
   * with null final scores many hours after a game has finished, so asking
   * the feed "is this over?" answers "it has not started" for a game that
   * ended last night.
   */
  const hasStarted =
    gameStartDate !== null && now >= gameStartDate.getTime();

  const isInProgress =
    hasStarted && now < gameStartDate!.getTime() + GAME_STALE_MS;

  const isFinal = (() => {
    const status = (statusState ?? "").toLowerCase();
    if (
      ["final", "ended", "ft", "post-game", "postgame", "completed"].some((s) =>
        status.includes(s)
      )
    ) {
      return true;
    }
    return away_final_score != null && home_final_score != null;
  })();

  const [expanded, setExpanded] = useState(!compactDefault);
  const {
    currentStepId,
    pendingStepId,
    run: isTourRunning,
  } = useTour();

  const [snapshotOpen, setSnapshotOpen] = useState<boolean>(false);
  const [weatherOpen, setWeatherOpen] = useState<boolean>(false);
  const [injuryModalOpen, setInjuryModalOpen] = useState<boolean>(false);

  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  // keep expanded in sync with compact vs desktop mode
  useEffect(() => {
    setExpanded((prev) => {
      if (compactDefault && prev) return false; // switched to compact → collapse
      if (!compactDefault && !prev) return true; // switched to desktop → expand
      return prev;
    });
  }, [compactDefault]);

  /* Tour-aware expansion. The H2H chip and the weather chip only exist
   * inside an expanded card, so the steps pointing at them have to open
   * it first.
   *
   * Matched on step id, not position. These were previously indices
   * [1, 2, 3] into an array that is filtered per sport and again on
   * whether the weather chip is present — correct only because the one
   * filtered step happened to sit after all three.
   *
   * The pending step counts as well as the current one, and that is what
   * makes Back work across a screen boundary. Coming back to Games from
   * Stats, this card is freshly mounted and collapsed, so the chip the
   * step points at cannot exist — and the hop will not commit until it
   * does. Opening for the pending step breaks that deadlock. */
  useEffect(() => {
    if (!isTourRunning) return;
    const wanted = [currentStepId, pendingStepId].some(
      (id) => id && STEPS_REQUIRING_EXPANSION.has(id)
    );
    if (wanted) setExpanded(true);
  }, [isTourRunning, currentStepId, pendingStepId]);

  /* ---------- weather ----------
   * NBA renders no chip at all. Every game is indoors, so a chip that
   * always said the same thing on every card carried no information.
   *
   * For MLB and NFL, venues already known to be covered skip the request
   * rather than fetching and discarding the answer — roughly five of a
   * full NFL slate. The response is still trusted where it disagrees, so
   * a venue missing from the local set costs a round-trip and nothing
   * more. */
  const isNBA = sport === "NBA";
  const venueKnownIndoor = isKnownIndoor(sport, homeTeamName);
  const shouldFetchWeather = !isNBA && !venueKnownIndoor;
  const showWeatherChip = !isNBA;

  const {
    data: weatherData,
    isLoading: isWeatherLoading,
    isError: isWeatherError,
  } = useWeather(
    shouldFetchWeather ? sport : undefined,
    shouldFetchWeather ? homeTeamName : undefined
  );
  const isEffectivelyIndoor = venueKnownIndoor || weatherData?.isIndoor === true;

  /* ---------- time ----------
   * No status suffix. The raw feed codes — (IN9), (FT) — used to be appended
   * here and leaked into the interface; the rail states the game's state
   * instead. */
  const timeLine = useMemo(
    () => formatTime(gameTimeUTC ?? undefined, game_date ?? undefined),
    [gameTimeUTC, game_date]
  );

  /* ---------- predictions (sport-aware, with robust key fallbacks) ---------- */
  const toFiniteNum = (v: unknown): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const firstDefined = <T,>(...vals: Array<T | null | undefined>) =>
    vals.find((v) => v !== null && v !== undefined);

  let predAway: number | null = null;
  let predHome: number | null = null;

  switch (sport) {
    case "NBA": {
      predAway = toFiniteNum(
        firstDefined(
          game.predictionAway,
          game.predAway,
          game.predicted_away_score
        )
      );
      predHome = toFiniteNum(
        firstDefined(
          game.predictionHome,
          game.predHome,
          game.predicted_home_score
        )
      );
      break;
    }
    case "MLB": {
      predAway = toFiniteNum(
        firstDefined(
          game.predicted_away_runs,
          game.predictedAwayRuns,
          game.predictionAway
        )
      );
      predHome = toFiniteNum(
        firstDefined(
          game.predicted_home_runs,
          game.predictedHomeRuns,
          game.predictionHome
        )
      );
      break;
    }
    case "NFL": {
      predAway = toFiniteNum(
        firstDefined(
          game.predicted_away_score,
          game.predictedAwayScore,
          game.predictionAway
        )
      );
      predHome = toFiniteNum(
        firstDefined(
          game.predicted_home_score,
          game.predictedHomeScore,
          game.predictionHome
        )
      );
      break;
    }
  }

  /**
   * A prediction is only meaningful before the game starts. Once it has, the
   * card shows an em dash rather than a forecast of something already decided.
   *
   * Gated on `hasStarted`, not on `isFinal`, because the feed frequently never
   * reports the result — leaving a game that ended hours ago looking scheduled
   * and still advertising a prediction for it.
   *
   * Do NOT rely on dataType; some feeds omit/rename it.
   */
  const hasPrediction =
    predAway !== null && predHome !== null && !isFinal && !hasStarted;

  /* ---------- market ---------- */
  const {
    moneylineHome,
    moneylineAway,
    spreadLine,
    totalLine,
    spreadHomePrice,
    spreadAwayPrice,
  } = useMemo(() => deriveOdds(game), [game]);

  const segments = useMemo(
    () => marketSegments({ moneylineHome, moneylineAway, spreadLine, totalLine }),
    [moneylineHome, moneylineAway, spreadLine, totalLine]
  );

  const hasMarket =
    (moneylineHome != null && moneylineAway != null) || spreadLine != null;

  const edge = useMemo(
    () =>
      hasPrediction && hasMarket
        ? computeBestEdge({
            sport,
            predHome: Number(predHome),
            predAway: Number(predAway),
            mlHome: moneylineHome,
            mlAway: moneylineAway,
            spreadHomeLine: spreadLine ?? null,
            spreadHomePrice,
            spreadAwayPrice,
          })
        : null,
    [
      sport,
      hasPrediction,
      hasMarket,
      predHome,
      predAway,
      moneylineHome,
      moneylineAway,
      spreadLine,
      spreadHomePrice,
      spreadAwayPrice,
    ]
  );

  /* ---------- the model's pick ----------
   * On an exact tie neither side is marked and both keep full contrast. */
  const margin = hasPrediction ? predHome! - predAway! : 0;
  const pick: "HOME" | "AWAY" | null =
    !hasPrediction || margin === 0 ? null : margin > 0 ? "HOME" : "AWAY";

  const awayAbbr = abbr(awayTeamName);
  const homeAbbr = abbr(homeTeamName);

  /* Displayed names only. The feed spells one club `St.Louis Cardinals` with no
   * space; `abbr` normalises punctuation away so the chip was always right,
   * while the name printed beside it was the feed's raw string — defect 33.
   * The lookups above keep the raw value deliberately: `mlObj` is keyed by the
   * feed's exact spelling, and changing what those receive would break them. */
  const awayTeamDisplay = canonicalName(awayTeamName);
  const homeTeamDisplay = canonicalName(homeTeamName);

  /** Final score, predicted score, or nothing to show. */
  const displayValue = (side: "HOME" | "AWAY"): string => {
    if (isFinal) {
      const v = side === "HOME" ? home_final_score : away_final_score;
      return v == null ? "—" : String(v);
    }
    if (!hasPrediction) return "—";
    return (side === "HOME" ? predHome! : predAway!).toFixed(1);
  };

  const isNonLeagueGame =
    isNBA && (!NBA_TEAMS.has(homeTeamName) || !NBA_TEAMS.has(awayTeamName));

  /* ---------- interaction ---------- */
  // Ignore clicks that originate inside elements marked data-action
  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!compactDefault) return; // desktop: do nothing
      if ((e.target as HTMLElement).closest("[data-action]")) return;
      toggleExpanded();
    },
    [compactDefault, toggleExpanded]
  );

  const handleChevron = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpanded();
    },
    [toggleExpanded]
  );

  /* The two scores are split across rows, which loses the relationship
   * visually. State it for screen readers. */
  const ariaLabel = isFinal
    ? `${awayTeamDisplay} ${displayValue("AWAY")}, ${homeTeamDisplay} ${displayValue(
        "HOME"
      )}, final`
    : hasPrediction
    ? `${awayTeamDisplay} versus ${homeTeamDisplay}. Predicted score ${displayValue(
        "AWAY"
      )} to ${displayValue("HOME")}`
    : `${awayTeamDisplay} versus ${homeTeamDisplay}`;

  return (
    <article
      data-tour="game-card"
      aria-label={ariaLabel}
      aria-expanded={expanded}
      onClick={handleCardClick}
      className={clsx(
        "gc contain-layout",
        compactDefault && "gc--compact",
        !isFinal && !isInProgress && edge?.tier === "HIGH" && "gc--high",
        isInProgress && "gc--live",
        isFinal && "gc--done",
        expanded && !isDesktop && "md:col-span-2"
      )}
    >
      {/* ---------- status rail ---------- */}
      <div className="gc-rail">
        {isInProgress ? (
          <span className="gc-live">
            <span className="gc-live-dot" aria-hidden="true" />
            LIVE
          </span>
        ) : isFinal ? (
          <span className="gc-state">Final</span>
        ) : edge ? (
          <EdgeChip
            tier={edge.tier}
            teamAbbr={edge.side === "HOME" ? homeAbbr : awayAbbr}
          />
        ) : (
          <span />
        )}
        {/* "Started 7:05 PM" covers both a live game and one whose result the
            feed never reported — in each case the honest statement is when it
            began, not a claim about how it ended. */}
        <span className="gc-time">
          {hasStarted && !isFinal ? `Started ${timeLine}` : timeLine}
        </span>
      </div>

      {/* ---------- matchup ---------- */}
      <TeamRow
        abbr={awayAbbr}
        teamName={awayTeamDisplay}
        value={displayValue("AWAY")}
        faded={(hasStarted && !isFinal) || pick === "HOME"}
        isPick={pick === "AWAY"}
      />
      <TeamRow
        abbr={homeAbbr}
        teamName={homeTeamDisplay}
        value={displayValue("HOME")}
        faded={(hasStarted && !isFinal) || pick === "AWAY"}
        isPick={pick === "HOME"}
      />

      {isNonLeagueGame && (
        <p className="gc-caveat">
          No model prediction — exhibition game outside the {sport}.
        </p>
      )}

      {/* ---------- market strip. Hidden entirely once a game is final. ---------- */}
      {!isFinal && (
        <div className="gc-foot">
          <button
            type="button"
            data-action
            onClick={handleChevron}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse details" : "Expand details"}
            className="gc-chev focus-ring"
          >
            <ChevronDown size={13} aria-hidden="true" />
            <span className="gc-chev-label" aria-hidden="true">
              {expanded ? "Less" : "More"}
            </span>
          </button>
          <MarketStrip
            segments={segments}
            emptyLabel={isInProgress ? undefined : "Odds not yet posted"}
          />
        </div>
      )}

      {/* ---------- expanded ---------- */}
      {expanded && !isFinal && (
        <>
          {hasPrediction && (
            <div className="gc-exp">
              <LeanBar
                awayAbbr={awayAbbr}
                homeAbbr={homeAbbr}
                margin={margin}
                sport={sport as Sport}
              />
            </div>
          )}

          {sport === "MLB" && (
            <div className="gc-exp">
              <PitcherBlock
                awayPitcher={awayPitcher}
                awayHand={awayPitcherHand}
                homePitcher={homePitcher}
                homeHand={homePitcherHand}
              />
            </div>
          )}

          <div className="gc-exp">
            <div className="gc-chips">
              <SnapshotButton
                data-action
                onClick={(e) => {
                  e.stopPropagation();
                  setSnapshotOpen(true);
                }}
              />
              {showWeatherChip && (
                <WeatherBadge
                  data-action
                  data-tour="weather-badge"
                  isIndoor={isEffectivelyIndoor}
                  isLoading={isWeatherLoading}
                  isError={isWeatherError}
                  data={weatherData}
                  onClick={(e) => {
                    e.stopPropagation();
                    setWeatherOpen(true);
                  }}
                />
              )}
              {sport !== "MLB" && (
                <InjuriesChipButton
                  data-action
                  onClick={(e) => {
                    e.stopPropagation();
                    setInjuryModalOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}

      <Suspense fallback={null}>
        {snapshotOpen && (
          <SnapshotModal
            gameId={gameId}
            sport={sport as Sport}
            onClose={() => setSnapshotOpen(false)}
            awayTeamName={awayTeamDisplay}
            homeTeamName={homeTeamDisplay}
          />
        )}

        {/* Gated rather than passed an isOpen it would return null on.
            A lazy() component still has to be fetched before React can
            call it, so rendering it unconditionally pulled the chunk on
            every Games load and defeated the split. */}
        {weatherOpen && (
          <WeatherModal
            onClose={() => setWeatherOpen(false)}
            weatherData={weatherData}
          />
        )}

        {injuryModalOpen && (
          <InjuryModal
            onClose={() => setInjuryModalOpen(false)}
            league={sport}
            gameDate={game.game_date}
            teamNames={[game.awayTeamName, game.homeTeamName]}
          />
        )}
      </Suspense>
    </article>
  );
};

const GameCard = memo(GameCardComponent);
export default GameCard;
