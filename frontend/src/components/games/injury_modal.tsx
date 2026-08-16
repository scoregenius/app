// frontend/src/components/games/injury_modal.tsx
import React, { useMemo, Suspense, lazy } from "react";
import Modal from "@/components/ui/modal";
import type { Injury } from "@/api/use_injuries";
import { useInjuries } from "@/api/use_injuries";

const InjuryReport = lazy(() => import("@/components/shared/injury_report"));

interface InjuryModalProps {
  onClose: () => void;
  league: string;
  gameDate: string;
  teamNames: [string, string];
}

/**
 * See docs/design_system.md §6.7.
 *
 * This was the only one of the three modals that did not render through
 * a portal, and it did not survive the card it was declared inside. The
 * card sets `contain: layout`, which makes it the containing block for
 * any fixed-position descendant, and `overflow: hidden`, which clips
 * one. So the backdrop written as `fixed inset-0` resolved to the card's
 * own box — measured at 393x232 at (25,128) in a 1280x720 window,
 * against a card of 395x234 at (24,127) — and the panel was cut off at
 * the card's edges. The rest of the page was never covered.
 *
 * The shell portals to document.body, which is the fix.
 */
const InjuryModal: React.FC<InjuryModalProps> = ({
  onClose,
  league,
  gameDate,
  teamNames,
}) => {
  const {
    data: allInjuries,
    isLoading: isLoadingInjuries,
    error: injuriesError,
  } = useInjuries(league, gameDate, { enabled: true });

  const { teamsWithInjuries, injuriesByTeam } = useMemo(() => {
    if (!allInjuries) return { teamsWithInjuries: [], injuriesByTeam: {} };

    const grouped = allInjuries
      .filter((inj) => teamNames.includes(inj.team_display_name))
      .reduce<Record<string, Injury[]>>((acc, inj) => {
        (acc[inj.team_display_name] ??= []).push(inj);
        return acc;
      }, {});

    /* Away first, then home — the card's order, so the modal lists the
     * two sides the way the card that opened it did. Object key order
     * would otherwise follow whatever the feed happened to send. */
    const ordered = teamNames.filter((t) => grouped[t]?.length);

    return { teamsWithInjuries: ordered, injuriesByTeam: grouped };
  }, [allInjuries, teamNames]);

  const displayDate = useMemo(() => {
    const d = new Date(`${gameDate}T12:00:00Z`);
    return d.toLocaleDateString([], { month: "long", day: "numeric" });
  }, [gameDate]);

  const isPastDate =
    new Date(`${gameDate}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Modal
      onClose={onClose}
      title="Injury report"
      subtitle={`${league.toUpperCase()} · ${displayDate}`}
    >
      <Suspense fallback={null}>
        <InjuryReport
          displayDate={displayDate}
          isPastDate={isPastDate}
          allGamesFilteredOut={false}
          isLoadingInjuries={isLoadingInjuries}
          injuriesError={injuriesError as Error | undefined}
          teamsWithInjuries={teamsWithInjuries}
          injuriesByTeam={injuriesByTeam}
          /* Two teams. Collapsing them would make you open both to see
           * anything. */
          collapsible={false}
        />
      </Suspense>
    </Modal>
  );
};

export default InjuryModal;
