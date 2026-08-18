// frontend/src/components/ui/list_row.tsx
import React from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import type { LucideProps } from "lucide-react";

/**
 * The list row. See docs/design_system.md §6.12.
 *
 * §6 named this as the one component More needs that the library does
 * not have, and §8.4 deferred it until this screen was specified. The
 * screen previously hand-rolled two local components over three strings
 * of Tailwind utilities — `bg-white`, `border-slate-300`,
 * `text-slate-700`, `dark:bg-[var(--color-panel)]` — mixing the stock
 * ramps with the tokens, which §5.1 calls the single largest source of
 * inconsistency in the app.
 *
 * A group is one surface with rows in it. Rows do not carry their own
 * border or radius; the group does, and a hairline divides them. That is
 * §6.1's card language applied to a list, and it is what makes the list
 * visible in light mode, where a row and the page are both `#ffffff`.
 *
 * Three rules are encoded here rather than left to the call site,
 * because all three were wrong on the screen this replaces:
 *
 *  - **A `mailto:` is not a new tab.** The old rows opened every href
 *    with `target="_blank"`, which on desktop leaves an empty tab behind
 *    when the mail client takes over, and announced itself as "opens in
 *    new tab", which is not what happens. `LinkRow` reads the scheme.
 *  - **The trailing glyph says where you are going.** An arrow leaves
 *    the app, a chevron does not. Every row used to carry the same
 *    external-link glyph, including the two buttons that never leave the
 *    screen.
 *  - **Icons are sized here.** The old `ActionRow` set no size at all,
 *    so lucide's 24px default applied and "Restart the tour" was the one
 *    row in the list rendering 4px taller than its neighbours.
 */

type Icon = React.ComponentType<LucideProps>;

const ICON_SIZE = 18;
const TRAIL_SIZE = 14;
const STROKE = 1.8;

/* ------------------------------------------------------------------ */
/* Group                                                               */
/* ------------------------------------------------------------------ */

export interface ListGroupProps {
  children: React.ReactNode;
  className?: string;
}

/** One panel. Children are divided by a hairline, in source order. */
export const ListGroup: React.FC<ListGroupProps> = ({
  children,
  className = "",
}) => <div className={`lr-group ${className}`.trim()}>{children}</div>;

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

export interface LinkRowProps {
  /** An absolute URL or a `mailto:`. The scheme decides the behaviour. */
  href: string;
  /** Sentence case, or the document's own title where it names one. */
  label: string;
  icon: Icon;
  /**
   * Overrides the generated accessible name. Use where the visible label
   * is shorter than what should be announced.
   */
  ariaLabel?: string;
}

/**
 * A row that leaves the app. Both destinations take the arrow; what
 * changes is whether a tab is opened and what the row announces.
 */
export const LinkRow: React.FC<LinkRowProps> = ({
  href,
  label,
  icon: Icon,
  ariaLabel,
}) => {
  const isMail = href.startsWith("mailto:");
  const suffix = isMail ? "opens your email app" : "opens in a new tab";

  return (
    <a
      className="lr"
      href={href}
      {...(isMail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      aria-label={ariaLabel ?? `${label} (${suffix})`}
    >
      <Icon
        className="lr-ico"
        size={ICON_SIZE}
        strokeWidth={STROKE}
        aria-hidden="true"
      />
      <span className="lr-label">{label}</span>
      <span className="lr-trail">
        <ArrowUpRight
          size={TRAIL_SIZE}
          strokeWidth={STROKE}
          aria-hidden="true"
        />
      </span>
    </a>
  );
};

export interface ActionRowProps {
  label: string;
  icon: Icon;
  onClick: () => void;
}

/** A row that does something here. Chevron, not arrow. */
export const ActionRow: React.FC<ActionRowProps> = ({
  label,
  icon: Icon,
  onClick,
}) => (
  <button type="button" className="lr" onClick={onClick}>
    <Icon
      className="lr-ico"
      size={ICON_SIZE}
      strokeWidth={STROKE}
      aria-hidden="true"
    />
    <span className="lr-label">{label}</span>
    <span className="lr-trail">
      <ChevronRight size={TRAIL_SIZE} strokeWidth={STROKE} aria-hidden="true" />
    </span>
  </button>
);

export interface SettingRowProps {
  label: string;
  icon: Icon;
  /** The control itself, which carries its own accessible name. */
  children: React.ReactNode;
  className?: string;
}

/**
 * A row that holds a control rather than being one. The row is inert —
 * the control inside it takes the focus and the press, so this must not
 * be a button.
 */
export const SettingRow: React.FC<SettingRowProps> = ({
  label,
  icon: Icon,
  children,
  className = "",
}) => (
  <div className={`lr ${className}`.trim()}>
    <Icon
      className="lr-ico"
      size={ICON_SIZE}
      strokeWidth={STROKE}
      aria-hidden="true"
    />
    <span className="lr-label">{label}</span>
    <span className="lr-trail">{children}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Tiles                                                               */
/* ------------------------------------------------------------------ */

export interface TileProps {
  href: string;
  /** The service, not the handle. One word where possible. */
  label: string;
  icon: Icon;
  /** What is announced — the handle belongs here, not in the label. */
  ariaLabel: string;
}

/**
 * One row of links that differ only by which service they are. The grid
 * divides evenly by however many tiles are passed in, so the count is a
 * property of the call site rather than of the stylesheet. §5.7 allows an
 * icon to lead only where a label sits directly beneath it, which is the
 * arrangement the bottom navigation already uses.
 */
export const TileGroup: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="lr-tiles">{children}</div>;

export const Tile: React.FC<TileProps> = ({
  href,
  label,
  icon: Icon,
  ariaLabel,
}) => (
  <a
    className="lr-tile"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${ariaLabel} (opens in a new tab)`}
  >
    <Icon size={19} strokeWidth={STROKE} aria-hidden="true" />
    <span>{label}</span>
  </a>
);
