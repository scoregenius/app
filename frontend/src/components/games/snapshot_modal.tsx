// frontend/src/components/games/snapshot_modal.tsx

/* ------------------------------------------------------------------
 * Snapshot Modal | head-to-head breakdown for MLB, NBA and NFL
 * ------------------------------------------------------------------*/
import React, { useEffect, Suspense, lazy } from "react";
import { BarChart3, ExternalLink, WifiOff } from "lucide-react";
import Modal from "@/components/ui/modal";
import EmptyState from "@/components/ui/empty_state";
import { useSnapshot } from "@/hooks/use_snapshot";
import { useOnline } from "@/contexts/online_context";
import { abbr } from "@/utils/team_abbr";
import { hasPlottableData, hasPieData } from "@/utils/chart_data";
import { Sport, SnapshotData, PieChartDataItem, HeadlineStat } from "@/types";

const BarChartComponent = lazy(() => import("./charts/bar_chart_component"));
const RadarChartComponent = lazy(
  () => import("./charts/radar_chart_component")
);
const PieChartComponent = lazy(() => import("./charts/pie_chart_component"));

interface SnapshotModalProps {
  gameId: string;
  sport: Sport;
  onClose: () => void;
  /** Falls back to the labels in the payload when not supplied. */
  awayTeamName?: string;
  homeTeamName?: string;
}

/** The backend returns this instead of a snapshot for exhibition games. */
interface ExhibitionResponse {
  message: string;
}

type SnapshotResponse = SnapshotData | ExhibitionResponse;

const DOCS_URL = "https://scoregenius.io/documentation#snapshots";

/** A chart and its heading, or neither. */
const ChartSection: React.FC<{
  title: string;
  show: boolean;
  children: React.ReactNode;
}> = ({ title, show, children }) =>
  !show ? null : (
    <>
      <div className="sgm-sect">
        <span>{title}</span>
        <i />
      </div>
      <div className="sgm-chart">{children}</div>
    </>
  );

/** Mirrors the anatomy rather than saying "Loading" (§6.8). */
const SnapshotSkeleton: React.FC = () => (
  <div aria-hidden="true">
    <div className="sgm-sect">
      <span>Key insights</span>
      <i />
    </div>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="sgm-stat">
        <span className="sgm-skel h-[12px] w-[44%]" />
        <span className="sgm-skel h-[13px] w-[52px]" />
      </div>
    ))}
    <div className="sgm-sect">
      <span>Charts</span>
      <i />
    </div>
    <div className="sgm-skel h-[200px] w-full" />
  </div>
);

