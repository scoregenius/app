// frontend/src/components/layout/BottomTabBar.tsx

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Calendar as GamesIcon,
  BarChart2 as StatsIcon,
  HelpCircle as HelpIcon,
  MoreHorizontal as MoreIcon,
} from "lucide-react";
import clsx from "clsx";
import type { LucideProps } from "lucide-react";

type Tab = {
  path: string;
  label: string;
  Icon: React.ComponentType<LucideProps>;
  /** Guided-tour anchor. Targeted by selector in joyride_tour.tsx. */
  tour: string;
};

const TABS: Tab[] = [
  { path: "/games", label: "Games", Icon: GamesIcon, tour: "tab-games" },
  { path: "/stats", label: "Stats", Icon: StatsIcon, tour: "tab-stats" },
  {
    path: "/how-to-use",
    label: "How To Use",
    Icon: HelpIcon,
    tour: "tab-how-to-use",
  },
  { path: "/more", label: "More", Icon: MoreIcon, tour: "tab-more" },
];

/**
 * The bottom navigation — see docs/design_system.md §6.6.
 *
 * Active items use the green-text token rather than brand green. Brand
 * green is a fill colour, never type (§5.1): on the old white bar it
 * measured 2.85:1, which made the label telling you which screen you
 * were on the least legible text in the bar. green-text resolves per
 * theme and measures 5.37:1 on the light ground and 10.84:1 on the dark.
 *
 * Inactive items are ink-2, not the ink-3 §6.6 originally specified —
 * ink-3 measures 3.65:1 on ground, and these are 11px interactive
 * labels that need 4.5:1.
 */
const BottomTabBar: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className={clsx(
        // Fixed on mobile, static in the layout column at lg.
        "fixed lg:static inset-x-0 bottom-0 z-40 flex",
        "chrome-surface border-t border-line",
        // Without this the tabs sit under the iOS home indicator.
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      {TABS.map(({ path, label, Icon, tour }) => {
        const isActive = pathname.startsWith(path);

        return (
          <NavLink
            key={path}
            to={path}
            data-tour={tour}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 py-1.5",
              "text-[11px] font-medium transition-colors focus-ring",
              isActive
                ? "tabbar-item--on text-green-text"
                : "text-ink-2 hover:text-ink"
            )}
          >
            <span className="tabbar-slot">
              <Icon
                size={20}
                // Heavier on the active item, so weight carries the state
                // alongside the tint and the colour — §6.6.
                strokeWidth={isActive ? 2.2 : 1.8}
                aria-hidden="true"
              />
            </span>
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
