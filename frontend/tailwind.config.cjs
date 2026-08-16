// tailwind.config.cjs
const defaultTheme = require("tailwindcss/defaultTheme");
const forms = require("@tailwindcss/forms");
const typography = require("@tailwindcss/typography");
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./index.html",
    "./app.html",
    "./public/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Design-system tokens v1 — see docs/design_system.md §5.1.
         * Both themes are defined in index.css; these only expose them
         * to Tailwind. Prefer these over the legacy names below. */
        ground: "var(--ground)",
        panel: "var(--panel)",
        "panel-2": "var(--panel-2)",
        line: "var(--line)",
        "line-2": "var(--line-2)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "green-text": "var(--green-text)",
        "orange-text": "var(--orange-text)",

        /* Legacy. Still used by screens not yet migrated; retires in
         * stage 6. Do not add new usages. */
        "github-dark": "#0d1117",
        "brand-green": { DEFAULT: "#00B140", light: "#34d058" },
        "brand-orange": "#FF7F00",
        /* These two were hardcoded hexes — the *dark* values — so they did
         * not respond to the theme at all. Every bare `text-text-secondary`
         * rendered #9CA3AF on a white ground, which is 2.3:1. The `dark:`-
         * prefixed usages are unaffected: the variable resolves to the same
         * hex there. See defect 25, and 20 for one consequence already fixed. */
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "btn-snapshot": "var(--color-btn-snapshot, #00B140)", // Default to brand-green DEFAULT
        "badge-weather": "var(--color-badge-weather, #FF7F00)", // Default to brand-orange
        muted: "var(--color-text-secondary)",
        surface: "var(--color-panel)",
        "surface-hover": "var(--color-surface-hover)",
        "text-base": "var(--color-text-primary)",
        "text-muted": "var(--color-text-secondary)",
        "accent-neutral": "var(--color-accent-neutral)",
        "border-subtle": "var(--color-border-subtle)",
        "border-strong": "var(--color-border-strong)",
        "pred-badge": "var(--color-pred-badge)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        focus: "0 0 0 2px rgba(0,177,64,.4)", // accessible green ring
        /* "howto-glow" was here. Defect 16 fixed its registration - it
         * had been nested inside `colors` and never became a utility -
         * but that only made a bad value reachable. It was a hardcoded
         * rgba(148,163,184,.28) slate ring, off-palette by §5.1, and a
         * shadow where §5.5 uses surface and hairline. Nothing ever
         * consumed it, so it is gone rather than adopted. */
      },
      transitionDuration: {
        120: "120ms",
        160: "160ms",
      },
      screens: {
        "3xl": "1920px", // optional ultra-wide grid
      },
      fontFamily: {
        sans: ['"Source Sans 3"', ...defaultTheme.fontFamily.sans],
        serif: ['"PT Serif"', ...defaultTheme.fontFamily.serif],
        /* Every numeral and micro-label. Consolas is listed ahead of the
         * ui-monospace generic deliberately: with the generic first,
         * Chromium on Windows falls through to a proportional face and
         * silently renders figures in the wrong typeface. JetBrains Mono
         * is not self-hosted yet, so this resolves to a system face. */
        mono: [
          '"JetBrains Mono"',
          "Consolas",
          '"Cascadia Mono"',
          "ui-monospace",
          ...defaultTheme.fontFamily.mono,
        ],
      },
      container: { center: true, padding: "1rem" },
      borderRadius: {
        xl: "1rem",
        // Compact radius for mobile cards
        lg: "0.75rem",
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant, e }) {
      addVariant("dark", ({ modifySelectors, separator }) => {
        modifySelectors(
          ({ className }) => `.dark .${e(`dark${separator}${className}`)}`
        );
      });
      // ARIA state variants
      addVariant("aria-selected", '&[aria-selected="true"]');
      addVariant("aria-expanded", '&[aria-expanded="true"]');
      addVariant("aria-current", '&[aria-current="true"]');
    }),
    forms,
    typography,
    /** ---- Day-Picker reset --------------------------------------- **/
    function ({ addUtilities }) {
      addUtilities({
        /* remove outer margin + let it stretch */
        ".calendar-reset .rdp": {
          margin: "0 !important",
          width: "100% !important",
          maxWidth: "none !important",
          display: "block !important",
        },
        /* stop centering & kill 16px gap */
        ".calendar-reset .rdp-months": {
          display: "block !important",
          justifyContent: "flex-start !important",
          gap: "0 !important",
        },
        /* kill 16px margin on the month card */
        ".calendar-reset .rdp-month": {
          margin: "0 !important",
          padding: "0 !important",
          width: "100% !important",
        },
        ".calendar-reset .rdp-month_grid": {
          width: "100% !important",
          tableLayout: "fixed !important",
        },
        /* turn the caption row into a 3-col grid */
        ".calendar-reset .rdp-month_caption": {
          paddingLeft: "0.75rem !important",
          paddingTop: "0.75rem !important",
        },

        /* keep the label flush left inside its column */
        ".calendar-reset .rdp-month_caption > .rdp-caption_label, \
 .calendar-reset .rdp-month_caption span": {
          justifySelf: "start !important",
        },
      });
    },
  ],
};
