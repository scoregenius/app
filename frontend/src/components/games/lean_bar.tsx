// frontend/src/components/games/lean_bar.tsx
import React from "react";
import type { Sport } from "@/types";
import { leanFraction } from "@/utils/market";

export interface LeanBarProps {
  awayAbbr: string;
  homeAbbr: string;
  /** predHome − predAway. Positive favours home, negative favours away. */
  margin: number;
  sport: Sport;
}

/**
 * The predicted margin drawn as a shape. It restates the two scores above it
 * rather than adding a claim — no new data, just a faster read.
 *
 * Centre-origin: the fill runs right from the middle when the model favours
 * home, left when it favours away, scaled per sport.
 */
const LeanBar: React.FC<LeanBarProps> = ({
  awayAbbr,
  homeAbbr,
  margin,
  sport,
}) => {
  const favoursHome = margin > 0;
  const width = leanFraction(margin, sport) * 100;
  const magnitude = Math.abs(margin);

  const caption =
    magnitude === 0
      ? "Even"
      : `${favoursHome ? homeAbbr : awayAbbr} by ${magnitude.toFixed(1)}`;

  return (
    <div>
      <div className="gc-lean-track">
        <span className="gc-lean-mid" />
        <span
          className="gc-lean-fill"
          style={
            favoursHome
              ? { left: "50%", width: `${width}%` }
              : { right: "50%", width: `${width}%` }
          }
        />
      </div>
      <div className="gc-lean-cap">
        <span>{awayAbbr}</span>
        <span>
          <b>{caption}</b>
        </span>
        <span>{homeAbbr}</span>
      </div>
    </div>
  );
};

export default LeanBar;
