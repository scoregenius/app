// frontend/src/components/games/pitcher_block.tsx
import React from "react";
import clsx from "clsx";
import { cleanPitcher, formatPitcher } from "@/utils/pitchers";

export interface PitcherBlockProps {
  awayPitcher?: string | null;
  awayHand?: string | null;
  homePitcher?: string | null;
  homeHand?: string | null;
}

/**
 * MLB probable starters. Renders nothing for other sports — the card gates
 * on that — and nothing when neither starter is known, since two TBDs teach
 * the reader nothing.
 *
 * When exactly one is known, both slots stay and the unknown reads TBD. A
 * lone unlabelled name is genuinely ambiguous about which side it belongs
 * to, which is also why the AWAY and HOME labels are required rather than
 * decorative. See docs/design_system.md §8.1.
 */
const PitcherBlock: React.FC<PitcherBlockProps> = ({
  awayPitcher,
  awayHand,
  homePitcher,
  homeHand,
}) => {
  const away = formatPitcher(awayPitcher, awayHand);
  const home = formatPitcher(homePitcher, homeHand);

  if (!cleanPitcher(awayPitcher) && !cleanPitcher(homePitcher)) return null;

  return (
    <div className="gc-pitch">
      <span className={clsx(!away && "gc-pitch-tbd")}>
        <em className="gc-pitch-label">Away</em>
        {away ?? "TBD"}
      </span>
      <span className={clsx(!home && "gc-pitch-tbd")}>
        <em className="gc-pitch-label">Home</em>
        {home ?? "TBD"}
      </span>
    </div>
  );
};

export default PitcherBlock;
