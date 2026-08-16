// frontend/src/components/ui/joyride_tour.tsx
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import Joyride, { STATUS, CallBackProps, EVENTS } from "react-joyride";
import { useSport } from "@/contexts/sport_context";
import { TourContext, type TourHop, TourStepId } from "@/contexts/tour_context";
import {
  baseSteps,
  CONDITIONAL_ANCHORS,
  desiredDrops,
  freezeDrops,
  routeForStep,
  sameSet,
  type AnchorPresence,
} from "@/utils/tour_steps";
import { CustomJoyrideTooltip } from "./custom_joyride_tooltip";

export type { TourStep } from "@/utils/tour_steps";

const readPresence = (): AnchorPresence =>
  Object.fromEntries(
    Object.entries(CONDITIONAL_ANCHORS).map(([id, selector]) => [
      id,
      Boolean(document.querySelector(selector)),
    ])
  ) as AnchorPresence;

/**
 * The tour's runtime. The step model, the anchor contract and the
 * filtering rules live in `utils/tour_steps.ts`, where they can be
 * tested — nothing in this project can drive the tour itself, because
 * `requestAnimationFrame` does not fire in the headless test browser.
 */
export const TourProvider = ({ children }: { children: ReactNode }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { sport } = useSport();

  /* Presence of the conditional anchors, tracked rather than assumed.
   * See CONDITIONAL_ANCHORS above for why this exists. */
  const [present, setPresent] = useState<AnchorPresence>(readPresence);

  useEffect(() => {
    const update = () =>
      setPresent((prev) => {
        const next = readPresence();
        // Unrelated DOM mutations must not re-render the whole tree.
        const same = (Object.keys(next) as (keyof AnchorPresence)[]).every(
          (k) => prev[k] === next[k]
        );
        return same ? prev : next;
      });
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const cleanUpArtifacts = useCallback(() => {
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
    document
      .querySelectorAll(".react-joyride__overlay, .react-joyride__spotlight")
      .forEach((n) => n.remove());
  }, []);

  /* Which steps are currently filtered out.
   *
   * State rather than a derivation, because it is not purely a function
   * of presence: a step behind the reader is frozen in whatever form it
   * already has. See the effect below.
   *
   * Filtered by id rather than by selector string, so re-pointing an
   * anchor cannot silently stop a filter from matching.
   *
   * There is no longer a per-sport rule for the two Stats steps. NFL used
   * to drop both, on the grounds that its stats screen "has a different
   * layout". Neither half held up. NFL has an Advanced sub-tab like every
   * other sport, and it has a Win % column too — its teams tab renders
   * `nflSummaryHeaders`, which spells the key `winPct` where MLB and NBA
   * use `wins_all_percentage`, so the anchor was simply never attached.
   * Filtering the steps hid the missing anchor instead of fixing it, and
   * cost NFL two steps it should always have had. Fixed at the source in
   * stats_screen. */
  const [dropped, setDropped] = useState<Set<TourStepId>>(() =>
    desiredDrops(sport, present)
  );

  const tourSteps = useMemo(
    () => baseSteps.filter((step) => !dropped.has(step.id)),
    [dropped]
  );

  /* The step showing right now, resolved against the filtered array.
   * Consumers match on this rather than on a position — see TourStepId. */
  const currentStepId: TourStepId | null = run
    ? tourSteps[stepIndex]?.id ?? null
    : null;

  /* The reader's position by id, readable from the effect below without
   * making the filter depend on the array it produces. Declared before
   * that effect so it is already current when the effect runs. */
  const readerIdRef = useRef<TourStepId | null>(null);
  useEffect(() => {
    readerIdRef.current = currentStepId;
  }, [currentStepId]);

  /* **The array may only change ahead of the reader.**
   *
   * The comment above CONDITIONAL_ANCHORS has always said that a step
   * disappearing mid-run renumbers everything after it. It was describing
   * a hazard; this is the rule that enforces it, because the hazard was
   * happening on every single run.
   *
   * The weather chip is a Games element. The moment the reader follows
   * the "Open the Stats tab" step, Games unmounts, the chip goes with it,
   * and the observer drops the weather step — so the array goes 9 to 8
   * under a reader sitting at index 4, and index 4 silently becomes a
   * different step. The tooltip changes its own content and the counter
   * goes "5 of 9" to "5 of 8" while the reader is reading it.
   *
   * So presence is still tracked, but it may only add or remove a step
   * strictly ahead of the reader. Behind, the array is what it was, which
   * is what makes a position stable long enough to step back through.
   * When the tour is not running there is no reader and nothing to
   * protect, so the filter resyncs freely.
   *
   * The rule itself is `freezeDrops`, which is pure and has tests. */
  useEffect(() => {
    setDropped((prev) => {
      const want = desiredDrops(sport, present);
      if (!run) return sameSet(prev, want) ? prev : want;
      return freezeDrops(prev, want, readerIdRef.current);
    });
  }, [sport, present, run]);

  /* What the next step will point at, so the tooltip can wait for it to
   * mount before moving. Switching sport swaps the whole Games grid for
   * skeletons while the new slate loads, so the card and chip anchors are
   * genuinely absent for a moment — long enough for Next to skip two
   * steps if it does not wait. */
  const nextTarget = tourSteps[stepIndex + 1]?.target;
  const nextStepTarget: string | null =
    run && typeof nextTarget === "string" ? nextTarget : null;

  /* The step Back returns to, with everything that hop needs: what it
   * points at, and which screen owns it. Mirrors nextStepTarget, because
   * Back has to be able to do what Next does. */
  const prev = stepIndex > 0 ? tourSteps[stepIndex - 1] : undefined;
  const prevStep: TourHop | null =
    run && prev
      ? {
          id: prev.id,
          target: typeof prev.target === "string" ? prev.target : null,
          route: routeForStep(prev.id),
        }
      : null;

  /* The step being moved to while a hop is in flight.
   *
   * game_card opens itself for the three steps whose anchors only exist
   * inside an expanded card, keyed on which step is showing. Moving
   * *back* into one of those breaks that: the card is freshly mounted and
   * collapsed, so its anchor cannot appear until the index moves, and the
   * index does not move until the anchor appears. Naming the pending step
   * breaks the deadlock — the card opens for it while the hop waits. */
  const [pendingStepId, setPendingStepId] = useState<TourStepId | null>(null);

  /* Direction of travel, so TARGET_NOT_FOUND can move the way the reader
   * asked rather than always forward. A ref because it is read inside a
   * callback and must not itself cause a render. */
  const travelRef = useRef<1 | -1>(1);
  const setTravel = useCallback((d: 1 | -1) => {
    travelRef.current = d;
  }, []);

  const handleJoyride = useCallback(
    (data: CallBackProps) => {
      const { status, type } = data;

      /* Target not mounted — skip past it rather than pointing at
       * nothing, **in the direction the reader asked to move**.
       *
       * This branch used to increment unconditionally, which is the
       * second half of defect 50: a Back that landed on an unmounted
       * anchor was not merely refused, it was turned round. The reader
       * pressed Back and the tour went on to the next step.
       *
       * Skipping backwards stops at the first step rather than ending the
       * tour, because "before the beginning" is not a place — running off
       * the end is a finish, running off the start is not. There is no
       * guard against firing repeatedly at index 0: the first step points
       * at the sport switcher, which is in the header on every screen, so
       * a missing target there means something far more wrong than a
       * tour hop.
       *
       * The functional updater is required, not stylistic. Joyride can
       * fire this several times before React commits, and reading
       * `stepIndex` from the closure made every one of those compute the
       * same value, so the tour stuck on a step and logged a burst of
       * "Target not mounted" instead of moving (defect 49). The direction
       * is read from a ref for the same reason it is stored in one: it
       * must not go stale inside a burst, and it must not cause a render.
       *
       * The upper bound is kept, but ending the tour is a side effect and
       * belongs outside an updater React invokes twice under StrictMode,
       * so the clamp happens here and the effect below reacts to it. */
      if (type === EVENTS.TARGET_NOT_FOUND) {
        const back = travelRef.current === -1;
        setStepIndex((i) =>
          back ? Math.max(i - 1, 0) : Math.min(i + 1, tourSteps.length)
        );
        return;
      }

      const isTourFinished =
        status === STATUS.FINISHED || status === STATUS.SKIPPED;

      if (isTourFinished || type === EVENTS.TOUR_END) {
        if (run) {
          setRun(false);
          setStepIndex(0);
        }
        setTimeout(cleanUpArtifacts, 50);
      }
    },
    [run, tourSteps.length, cleanUpArtifacts]
  );

  /* Ran off the end skipping absent targets. Ends the tour the same way a
   * finish does, rather than leaving Joyride with a stepIndex outside its
   * own array. */
  useEffect(() => {
    if (!run || stepIndex < tourSteps.length) return;
    setRun(false);
    setStepIndex(0);
    const t = setTimeout(cleanUpArtifacts, 50);
    return () => clearTimeout(t);
  }, [run, stepIndex, tourSteps.length, cleanUpArtifacts]);

  const start = () => {
    setRun(false);
    setStepIndex(0);
    setTimeout(() => setRun(true), 0);
  };

  const contextValue = {
    start,
    setStepIndex,
    setRun,
    currentStepIndex: stepIndex,
    currentStepId,
    nextStepTarget,
    prevStep,
    pendingStepId,
    setPendingStepId,
    setTravel,
    run,
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {run && (
        <Joyride
          steps={tourSteps}
          run={run}
          stepIndex={stepIndex}
          callback={handleJoyride}
          tooltipComponent={CustomJoyrideTooltip}
          disableScrolling={true}
          scrollToFirstStep
          styles={{ options: { zIndex: 9999 } }}
        />
      )}
    </TourContext.Provider>
  );
};
