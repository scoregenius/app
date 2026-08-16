// frontend/src/components/offline_centered.tsx

/**
 * The offline pattern, in two shapes. See docs/design_system.md §6.9.
 *
 * `OfflineCentered` is for a screen that cannot render at all — Games and
 * Stats have nothing to show without the feed. `OfflineNotice` is the
 * inline card for a screen that can still render but has lost part of
 * itself, which is How to Use and More.
 *
 * Both closed defect 3. Every previous version of this notice — the one
 * below, plus hand-rolled copies in `how_to_use_screen` and
 * `more_screen` — set `text-white` on `--color-panel`. That token is
 * `#f8fafc` in light mode, so the heading measured **1.05:1** and was
 * invisible; the body beneath it, at `text-slate-400`, measured 2.45:1.
 * Five rendered surfaces carried it, since this component is drawn twice
 * by Games and once by Stats.
 *
 * §10 also applies to the copy. The old text promised "Live scores",
 * which §4.1 says the app does not have and never has, and led with an
 * apology. Both are gone: the notice states what still works.
 *
 * The filename is historical — it now houses both shapes. Renaming it
 * would touch four import sites in files being edited by other work, so
 * it is left for whoever next has that file open.
 */

import type { ReactNode } from "react";

interface OfflineNoticeProps {
  /** Sentence case. Names what is unavailable, not that something failed. */
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Inline notice. Sits at the top of a screen that still has something
 * worth showing beneath it.
 */
export function OfflineNotice({
  title = "Offline",
  children,
  className = "",
}: OfflineNoticeProps) {
  return (
    <div className={`ofl ${className}`} role="status" aria-live="polite">
      <h2 className="ofl-title">{title}</h2>
      <p className="ofl-body">{children}</p>
    </div>
  );
}

/**
 * Centred block. For a screen with nothing to render without the feed.
 */
export default function OfflineCentered() {
  return (
    <section className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="ofl ofl--centred" role="status" aria-live="polite">
        <h2 className="ofl-title">Offline</h2>
        <p className="ofl-body">
          Games and stats need a connection. This screen will pick up where you
          left off once you are back online.
        </p>
      </div>
    </section>
  );
}
