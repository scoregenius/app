// frontend/src/components/games/team_row.tsx
import React from "react";
import clsx from "clsx";

export interface TeamRowProps {
  /** Short code from utils/team_abbr — the row's anchor for scanning. */
  abbr: string;
  teamName: string;
  /** Already formatted: "4.5", "121", or "—" when there is nothing to show. */
  value: string;
  /** The side the model does not favour. Recedes to secondary ink. */
  faded?: boolean;
  /** The side the model favours. Adds the marker and keeps full contrast. */
  isPick?: boolean;
}

/**
 * One team, one predicted or final score. Two of these make the matchup.
 *
 * The value sits in a fixed-width, right-aligned column so the numbers form a
 * scannable line down a full slate — see docs/design_system.md §7.1.
 */
const TeamRow: React.FC<TeamRowProps> = ({
  abbr,
  teamName,
  value,
  faded = false,
  isPick = false,
}) => (
  <div className={clsx("gc-team", faded && "gc-team--fade")}>
    <span className="gc-abbr">{abbr}</span>
    <span className="gc-name">{teamName}</span>
    <span className="gc-num">
      {/* Always rendered. Hidden with visibility rather than display so it
       * keeps its width and the two scores stay aligned. */}
      <i
        className={clsx("gc-pick", !isPick && "gc-pick--hidden")}
        aria-hidden="true"
      />
      {/* The marker is shape alone, so it needs a text equivalent. */}
      {isPick && <span className="sr-only">Model favours </span>}
      {value}
    </span>
  </div>
);

export default TeamRow;