const SnapshotModal: React.FC<SnapshotModalProps> = ({
  gameId,
  sport,
  onClose,
  awayTeamName,
  homeTeamName,
}) => {
  const online = useOnline();

  const {
    data: snapshotData,
    isLoading,
    isError,
    refetch,
  } = useSnapshot(gameId, sport) as {
    data: SnapshotResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
  };

  /* The query is declared disabled and driven from here, so it runs on
   * mount — which, now that the card gates the element, is the moment
   * the modal opens. */
  useEffect(() => {
    if (online) refetch();
  }, [online, refetch]);

  const isExhibition = !!(snapshotData && "message" in snapshotData);
  const sd = !isExhibition ? (snapshotData as SnapshotData) : undefined;

  const away = awayTeamName ?? sd?.away_team_label ?? sd?.away_team_name;
  const home = homeTeamName ?? sd?.home_team_label ?? sd?.home_team_name;

  /* NBA carries its quarter data on a different key from the other two. */
  const barData = sport === "NBA" ? sd?.chart_data : sd?.bar_chart_data;
  const pieData = sd?.pie_chart_data;

  const barTitle =
    sport === "MLB"
      ? "Scoring averages"
      : sport === "NFL"
      ? "Quarter averages"
      : "Quarter scoring";
  const pieTitle =
    sport === "MLB"
      ? "Avg runs vs LHP / RHP"
      : sport === "NFL"
      ? "Scoring averages"
      : "Scoring distribution";

  /* MLB sends one flat pie; NFL and NBA send a titled pair. */
  const isMultiPie =
    Array.isArray(pieData) &&
    (pieData as Array<{ data?: unknown }>)[0]?.data !== undefined;
  const multiPies = isMultiPie
    ? (pieData as unknown as Array<{ title: string; data: PieChartDataItem[] }>)
        .filter((p) => hasPieData(p.data))
    : [];
  const showPie = isMultiPie
    ? multiPies.length > 0
    : hasPieData(pieData as PieChartDataItem[] | undefined);

  const allHeadlines: HeadlineStat[] =
    sd?.headline_stats ?? sd?.headline_data ?? [];

  /**
   * "Season Stats: 2026" is not an insight — it says which season the
   * figures below cover, which is context for the whole panel. It moves
   * to the subtitle, where it also stops a four-digit year counting as a
   * measurement in the all-zero check beneath.
   */
  const seasonRow = allHeadlines.find(
    (h) => /season/i.test(h.label) && /^\d{4}$/.test(String(h.value).trim())
  );
  const headlines = allHeadlines.filter((h) => h !== seasonRow);

  /**
   * A differential of zero is a legitimate reading, so individual zeros
   * stay. But when every numeric headline is zero the model has nothing
   * for this fixture — which is what an NFL preseason snapshot looks
   * like — and §7.3 rules that case: one line saying why, rather than
   * six values that are not values.
   */
  const numericHeadlines = headlines.filter(
    (h) => typeof h.value === "number" || /^-?[\d.,]+%?$/.test(String(h.value))
  );
  const allZero =
    numericHeadlines.length > 0 &&
    numericHeadlines.every((h) => {
      const digits = String(h.value).replace(/[^\d.-]/g, "");
      const n = Number(digits);
      return Number.isFinite(n) && n === 0;
    });

  const title = "Head-to-head";
  const subtitle = [sport, seasonRow && String(seasonRow.value).trim(), sd?.stage]
    .filter(Boolean)
    .join(" · ");

  const banner =
    away && home ? (
      <div className="sgm-vs">
        <div className="sgm-vs-row">
          <span className="sgm-vs-abbr">{abbr(away)}</span>
          <span className="sgm-vs-name">{away}</span>
          <span className="sgm-vs-tag">Away</span>
        </div>
        <div className="sgm-vs-row">
          <span className="sgm-vs-abbr">{abbr(home)}</span>
          <span className="sgm-vs-name">{home}</span>
          <span className="sgm-vs-tag">Home</span>
        </div>
      </div>
    ) : undefined;

  if (!online) {
    return (
      <Modal onClose={onClose} title={title} subtitle={sport}>
        <EmptyState
          icon={WifiOff}
          title="You're offline"
          description="Head-to-head breakdowns need a connection. This will work again once you reconnect."
        />
      </Modal>
    );
  }

  /* A failed request is absent data, not a state anyone can act on
   * (§6.9). It used to be a red panel with the raw error message in it. */
  if (isError) {
    return (
      <Modal onClose={onClose} title={title} subtitle={sport} banner={banner}>
        <EmptyState
          icon={BarChart3}
          title="Breakdown unavailable"
          description="This one could not be loaded. It will return on its own."
        />
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title={title} subtitle={subtitle} banner={banner}>
      {isLoading ? (
        <SnapshotSkeleton />
      ) : isExhibition ? (
        <EmptyState
          icon={BarChart3}
          title="Exhibition game"
          description={(snapshotData as ExhibitionResponse).message}
        />
      ) : (
        <>
          {headlines.length > 0 && (
            <>
              <div className="sgm-sect">
                <span>Key insights</span>
                <i />
              </div>
              {allZero ? (
                <p className="sgm-note">
                  No games played yet — season differentials start once the
                  campaign does.
                </p>
              ) : (
                <div>
                  {headlines.map((item, i) => (
                    <div key={`${item.label}-${i}`} className="sgm-stat">
                      <span className="sgm-stat-k">{item.label}</span>
                      <span className="sgm-stat-v">
                        {typeof item.value === "number"
                          ? item.value.toLocaleString()
                          : item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <Suspense fallback={<div className="sgm-skel mt-4 h-[200px] w-full" />}>
            <ChartSection title={barTitle} show={hasPlottableData(barData)}>
              <BarChartComponent data={barData} />
            </ChartSection>

            <ChartSection
              title="Team strengths"
              show={hasPlottableData(sd?.radar_chart_data)}
            >
              <RadarChartComponent data={sd?.radar_chart_data} />
            </ChartSection>

            <ChartSection title={pieTitle} show={showPie}>
              {isMultiPie ? (
                <div className="flex flex-wrap items-start justify-center gap-4 py-2">
                  {multiPies.map((p) => (
                    <div key={p.title} className="flex flex-col items-center">
                      <div className="sgm-vs-tag mb-1.5">{p.title}</div>
                      <PieChartComponent data={p.data} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center py-2">
                  <PieChartComponent data={pieData as PieChartDataItem[]} />
                </div>
              )}
            </ChartSection>

            <ChartSection
              title="Key offensive metrics"
              show={hasPlottableData(sd?.key_metrics_data)}
            >
              <BarChartComponent
                key={`${gameId}-keymetrics`}
                data={sd?.key_metrics_data}
              />
            </ChartSection>
          </Suspense>

          <p className="sgm-foot">
            Charts respond to tap and hover for exact values.{" "}
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              What these metrics mean
              <ExternalLink size={10} aria-hidden="true" />
            </a>
          </p>
        </>
      )}
    </Modal>
  );
};

export default SnapshotModal;
