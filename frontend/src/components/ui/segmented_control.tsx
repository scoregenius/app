// frontend/src/components/ui/segmented_control.tsx
import React from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  /** Natural-case label. The stylesheet uppercases it. */
  label: string;
  /** Guided-tour anchor, applied to this item's button. */
  tourId?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (next: T) => void;
  /** Accessible name for the group, e.g. "Sport". Never rendered. */
  label: string;
  /** Guided-tour anchor, applied to the track. */
  tourId?: string;
  className?: string;
}

/**
 * The shared segmented control — see docs/design_system.md §6.3.
 *
 * Replaces three separate implementations: the header sport switcher,
 * the Stats sub-tabs and the Stats season selector. Each styled itself
 * differently, and the header's used `focus:outline-none` with no
 * replacement, so it had no keyboard focus indication at all.
 *
 * Plain buttons with `aria-pressed` rather than tab or radio semantics:
 * each item is its own tab stop, which needs no roving tabindex and no
 * arrow-key handler to be operable from the keyboard. The panels these
 * switch between are not marked up as tabpanels, so borrowing tab
 * semantics would promise a relationship the DOM does not have.
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  tourId,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      data-tour={tourId}
      className={`sc-track ${className}`.trim()}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            data-tour={opt.tourId}
            onClick={() => onChange(opt.value)}
            className="sc-item"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
