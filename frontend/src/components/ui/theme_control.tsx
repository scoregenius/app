// frontend/src/components/ui/theme_control.tsx
import React from "react";
import SegmentedControl from "@/components/ui/segmented_control";
import { useTheme, type Theme } from "@/contexts/theme_context";

/**
 * The appearance control. See docs/design_system.md §8.4.
 *
 * Replaces `ThemeToggle`, which was a single button reading "Dark Mode"
 * — and there was no way to tell from it whether that named the theme
 * you were in or the one you would get. It also carried no
 * `aria-pressed`, no `aria-label` and no `role`, so a screen-reader user
 * got an unlabelled button whose state they could not determine, on the
 * element the guided tour's last step points at.
 *
 * Two named values state the answer outright, and using the shared §6.3
 * control rather than a bespoke toggle brings `aria-pressed` on both
 * items, the 2px `--green-text` focus outline and the 44px `::before`
 * target with it. It also means this cannot drift away from the header's
 * sport switcher later, which is how defect 13 happened the first time.
 *
 * **Guided-tour contract.** `tourId` renders `data-tour="theme-toggle"`
 * on the track, which the tour's final step resolves by CSS selector and
 * which More must carry on both its online and its offline branch — see
 * §6.10. Moving the attribute into a prop is exactly the case that
 * section warns about: a `grep -rn "data-tour"` no longer finds the
 * literal here, so this comment is what the audit finds instead.
 */

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const satisfies ReadonlyArray<{ value: Theme; label: string }>;

export interface ThemeControlProps {
  className?: string;
}

const ThemeControl: React.FC<ThemeControlProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  return (
    <SegmentedControl
      label="Theme"
      options={OPTIONS}
      value={theme}
      onChange={setTheme}
      tourId="theme-toggle"
      className={className}
    />
  );
};

export default ThemeControl;
