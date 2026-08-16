// frontend/src/components/ui/custom_joyride_tooltip.tsx
import React from "react";
import type { TooltipRenderProps } from "react-joyride";
import { useLocation, useNavigate } from "react-router-dom";
import { useTour } from "@/contexts/tour_context";

/** Resolves true when the element is laid out, false on timeout. */
const waitForElement = (
  selector: string,
  timeout = 3_000,
  poll = 100
): Promise<boolean> =>
  new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el && el.offsetWidth && el.offsetHeight) {
        return resolve(true);
      }
      if (performance.now() - start >= timeout) {
        console.warn(
          `[Joyride] waited ${timeout} ms – element not found`,
          selector
        );
        return resolve(false);
      }
      setTimeout(check, poll);
    };
    check();
  });

/**
 * A hop that changes screen has to wait for a mount and usually a fetch,
 * so it gets longer than one that stays put. Forward hops never need this
 * — the reader has already navigated by the time they press Next.
 */
const ROUTED_TIMEOUT = 6_000;

export const CustomJoyrideTooltip: React.FC<TooltipRenderProps> = ({
  index,
  size,
  step,
  isLastStep,
  tooltipProps,
}) => {
  const {
    setStepIndex,
    setRun,
    currentStepIndex,
    currentStepId,
    nextStepTarget,
    prevStep,
    setPendingStepId,
    setTravel,
  } = useTour();

  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Wait for the next step's own anchor before moving to it.
   *
   * This used to be a hand-maintained map of which step waits for what,
   * and it listed exactly one entry: the card step waiting for the H2H
   * chip. Every other hop advanced blind, so any anchor that had not
   * mounted yet made Joyride fire TARGET_NOT_FOUND and skip the step —
   * and then skip the next one too if it was also unmounted.
   *
   * That is what made switching sport mid-session jump from step 1 to
   * step 4: the Games grid is replaced by skeletons while the new slate
   * loads, so neither the card nor the H2H chip existed, and Next
   * blew past both.
   *
   * Reading the target off the step itself covers every hop and needs no
   * maintenance when steps are added or reordered. If the anchor never
   * arrives the wait times out and the skip still happens, which is the
   * right outcome for a sport with no games.
   */
  const [moving, setMoving] = React.useState(false);

  const advance = async () => {
    if (moving) return;
    setTravel(1);
    if (nextStepTarget) {
      setMoving(true);
      await waitForElement(nextStepTarget);
      setMoving(false);
    }
    setStepIndex(currentStepIndex + 1);
  };

  /**
   * Back, which routes. See docs/design_system.md §6.10.
   *
   * It used to set the index and nothing else — no target check, no wait,
   * while its counterpart above waited up to three seconds. Landing on an
   * anchor that was not mounted therefore fired TARGET_NOT_FOUND, and
   * that handler only ever incremented, so **Back moved the reader
   * forward**. Defect 50.
   *
   * Most Back presses were fine and still are: six of the nine steps
   * either sit on the screen the reader is already on, or point at app
   * chrome that is on every screen. It broke where Back crosses a screen
   * boundary backwards — clearest from the Stats-tab step, whose previous
   * step points at the weather chip, a Games element the tour had no way
   * to return to.
   *
   * So the tour routes backwards. Forwards it deliberately does not: the
   * two "open this tab, then press Next" steps exist to make the reader
   * find the tab themselves, and that is the lesson. Retracing teaches
   * nothing, and asking the reader to work out which screen a step used
   * to live on is a puzzle rather than a guide.
   *
   * The order matters. Name the pending step first, so the game card can
   * open for it while the hop is in flight; then route; then wait for the
   * anchor; only then commit the index.
   *
   * **A hop that cannot reach its anchor does not move.** Advancing may
   * move anyway and let TARGET_NOT_FOUND skip on, because forwards there
   * is always somewhere useful to end up. Backwards there is not: a
   * commit onto a missing anchor makes the skip handler step back again,
   * and then again, so one Back press walks the reader to the first step.
   * Measured, doing exactly that — one press, four steps. Refusing is the
   * honest outcome, and the reader is left on a step that still works.
   */
  const goBack = async () => {
    if (moving || !prevStep) return;

    setTravel(-1);
    setMoving(true);
    setPendingStepId(prevStep.id);

    const routed = Boolean(
      prevStep.route && location.pathname !== prevStep.route
    );
    if (routed && prevStep.route) navigate(prevStep.route);

    const reached = prevStep.target
      ? await waitForElement(
          prevStep.target,
          routed ? ROUTED_TIMEOUT : undefined
        )
      : true;

    if (reached) {
      setStepIndex(currentStepIndex - 1);
    } else {
      // Nothing moved, so the direction must not stay pointing backwards.
      setTravel(1);
    }

    setPendingStepId(null);
    setMoving(false);
  };

  const stopTour = () => {
    setRun(false);
    setStepIndex(0);
  };

  const noGameCardPresent = !document.querySelector('[data-tour="game-card"]');
  const isOnGameCardStep = currentStepId === "game-card";
  const targetSelector = typeof step.target === "string" ? step.target : "";
  const targetMissing =
    targetSelector && !document.querySelector(targetSelector);
  const showFallback = isOnGameCardStep && (noGameCardPresent || targetMissing);

  const fallbackContent = (
    <>
      <div>
        <strong>No games scheduled for this date.</strong>
      </div>
      <p className="jrt-note">
        Pick another date from the calendar, or switch to a sport that has games
        today. Once a card is on screen, press Next to carry on.
      </p>
    </>
  );

  return (
    <div {...tooltipProps} className="jrt">
      {/* Nine steps across three screens, and the count varies by sport —
          the reader has no way to judge how much is left without this. */}
      <div className="jrt-head">
        <span className="jrt-step">
          Step {index + 1} of {size}
        </span>
        <span className="jrt-dots" aria-hidden="true">
          {Array.from({ length: size }, (_, i) => (
            <i key={i} className={i <= index ? "jrt-dot jrt-dot--on" : "jrt-dot"} />
          ))}
        </span>
      </div>

      <div className="jrt-body">
        {showFallback ? fallbackContent : step.content}
      </div>

      <div className="jrt-foot">
        <button type="button" onClick={stopTour} className="jrt-skip">
          {isLastStep ? "Finish" : "Skip"}
        </button>

        <div className="jrt-btns">
          {index > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={moving}
              className="jrt-back"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={showFallback || isLastStep ? stopTour : advance}
            disabled={moving}
            className="jrt-next"
          >
            {showFallback ? "Got it" : isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};
