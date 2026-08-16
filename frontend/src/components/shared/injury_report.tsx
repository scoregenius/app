// frontend/src/components/shared/injury_report.tsx

import React from "react";
import { ChevronDown, CircleCheck } from "lucide-react";
import EmptyState from "@/components/ui/empty_state";
import { Injury, isUnavailable } from "@/api/use_injuries";

interface InjuryReportProps {
  displayDate: string;
  isPastDate: boolean;
  allGamesFilteredOut: boolean;
  isLoadingInjuries: boolean;
  injuriesError?: Error;
  teamsWithInjuries: string[];
  injuriesByTeam: Record<string, Injury[]>;
  /**
   * Collapse each team behind a summary. True for the schedule screens,
   * where a full slate runs to a dozen teams; false in the game modal,
   * which has exactly two and should not make you open both.
   */
  collapsible?: boolean;
}

/**
 * Shared by the injury modal and by the NFL and NBA schedule screens —
 * three consumers, so changes here are visible in all three.
 *
 * See docs/design_system.md §6.9 for the states and §8.1 for the modal
 * it sits inside.
 */

/**
 * Players who are definitely out lead, then the degrees of doubt. Within
 * each group the feed's own order is kept — it is not alphabetical, but
 * it is stable, and inventing an order would imply a ranking the data
 * does not carry.
 */
const bySeverity = (a: Injury, b: Injury): number =>
  Number(isUnavailable(b.status)) - Number(isUnavailable(a.status));

const PlayerRows: React.FC<{ injuries: Injury[] }> = ({ injuries }) => (
  <div>
    {[...injuries].sort(bySeverity).map((inj) => (
      <div key={inj.id} className="sgm-inj-row">
        <div className="min-w-0">
          <div className="sgm-inj-player">{inj.player}</div>
          {inj.injury_type && (
            <div className="sgm-inj-type">{inj.injury_type}</div>
          )}
        </div>
        <span
          className={`sgm-inj-badge${
            isUnavailable(inj.status) ? " sgm-inj-badge--out" : ""
          }`}
        >
          {inj.status}
        </span>
      </div>
    ))}
  </div>
);

/** Mirrors the row anatomy, so nothing moves when the data arrives. */
const LoadingRows: React.FC = () => (
  <div aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <div key={i} className="sgm-inj-row">
        <div className="min-w-0 flex-1">
          <div className="sgm-skel h-[13px] w-[46%]" />
          <div className="sgm-skel mt-1.5 h-[10px] w-[24%]" />
        </div>
        <div className="sgm-skel h-[19px] w-[74px]" />
      </div>
    ))}
  </div>
);

const InjuryReport: React.FC<InjuryReportProps> = ({
  displayDate,
  isPastDate,
  allGamesFilteredOut,
  isLoadingInjuries,
  injuriesError,
  teamsWithInjuries,
  injuriesByTeam,
  collapsible = true,
}) => {
  if (isPastDate) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="No statuses to report"
        description="These games have been completed."
      />
    );
  }

  if (allGamesFilteredOut) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="No statuses to report"
        description="There are no remaining games today."
      />
    );
  }

  if (isLoadingInjuries) return <LoadingRows />;

  /* A failed request is absence, not an error a reader can act on
   * (§6.9). It must not borrow the "no injuries" copy, though — saying
   * nobody is hurt when the app does not know would be stating
   * something false. */
  if (injuriesError) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="Injury report unavailable"
        description="The report could not be loaded. It will return on its own."
      />
    );
  }

  if (teamsWithInjuries.length === 0) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="No injuries reported"
        description={`No listed statuses for ${displayDate}.`}
      />
    );
  }

  if (!collapsible) {
    return (
      <div>
        {teamsWithInjuries.map((team) => (
          <section key={team}>
            <div className="sgm-inj-team">
              <span className="sgm-inj-name">{team}</span>
              <span className="sgm-inj-count">
                {injuriesByTeam[team].length}
              </span>
            </div>
            <PlayerRows injuries={injuriesByTeam[team]} />
          </section>
        ))}
      </div>
    );
  }

  return (
    <div>
      {teamsWithInjuries.map((team) => (
        <details key={team}>
          <summary className="sgm-inj-summary">
            <span className="sgm-inj-name">{team}</span>
            <span className="flex items-center gap-2.5">
              <span className="sgm-inj-count">
                {injuriesByTeam[team].length}
              </span>
              <ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </summary>
          <PlayerRows injuries={injuriesByTeam[team]} />
        </details>
      ))}
    </div>
  );
};

export default InjuryReport;
