// frontend/src/components/ui/empty_state.tsx
import React from "react";
import type { LucideProps } from "lucide-react";

export interface EmptyStateProps {
  icon: React.ComponentType<LucideProps>;
  /** One short factual line. Not an apology. */
  title: string;
  description?: string;
  /** Only where a next step genuinely exists. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * The shared empty state. An unstyled sentence on its own reads as a
 * failure rather than a result, which is how the previous "No NBA games
 * scheduled" line came across — see docs/design_system.md §6.9.
 *
 * Centred, with an icon to signal that this is a designed state, a factual
 * title, and one line of context. No apologies, no exclamation marks.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center px-6 py-12 text-center ${className}`}
  >
    <span className="mb-3.5 grid h-12 w-12 place-items-center rounded-xl border border-line-2 text-ink-3">
      <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
    </span>
    <p className="text-[15px] font-bold tracking-[-0.01em] text-ink">{title}</p>
    {description && (
      <p className="mt-1.5 max-w-[38ch] text-[13px] leading-relaxed text-ink-2">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
