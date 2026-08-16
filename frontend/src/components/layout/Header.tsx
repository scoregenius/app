// frontend/src/components/layout/Header.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

import LogoWordmark from "./logo_wordmark";

import SegmentedControl from "../ui/segmented_control";
import type { SegmentedOption } from "../ui/segmented_control";
import { useSport, Sport } from "@/contexts/sport_context";

/* Fixed at three — see design_system.md §4. There is no fourth sport. */
const SPORT_OPTIONS: ReadonlyArray<SegmentedOption<Sport>> = [
  { value: "MLB", label: "MLB" },
  { value: "NBA", label: "NBA" },
  { value: "NFL", label: "NFL" },
];

/**
 * The app header — see docs/design_system.md §6.6. Mounted once, in
 * App.tsx, so it appears on every screen.
 *
 * Takes no props. It previously accepted showDatePicker, which nothing
 * ever passed, so its date button, Popover and Calendar never rendered —
 * and that dead block carried a second, conflicting date-button style.
 * The date control belongs to the Games screen, which owns the date the
 * API is asked for, and lives in game_screen.tsx.
 */
const Header: React.FC = () => {
  const navigate = useNavigate();
  const { sport, setSport } = useSport();

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 flex items-center justify-between gap-3 py-2",
        // 12px mobile / 24px desktop per §5.3. The flat 24px overflowed a
        // 320px viewport: the header measured scrollWidth 322 against a
        // 320px client, with the right padding fully consumed.
        "px-3 sm:px-6",
        "chrome-surface border-b border-line"
      )}
    >
      {/* Logo */}
      <button
        onClick={() => navigate("/games")}
        aria-label="ScoreGenius home"
        className="flex shrink-0 items-center gap-2 rounded-md focus-ring"
      >
        <LogoWordmark className="logo-svg h-5 sm:h-7 md:h-8 w-auto" />
      </button>

      {/* Guided-tour contract: renders data-tour="sport-switch" on the
          track. joyride_tour.tsx targets it by selector and fails
          silently if it is missing, so keep the literal here where a
          grep for data-tour will find it. */}
      <SegmentedControl
        options={SPORT_OPTIONS}
        value={sport}
        onChange={setSport}
        label="Sport"
        tourId="sport-switch"
      />
    </header>
  );
};

export default Header;
