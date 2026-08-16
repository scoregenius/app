# ScoreGenius Design System

**Version:** 1.7
**Status:** Foundations, the Games screen, the shared chrome, How to Use, the guided tour, the three
Games modals, the Stats screen and More are **built and live**. Game detail has direction but is not
yet specified.
**Approved:** 2026-08-13 · **Games screen shipped:** 2026-08-14 · **Chrome shipped:** 2026-08-14 ·
**How to Use and tour shipped:** 2026-08-14 · **Modals shipped:** 2026-08-14 ·
**Stats shipped:** 2026-08-15 · **More shipped:** 2026-08-15
**Scope:** the app interior served at `/app` from `frontend/src`. The marketing pages and the brand
layer (icon, splash, wordmark) are governed separately.

This is the reference for the app-wide redesign.

The foundations in §5, the Games screen in §8.1 and the chrome in §6.3 and §6.6 are implemented —
the tokens, the card, its states and fallbacks, the segmented control and the navigation all
describe running code, so where this document and those disagree, **that is a bug in one of them**.
For the screens still on the old styling, this document is the target and wins.

---

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Strategy](#2-strategy)
3. [Principles](#3-principles)
4. [What the app actually knows](#4-what-the-app-actually-knows)
5. [Foundations](#5-foundations)
6. [Components](#6-components)
7. [Patterns](#7-patterns)
8. [Screens](#8-screens)
9. [Accessibility](#9-accessibility)
10. [Content and voice](#10-content-and-voice)
11. [Defect register](#11-defect-register)
12. [Implementation plan](#12-implementation-plan)
13. [Decisions](#13-decisions)

---

## 1. How to use this document

**Refreshing a screen:** follow `screen_refresh_sop.md` — the procedure
derived from the Games refresh, including the sequencing that keeps the risky commit revertable and
the environment traps that will otherwise cost you an afternoon.

**Designing a new screen:** read §2–§4 for the stance, then build from §6 components and §7
patterns. If you need something §6 does not have, add it to §6 rather than styling it locally.

**Changing an existing screen:** check §11 first — the screen may already have a known defect that
your change should absorb.

**Settling an argument:** §3 decides most of them. If it doesn't, the tiebreaker is whichever option
better serves a user scanning fifteen items at arm's length.

**The one rule that is not negotiable:** every change ships in both themes. See §5.1.

---

## 2. Strategy

### 2.1 What this product is

ScoreGenius predicts game outcomes and compares those predictions against betting markets. The
interface exists to answer one question fast: **which of today's games are worth a closer look?**

Everything follows from that. A user opens the app, sees twelve to fifteen games, and should be able
to flick through and stop at the two or three that matter — without reading every number on every
card.

### 2.2 Who it is for

A sports fan who follows odds. Numerate, but not sitting at a desk with a spreadsheet. On a phone,
often briefly, often with the TV on. They know what a moneyline is; they do not want to do
arithmetic to learn which team the model prefers.

### 2.3 The look we are aiming at

**Instrumentation, not decoration.** A dark, high-contrast data product that looks like it is
reporting measurements. The reference points are trading terminals and telemetry dashboards, not
sports-media sites with team colours and photography.

Three specific consequences:

- **Dark is the native theme.** The brand mark sits on `#0d1117`; the app's dark ground is the same
  family. Light mode is a first-class derivative, not an afterthought — but the design is authored
  dark-first.
- **Monospace numerals everywhere.** This single decision does more than any other to make the app
  read as instrumentation. See §5.2.
- **Colour is signal, never decoration.** Green marks the model's output and the app's own chrome.
  Orange means live. Nothing is coloured to be pretty.

### 2.4 What the redesign is not

Not a rebrand — the mark and palette are fixed. Not a feature project — no new data, no new screens,
no routing changes. Not a rewrite — components are restyled and restructured in place.

---

## 3. Principles

Six rules that settle most questions without needing a ruling.

1. **The model's output is the loudest thing on screen.** Predicted scores outrank team names, which
   outrank market data. If a change makes the prediction quieter, it is wrong.

2. **Rarity earns emphasis.** A high edge appears on two cards in fifteen, so it gets colour, a glow
   and a rail. Team names appear on all fifteen, so they get none of those. *Corollary:* an
   indicator that appears on 100% of items and always says the same thing should not exist — this is
   why NBA loses the "Indoor" chip.

3. **Absence is silent.** Missing data shortens the layout; it never prints `N/A`, `--`, or an empty
   row. Fifteen cards of placeholders read as broken software; fifteen cards showing only what is
   known read as an honest one.

4. **Numbers are monospace, words are not.** Every figure — scores, odds, times, percentages,
   micro-labels — is tabular and monospaced so columns align down a long list.

5. **Never imply precision the data does not have.** If the app cannot measure it, the app does not
   display it. See §4.

6. **Both themes ship together.** A token defined in only one theme is a defect, not an omission.
   Three such defects were in production when this was written; all are fixed (§11).

---

## 4. What the app actually knows

Documented because the code implies otherwise, and has already misled a reader on this project.

### 4.1 A game has three states

Scheduled → in progress → final. **"In progress" is inferred client-side** from the start time plus
3.5 hours (`GAME_STALE_MS` in `game_card.tsx`), not reported by any feed.

There is **no live score, inning, quarter, clock, possession or drive data**, and none is planned.
Any design showing live game detail is designing for data that does not exist.

The one artefact of this: raw status codes such as `(IN9)` and `(FT)` used to leak into the time
line on final cards. They are now suppressed once a game is final — the rail states the game's state
instead.

### 4.2 Model probabilities are not displayed

`computeBestEdge` in `frontend/src/utils/edge.ts` derives `modelProb`, `marketProb`, `edgePct` and
`z` by pushing the predicted margin through a normal CDF with a hand-tuned per-sport sigma (MLB 3.8
runs, NFL 13.0, NBA 12.0 points).

These are **tiering heuristics, not calibrated probabilities.** They exist to rank and tier the
edge internally. They are never rendered, and no figure derived from them — percentage, confidence,
z-score — appears anywhere in the interface.

This held only in intent until 2026-08-14: `value_badge.tsx` exposed all four in a `title` tooltip
on hover. That component has been deleted, so the figures now appear nowhere in the interface.

### 4.3 Team abbreviations do not come from the API

The API returns full team names only; `UnifiedGame` has no abbreviation field. The backend has
partial, opportunistic abbreviation handling for NFL inside `backend/nfl_features/map.py`, which
never reaches the client.

Abbreviation chips therefore rest on a hand-maintained constant,
`frontend/src/utils/team_abbr.ts` — 92 clubs across the three leagues, plus one alias for the
relocated Athletics. Lookup is normalised on punctuation and casing, because the schedule feed
renders `St.Louis Cardinals` while the stadium file has `St. Louis Cardinals`; exact matching would
have missed silently. Unknown sides fall back to derived initials so the row keeps its anchor.

### 4.4 Venue indoor status

`backend/data/stadium_data.json` carries `is_indoor` on **all 32 NFL venues** (11 indoor) and, since
2026-08-14, on **all 31 MLB entries** (8 indoor). Before that the MLB flag was absent entirely and
the covered ballparks reported the weather outside.

A second copy of this lives in `frontend/src/utils/venues.ts` so covered venues can skip the weather
request rather than fetching and discarding the answer. **The two must be edited together.** Where
they disagree the response wins at render time, so a venue missing from the front-end set costs a
round-trip and never displays the wrong thing.

---

## 5. Foundations

### 5.1 Colour

Brand green and orange are fixed. What the system adds is a *lifted* green for text on dark ground
and a *deep* green for text on light — brand green at body sizes fails AA on a light ground.

All ratios below were measured, not estimated, and two of them corrected values this document
previously asserted. **Brand green on the dark panel measures 6.02:1 and passes on its own**, so the
lifted green is a legibility choice at small sizes rather than an accessibility requirement. On the
light panel it measures 2.85:1 and genuinely fails, which is what `green-text` exists for.

#### Palette

| Token | Dark | Light | Role |
|---|---|---|---|
| `brand-green` | `#00B140` | `#00B140` | Fills, rails, active states, progress |
| `green-lift` | `#3ADE72` | — | Green **text** and icons on dark ground |
| `green-deep` | — | `#00762C` | Green **text** and icons on light ground |
| `brand-orange` | `#FF7F00` | `#FF7F00` | **Live state only** |
| `orange-text` | `#FF9E3D` | `#B25600` | Orange text, contrast-corrected |
| `ground` | `#0B1016` | `#F4F7F6` | App background |
| `panel` | `#151C24` | `#FFFFFF` | Card and surface background |
| `panel-2` | `#1B232C` | `#F7FAF9` | Nested surface, table header, skeleton base |
| `panel-hover` | `#1E2833` | `#EEF3F1` | Row hover on a panel surface |
| `line` | `#232E38` | `#DFE7E3` | Hairline dividers, card borders |
| `line-2` | `#2E3B47` | `#C6D2CC` | Chip, input and control borders |
| `ink` | `#EAF0F4` | `#0D1117` | Primary text, scores, headings |
| `ink-2` | `#8FA0AE` | `#56655D` | Secondary text, market data, labels |
| `ink-3` | `#5E6E7C` | `#84948B` | Micro-labels, timestamps, de-emphasis |
| `accent-fill` | `#00B140` | `#00762C` | Fill of a **selected control** — segmented item, primary button |
| `accent-fill-ink` | `#07130B` | `#FFFFFF` | The only text colour permitted on `accent-fill` |

`accent-fill` is the one green that differs between themes, and it exists because the fills above do
not. White on brand green measures 2.85:1, so light mode fills with the deepened green and carries
white at 5.79:1, while dark mode keeps the brand hue under near-black ink at 6.65:1. Reach for it
whenever a control is *selected*; reach for `brand-green` when something is merely *tinted*.

#### Measured contrast

Against `panel`, which is the surface almost all text sits on. Re-measure whenever a token changes.

| Pairing | Dark | Light | Required |
|---|---|---|---|
| `ink` | 14.93:1 | 18.92:1 | 4.5 |
| `ink-2` | 6.38:1 | 6.15:1 | 4.5 |
| `ink-3` — micro-labels only, 700 weight uppercase | 3.27:1 | 3.19:1 | 3 |
| `green-lift` / `green-deep` | 9.70:1 | 5.79:1 | 4.5 |
| `orange-text` | 8.35:1 | 4.97:1 | 4.5 |
| **`brand-green` used as text** | 6.02:1 | **2.85:1 — fails** | 4.5 |

Two consequences worth stating plainly:

- **Brand green is a fill colour, not a text colour.** It passes on the dark panel but fails badly on
  light, so a single rule — never type — is safer than a per-theme exception.
- `orange-text` on light is `#B25600` rather than a lighter orange because it must also clear 4.5:1
  against `ground` (#F4F7F6), where it measures 4.61:1. `#C25E00` and `#B85A00` both fail one of the
  two surfaces.

#### Rules

- **Neutrals carry a slight blue-green bias** so they sit with the brand mark rather than beside it.
  Do not substitute Tailwind's stock `slate`, `gray` or `zinc` ramps. Mixing those ramps with the
  tokens is the single largest source of the current inconsistency.
- **Orange is reserved for the live state.** Not a second accent, not a warning colour, not
  decoration. If something needs to look urgent and it is not a live game, it is probably not
  urgent.
- **Green has two jobs:** the model's output (prediction badge, edge, lean bar) and the app's own
  active chrome (selected tab, active nav item). Nothing else is green.
- **No colour may be defined in only one theme.** Every token above has a value in both columns, or
  is explicitly theme-scoped with a documented reason.
- **Never hardcode a hex in a component.** If you need a colour that is not in this table, the table
  is missing something — add it here first.

#### Semantic colour

The system deliberately has no red/amber/green "status" ramp. Nothing in this product is an error
state a user can act on. The two semantic signals are the edge tier (green, three intensities) and
live (orange). Genuine failures — offline, request failed — are handled by absence and by the
offline pattern (§6.9), not by colour.

### 5.2 Typography

Two faces doing two clearly separated jobs.

| Role | Face | Fallback stack |
|---|---|---|
| Names, UI, headings, prose | **Archivo** | Inter Tight, system-ui, -apple-system, "Segoe UI", sans-serif |
| **All numerals and micro-labels** | **JetBrains Mono** | IBM Plex Mono, ui-monospace, "SF Mono", Consolas, monospace |

Archivo is a grotesque, slightly condensed, strong at heavy weights — it replaces Source Sans 3.
PT Serif remains available but is unused in the app interior; a serif has no job in a scoreboard.

**Self-host both.** Do not add a third-party font request.

#### The monospace rule

Monospace is not a stylistic flourish here, it is a functional requirement. Anything that is a
number, or labels a number, is set in the mono face with `font-variant-numeric: tabular-nums`:

- Scores, predicted and final
- Odds, spreads, totals
- Times, dates, durations
- Percentages and statistics on the Stats screen
- Uppercase micro-labels (`AWAY`, `HOME`, `FINAL`, `LIVE`, `MODEL`)
- Table numeric columns

Words — team names, player names, headings, body copy, button labels — stay in Archivo.

#### Scale

| Element | Size | Weight | Tracking | Face |
|---|---|---|---|---|
| Screen heading | 20px | 700 | −0.02em | Archivo |
| Section heading | 15px | 650 | −0.015em | Archivo |
| Team / player name | 15px | 600 | −0.012em | Archivo |
| Body copy | 14px | 400 | 0 | Archivo |
| Predicted / final score | 21px | 700 | −0.03em | Mono |
| Table cell, numeric | 13px | 500 | 0 | Mono |
| Table cell, text | 13px | 400 | 0 | Archivo |
| Market strip | 11.5px | 400 | +0.01em | Mono |
| Chip label | 12px | 600 | 0 | Archivo |
| Edge chip | 10px | 700 | +0.12em, uppercase | Mono |
| Time | 11px | 400 | +0.07em, uppercase | Mono |
| State label (LIVE / FINAL) | 10px | 700 | +0.16em, uppercase | Mono |
| Column / micro-label | 9.5px | 700 | +0.10em, uppercase | Mono |

Body prose sits at 14px with a max measure of about 65 characters. Headings take
`text-wrap: balance`.

### 5.3 Spacing and layout

A 4px base scale. Use these steps only: **2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40**.

| Context | Value |
|---|---|
| Screen horizontal padding, mobile | 12px |
| Screen horizontal padding, desktop | 24px |
| Gap between cards in a list | 10px |
| Card internal padding | 11px 13px 10px |
| Gap between chips | 7px |
| Gap between a label and its value | 2px |
| Section separation within a card | 10px + hairline |
| Section separation on a screen | 24px |

**Density is deliberate.** The Games list is tight because its job is scanning. Prose screens (How
to Use) breathe more. When in doubt on a list, tighten; on a document, loosen.

**Grid.** Games uses one column on mobile, two at `md`, three at `xl`. Stats tables are full-bleed
within the screen padding and scroll horizontally in their own container. The page body never
scrolls sideways.

### 5.4 Geometry

| Element | Radius |
|---|---|
| Card | 14px |
| Modal, table wrapper | 14px |
| Chip, button, input | 8px |
| Pill, segmented control, badge | 999px |
| Abbreviation chip, edge chip | 5px |

Borders are 1px, `line` for surfaces and `line-2` for controls. The high-edge card rail is 3px.

### 5.5 Elevation

The system uses **surface and hairline** rather than shadow to express depth. On dark ground a
shadow is nearly invisible; a 1px top highlight reads better:

- **Card:** `panel` background, 1px `line` border, plus on dark a 1px inset top highlight at
  `rgba(255,255,255,.07)` fading at both ends.
- **Card, high edge:** border tinted green, 3px green left rail, faint radial wash from top-left.
- **Modal and popover:** `panel` background, 1px `line`, and a real drop shadow — these float above
  the page and need to say so.
- **Sticky bars (header, filters, bottom nav):** `ground` background with `backdrop-filter: blur(8px)`
  and a 1px bottom (or top) `line`. No shadow.

In light mode cards additionally take a soft `0 1px 2px rgba(0,0,0,.05)`.

### 5.6 Motion

Motion confirms a change; it never announces one.

| Interaction | Duration | Easing |
|---|---|---|
| Hover, surface and colour change | 160ms | ease |
| Chevron rotation, expand | 200ms | ease |
| Card expand/collapse height | 200ms | ease-out |
| Tab and toggle transition | 160ms | ease |
| Skeleton shimmer | 1400ms | ease-in-out, infinite |
| Live pulse | 1700ms | ease-in-out, infinite |

**Every animation must respect `prefers-reduced-motion: reduce`.** The live pulse and the skeleton
shimmer both stop; the dot stays visible at full opacity. **Honoured globally** since stage 1 — a
`*, *::before, *::after` rule in `index.css` collapses every animation and transition, so components
do not each need their own block and should not add one.

> The **bottom bar hide/show** entry was removed from this table in 1.2. The behaviour it described
> had never run, and the bar no longer transforms at all — see §6.6 and defect 21.

No entrance animations on list items. Fifteen cards staggering in is a novelty the second time and
an obstacle the twentieth.

### 5.7 Iconography

**lucide-react**, already installed. 1.8px stroke, sized 13px in chips, 16px in controls, 20px in
the bottom navigation.

Icons support a label; they rarely replace one. The exceptions are the chevron and the bottom
navigation, where the label sits directly beneath. **No emoji as interface elements** — the current
`🏟️` and `🚫` are replaced by lucide glyphs, which inherit `currentColor` and theme correctly.

---

## 6. Components

The shared vocabulary. Build screens from these; if something is missing, add it here.

### 6.1 Card

The primary container. `panel` background, 14px radius, 1px `line` border, top highlight on dark.

**Variants:** default · high-edge (green rail + wash) · live (orange rail) · done (68% opacity,
score held at full contrast).

**Behaviour:** on mobile the whole card is a toggle for its expanded state, except for elements
marked `data-action`. On desktop cards are expanded by default.

Full anatomy for the game card is in §8.1.

### 6.2 Chips

One component, three uses.

| Use | Appearance | Interactive |
|---|---|---|
| **Action chip** (H2H Stats, Injuries, weather) | 32px min height, 8px radius, `line-2` border, `ink-2` label, icon 13px | Yes — opens a modal |
| **Edge chip** | 5px radius, mono, uppercase, tier-coloured | No |
| **State chip** (LIVE, FINAL) | No border, mono, uppercase, tracked | No |

Action chips lay out in a horizontal wrapping row at the foot of an expanded card, never in a
vertical column. Non-interactive chips must not use hover or active styling.

### 6.3 Segmented control

**Built** — `components/ui/segmented_control.tsx`, styled by the `sc-` block in `index.css`. Adopted
by the header. Available to the Stats sub-tabs and season selector, which are still hand-rolled until
stage 5.

- Track: `panel` background, 1px `line`, 999px radius, 3px padding
- Item: 999px radius, mono 10.5px 700, tracked `0.085em`, uppercased by the stylesheet so callers
  pass natural-case labels
- Item, unselected: `ink-2` label, transparent background
- Item, selected: `accent-fill` with `accent-fill-ink` — one token pair, no per-theme branching in
  the component
- Item, hover: `ink` label, no background change
- Focus: 2px `green-text` **outline** at 2px offset — never `outline: none` without a replacement. An
  outline follows the 999px radius; a `box-shadow` ring or the OS default draws through the corners
- Touch target: the visible pill stays compact, and a 44px `::before` extends the target vertically
  into the bar's own padding without inflating the header

> **Amended 2026-08-14.** This section first specified `ink-3` for the unselected label. Measured,
> that is **3.27:1** on `panel` — and these are interactive labels at 10.5px, far below the
> large-text threshold, so they need 4.5:1. Unselected is now `ink-2` (**6.38:1** dark, **6.15:1**
> light) hovering to `ink`. `ink-3` keeps the role §5.1 gives it: non-interactive micro-labels.

**Semantics.** Plain buttons with `aria-pressed`, not `role="tab"` or `role="radio"`. Each item is
its own tab stop, so the control is keyboard-operable with no roving `tabindex` and no arrow-key
handler. The views these switch between are not marked up as tabpanels, so tab semantics would
promise a relationship the DOM does not have. Arrow-key traversal is a reasonable future addition;
it is not required for the control to be operable.

### 6.4 Buttons and inputs

| Type | Appearance |
|---|---|
| **Primary** | `brand-green` fill (dark) / `green-deep` (light), 8px radius, 38px min height, 13px 700 label |
| **Secondary** | Transparent, 1px `line-2`, `ink-2` label |
| **Ghost** | No border, `ink-2` label, background tint on hover |
| **Input** | `panel` background, 1px `line-2`, 8px radius, 38px min height, 14px text; focus swaps the border to `brand-green` and adds a 1px ring |

Every interactive element gets a visible focus state and a minimum 44px touch target (padding may
extend beyond the visible bounds to reach it).

### 6.5 Data table

The Stats screen's core component, prefixed `st-`. One configured `DataTable` renders all five
datasets; §8.2 specifies how the screen uses it.

- Wrapper: 14px radius, 1px `line`, `overflow: auto` with a `max-height`
- Header: `panel-2` background, sticky at `top: 0`, mono 9.5px 700 uppercase tracked **`ink-2`**,
  1px `line` bottom border. `ink-3` was specified here first and measured 3.03:1 on `panel-2` in
  light mode — a column header names the data rather than decorating it, so it takes the 4.5:1 a
  micro-label is excused from. This is the same correction §6.3 already made for the segmented
  control's unselected labels
- Row: 1px `line` bottom border, no zebra striping; hover tints the row background
- Cell padding: 8px 12px
- **Numeric cells:** mono, tabular, **right-aligned**, `width: 1%`. Text cells left-aligned and
  elastic
- Sortable header: a **button filling the cell**, so the whole cell is the target *and* it is
  keyboard-operable. 10px caret in `ink-3`; the active column's caret is `green-text` and its label
  goes `ink`
- `aria-sort` on the `<th>`, not on the button

**First column pins** where horizontal scrolling is likely, so the player or team name stays
visible.

**The wrapper must be a real scroll port in both axes.** A sticky `thead` needs a scrolling
ancestor. `overflow-x: auto` alone computes `overflow-y` to `auto` but leaves the box unconstrained,
so it never scrolls vertically and the sticky rule is inert — which is how the header sat sticky and
unstuck on this screen for its whole life (defect 52). The `max-height` is what makes it work.

**Sorting must be reachable from the keyboard.** An `onClick` on a bare `<th>` is not: the cell is
not focusable and has no key handler. A correct `aria-sort` describes a control the keyboard cannot
operate, which is worse than no affordance at all because it announces one (defect 53).

### 6.6 Navigation

**Built** — all three bars share one surface rule, `.chrome-surface` in `index.css`, so they cannot
drift apart again. Ground with `backdrop-filter: blur(8px)` and a single 1px `line` hairline. **No
shadow** (§5.5). The blur's alpha comes from a `color-mix` guarded by `@supports`; an older WebView
falls back to opaque ground, losing the blur but keeping the colour.

**Header.** Sticky, `ground`, 1px `line` bottom, 12px/24px horizontal padding per §5.3. Contains the
wordmark (links to Games, with an `aria-label` and a focus ring) and the sport segmented control. It
takes **no props** and carries no date control — the date belongs to the Games screen, which owns
what the API is asked for.

**Filters bar.** A second sticky row below the header carrying the screen heading and any screen-level
control. Shares `.chrome-surface`. It was previously on `panel`, which made it read as a card
spanning the screen rather than as chrome.

**Bottom navigation.** Four items, fixed on mobile and static at `lg`. Shares `.chrome-surface` with a
1px `line` top and `env(safe-area-inset-bottom)` padding. Active item is `green-text` for both icon
and label; inactive is `ink-2`, hovering to `ink`. Icons 20px above an 11px label.

**The active item carries a shape, not only a hue.** The icon sits in a 46×26px 999px slot which, when
active, fills with `brand-green` at 14% — and the active icon's stroke goes 1.8 → 2.2. Three signals:
tint, weight, colour.

- The pill sits behind the **icon only**, never icon-plus-label. Wrapping both needs about 76px, and
  "How To Use" is roughly 62px of text at 11px, so the pill would clip the label or push the bar past
  what a 320px viewport allows — the constraint behind defect 23.
- A **top rail was rejected**, and only rendering it showed why: a 2px rail lands on the bar's own 1px
  hairline and reads as a break in the border rather than an indicator, and it fights the header's
  hairline directly above.
- Filled-versus-outline icons would read faster still, but lucide ships no filled variants for these
  four, so it would mean hand-authoring them. Not worth it when the pill and the stroke weight are
  already two signals beyond hue.

Measured on the running app. Note the label and the icon sit on **different** surfaces, and different
thresholds apply to each:

| Active item | Sits on | Measured | Required |
|---|---|---|---|
| Label, dark / light | `ground` | 10.78 / **5.44** | 4.5 — text |
| Icon, dark / light | the tint | 9.04 / **4.66** | 3.0 — graphical object, WCAG 1.4.11 |

The icon's 4.66 in light is the lowest number in the chrome, but the threshold that actually applies
to an icon is 3:1, so the headroom is 1.66 rather than 0.16 — and it clears the stricter text
threshold anyway. Re-measure if the tint percentage or `ground` changes. Dropping the tint to 10%
would read 4.95 if more margin is ever wanted, at the cost of a fainter pill.

The pill adds ~3px of bar height (55px → 58px) and does not overflow a 320px viewport: items are 80px
each against a 46px slot, and every label stays on one line.

> **Why a shape at all.** Hue alone puts the whole burden of "which screen am I on" on one colour, which
> is the least reliable channel — it is the first thing lost to a colour-vision deficiency, a dimmed
> screen or sunlight. §7.4 already requires state to be encoded in form as well as colour; the nav was
> the last place in the chrome still ignoring it.

> **Amended 2026-08-14, twice.**
>
> **Inactive is `ink-2`, not `ink-3`.** `ink-3` measures **3.65:1** on `ground`; these are 11px
> interactive labels needing 4.5:1. `ink-2` gives **7.05:1** dark and **5.70:1** light. This inverts
> the hover direction previously described here.
>
> **Hide-on-scroll is removed, not preserved.** This section used to require it. It had never worked:
> the listener subscribed to `scroll` on `window`, but `App.tsx` wraps the app in an `h-screen` flex
> container with `main` at `overflow-auto`, so the document cannot scroll — the real scroller is a
> `section` inside `main`. Measured at 375×812 with 14 cards loaded, `documentElement` reported
> `812/812` while the inner section reported `2211/656`; scrolling the real scroller 1200px left
> `window.scrollY` at `0` and fired zero events. The dead state, ref and listener are gone, which
> also makes the "must not hide while a modal is open" clause vacuous. **Reinstating it against the
> real scroller would be a new feature** and should be decided as one — along with the modal guard,
> which would then genuinely be needed.

### 6.7 Modal

**Built** — `components/ui/modal.tsx` over the `sgm-` block. One shell used by the snapshot, weather
and injury modals, which were previously three separate implementations agreeing on almost nothing:
three panel surfaces, three radii, three backdrop opacities, and three close targets, none of which
reached 44px.

`panel` background, 14px radius, 1px `line`, real drop shadow, backdrop at `rgba(0,0,0,.55)` with a
2px blur. Title 15px 650, with an optional mono micro-label beneath it. Close control is a 44px
target in the top-right. Focus is trapped, Escape closes, a backdrop press closes, the body scroll
locks, and focus returns to the element that opened it.

Content max width 420px on mobile, 520px on desktop. The header is fixed and the body scrolls, so a
long snapshot cannot scroll its own title out of view. Height is capped in `dvh` so the panel is not
clipped behind mobile browser chrome.

Six things about the implementation are load-bearing:

| Decision | Why |
|---|---|
| **No `isOpen` prop** — mounted means open, callers write `{open && <Modal …>}` | All three previously took `isOpen` and returned `null`, so each was mounted on every card at all times. Each is also a `lazy()` import, and React must fetch a module before it can call it — so all three chunks loaded on every Games render. Gating the element restores the split and lets the modal unmount |
| **Portal to `document.body`** | Non-negotiable, not a preference — see the injuries case in §11, defect 34 |
| **Escape and Tab on `document`**, not on the backdrop element | Clicking a non-focusable run of text inside the panel moves focus to `<body>`, outside the backdrop, so an element handler stops receiving keys exactly when someone has been reading. The trap also pulls focus back when it finds it outside |
| **A real 44px close box**, not a small one padded by `::after` | `.sgm` sets `overflow: hidden` to clip the panel corners, which cuts off a pseudo-element extending past the header's padding. The `.gc-chev` approach measured 43×43 here with the right edge dead |
| **Counted scroll lock** | A boolean leaves the page permanently locked under React's StrictMode double-invoked effects |
| **No `className` escape hatch** | Component blocks are emitted after the utilities layer, so at equal specificity a class here beats a utility passed at the call site — the mechanism behind defects 24 and 26. Variants are modifier props |

`z-index` is 60: the header and bottom navigation are 40 and the date popover is 50.

The trigger chips are §6.2 action chips, all three on `.gc-chip` since defect 31 closed.

### 6.8 Skeleton

Skeletons **mirror the anatomy of the thing that is loading**, so nothing reflows when data lands. A
game card skeleton has a rail, two team rows and a footer; a table skeleton has rows at the real row
height.

Base `panel-2`, shimmer sweeping to a 6% lighter stop over 1400ms, 5px radius. Stops entirely under
`prefers-reduced-motion`.

Never show a spinner. Never show the word "Loading".

### 6.9 Empty, offline and error states

**Empty** — centred, and always offers the next action:

- 46px icon in a 12px-radius `line-2` box, `ink-3`
- Title 15px 700 `ink`
- One line of explanation, 13px `ink-2`, stating a fact rather than apologising
- A primary button when a next step genuinely exists (switching to a sport that has games today)

**Offline** — **built.** `offline_centered.tsx` holds two shapes over one `ofl-` block:

| Export | Shape | For |
|---|---|---|
| `OfflineCentered` (default) | Centred, 380px max, centred text | A screen with nothing to render without the feed — Games, Stats |
| `OfflineNotice` (named) | Inline card, full width | A screen that still has something to show beneath it — How to Use, More |

Title `ink` 15px 650, body `ink-2` 13.5px, `panel` ground, 14px radius, 1px `line`. Both carry
`role="status"` and `aria-live="polite"`.

The copy explains what still works rather than only what does not, and never apologises. It also may
not promise data the app lacks: the previous version offered "Live scores", which §4.1 rules out.

**Error** — the app has no user-actionable errors. A failed request is treated as absent data (§3,
principle 3) or, where the whole screen depends on it, falls back to the offline state.

### 6.10 Guided tour

**Built** — `joyride_tour.tsx` over react-joyride, with `custom_joyride_tooltip.tsx` styled by the
`jrt-` block. Nine steps across three screens, filtered per sport.

The tooltip is `panel`, 14px radius, 1px `line`, the same shadow pair as the modal (§6.7), with §6.4
buttons: ghost Skip, secondary Back, primary Next. It deliberately does **not** reuse the `sgm-`
block — a tooltip is not a dialog, Joyride owns its positioning, and a focus trap would fight the
tour. A step counter and dots read from Joyride's own `size`, so they report the *filtered* length
rather than the nine in the base array.

#### The anchor contract

**Steps resolve their targets by CSS selector and fail silently when one is missing** — the step
renders against nothing. These attributes are therefore a contract, not an implementation detail.
Any screen refresh that touches these elements must carry the attribute across.

| Anchor | Owner |
|---|---|
| `sport-switch` | `segmented_control.tsx`, via its `tourId` prop |
| `game-card` | `game_card.tsx` |
| `snapshot-button` | `snapshot_button.tsx` — inside the expanded card only |
| `weather-badge` | `game_card.tsx` — absent on NBA and on request failure; the step is filtered out to match |
| `tab-stats`, `tab-more` | `BottomTabBar.tsx` |
| **`stats-subtab-advanced`** | **`stats_screen.tsx` — stage 5 must preserve** |
| **`stats-column-winpct`** | **`stats_screen.tsx` — stage 5 must preserve.** Placed from `WIN_PCT_KEYS`, because the teams tab renders two header sets that spell the column differently (`wins_all_percentage` for MLB and NBA, `winPct` for NFL) |
| `theme-toggle` | `more_screen.tsx`, on both the online and offline branches |

> **If you extract a component that carries an anchor, check `grep -rn "data-tour"` still finds it.**
> Moving the sport switcher into a shared component turned the literal into a prop and the audit
> silently stopped covering it; a comment at the call site restores it.

#### The tour owns backward routing; the reader owns forward routing

**Settled 2026-08-15, closing defect 50.** The asymmetry is deliberate and it follows from what each
direction is for.

Forwards, the reader navigates. Two steps say "Open the Stats tab, then press Next" and "Open the
More tab, then press Next", and making the reader find the tab is the entire lesson of those steps.
The tour waits for the next anchor (`nextStepTarget`) but never moves the reader itself.

Backwards there is no lesson. Retracing is mechanics, and asking a reader to work out for themselves
which screen a step used to live on is a puzzle rather than a guide. So **Back routes**: it goes to
the screen that owns the previous step's anchor, waits for that anchor exactly as advancing does,
and only then commits the index.

The tour already owned routing once — both launch points navigate to Games before starting, because
the card step has no target anywhere else — so this extends an existing responsibility rather than
inventing one. The alternative considered and rejected was a Back that waits and then does nothing
when its anchor never arrives: that trades a wrong move for a dead control, at exactly the two
points a reader is most likely to press it.

**A backward hop that cannot reach its anchor does not move at all.** This is the one place the two
directions must differ again. Forwards, committing anyway and letting `TARGET_NOT_FOUND` skip on is
progress. Backwards, each skip lands on another earlier step which is just as likely to be missing,
so a single Back press walks the reader down the array — measured at five steps to one, before it
was fixed. Refusing leaves the reader on a step that works.

Three rules make it hold together:

- **`STEP_ROUTES` is a contract, like the anchors.** It names the screen that owns each step's
  anchor. Only six of the nine appear: the sport switcher and the two bottom-nav items are chrome,
  on every screen, which is why Back was fine across most of the tour and broke at two boundaries.
  Move a step's anchor to another screen and it must be re-listed, or Back routes to the wrong one.
  `tour_steps.test.mjs` checks every route against the ones `App.tsx` defines.
- **`TARGET_NOT_FOUND` skips in the direction of travel.** It used to increment unconditionally,
  which is the half of defect 50 that did the damage: a Back onto an unmounted anchor was not
  refused, it was reversed. Backwards it stops at the first step rather than ending the tour —
  running off the end of a tour is a finish, running off the start is not a place.
- **A hop names the step it is moving to** (`pendingStepId`), so a screen can prepare before the
  anchor is asked for. The game card opens itself for the three steps whose targets only exist
  inside an expanded card; without the pending name, moving *back* into one deadlocks, because the
  anchor cannot appear until the index moves and the index must not move until the anchor appears.

A routed hop waits six seconds rather than three. It has a screen to mount and usually a fetch to
finish, where a forward hop is already on the screen it needs.

#### The array may only change ahead of the reader

The rule below about steps appearing and disappearing was, until 2026-08-15, a description of a
hazard rather than something enforced — and the hazard was firing on every single run.

The weather chip is a Games element. The moment the reader follows "Open the Stats tab", Games
unmounts, the chip goes with it, and the observer dropped the weather step: the array went 9 to 8
under a reader sitting at index 4, so index 4 silently became a different step. The tooltip rewrote
its own content and the counter went "5 of 9" to "5 of 8" while the reader was looking at it. On the
way to Stats it happens to land on the step they were heading for anyway, which is why it read as
the tour advancing itself rather than as a fault.

Presence is still tracked — it has to be, because the chip mounts asynchronously after the card
expands, so a filter latched at start would lose that step on every MLB and NFL run. What it may not
do is add or remove anything at or behind the reader. That is `freezeDrops` in
`utils/tour_steps.ts`, and it is what makes a position stable long enough to step back through.

#### Steps are identified by id, never by position

The step array is filtered per sport and again on whether the weather chip is present, so **an index
is not a stable reference to a step.** Every consumer matches on `TourStepId` from
`tour_context.tsx`, exposed as `currentStepId`.

Three call sites previously hardcoded indices — the card's expansion trigger and two checks in the
tooltip — and were correct only because the one filtered step happened to sit after all three.
Anything inserted before it would have mis-targeted all three silently.

Two consequences worth keeping:

- `game_card` opens itself for the steps whose targets only exist inside an expanded card
  (`game-card`, `snapshot`, `weather`).
- The tour must start on Games. Both launch points navigate there first; starting from More without
  navigating left the card step with no target and produced a fallback claiming there were no games.

#### Filtering steps: presence, and only where it is earned

Steps run **9 on MLB and NFL, 8 on NBA**, which drops the weather step because NBA renders no chip at
all. There is no per-sport rule beyond that one.

Everything else filters on **presence of the anchor**, and the bar for adding an anchor to that set is
high. The array is what Joyride indexes, so a step appearing or disappearing mid-run renumbers
everything after it:

- **Appearing is safe** when the anchor sits after the reader's position — the weather chip mounts
  when the card step expands the card, and the insertion lands beyond them.
- **Disappearing is not.** It can shrink the array under a `stepIndex` that has already passed, which
  ends the tour early.

**Advancing waits for the next step's anchor.** The tooltip reads the target off the step it is about
to move to, via `nextStepTarget`, and polls until it exists before setting the index. Without that,
Next during any window where an anchor has not mounted — most reliably a sport switch, which replaces
the Games grid with skeletons — fires `TARGET_NOT_FOUND` and skips the step, then skips the one after
it if that is unmounted too. Reading the target off the step rather than from a hand-maintained map
means it cannot drift as steps are added, reordered or filtered.

Only the weather chip qualifies today: it is omitted outright when the request fails, so its step can
genuinely be reached with nothing to point at. The two Stats anchors deliberately are **not** tracked
— they are absent while the reader is on Games, but their steps come after the one that sends the
reader to Stats, and tracking them would have removed them again on the way to More. Where a target
really is missing, `TARGET_NOT_FOUND` skips the step, which is the correct outcome.

> **A filter is not a fix.** NFL used to drop both Stats steps because its win-percentage column had
> no anchor — the teams tab renders `nflSummaryHeaders`, spelling the key `winPct` where the others
> use `wins_all_percentage`. Filtering hid the missing anchor and cost NFL two steps for months.
> Check the anchor before you conclude a screen lacks the control.

### 6.11 Chart colour

**Built** — `utils/chart_theme.ts` and `utils/chart_data.ts`, consumed by the three snapshot charts.

Every series across all three sports is Home versus Away — verified against all three snapshot
generators in the backend, where no chart carries more than two. So the categorical palette is two
slots.

| Slot | Light | Dark | Role |
|---|---|---|---|
| 1 | `#2a78d6` | `#3987e5` | Home |
| 2 | `#d55181` | `#d55181` | Away |

Neutrals come from the tokens: axis `ink-2`, grid and chart borders `line`, tooltip surface `panel`,
tooltip text `ink`.

**Neither series may be green or orange.** Green means the model's output and orange means live
(§5.1), so a series painted either one makes a claim the chart is not making — "Home" in green reads
as the model favouring the home side. The previous palette did exactly that, with `#4ade80` for Home.

The pair was validated rather than chosen by eye: worst colour-vision separation ΔE 13.4 light and
15.9 dark against a floor of 8, worst normal-vision separation ΔE 27.0 and 26.5 against a floor of
15, both slots clear of 3:1 on the surface in both themes. Blue with violet fails the dark surface
at ΔE 1.9 protan, and aqua collides with brand green; neither is a substitute.

Three implementation notes:

- **The values are literals, not `var()` references.** Recharts writes colours as SVG presentation
  attributes, where a custom property does not resolve. Reading the computed value at render time
  was rejected: the theme context sets `.dark` in an effect, so a render triggered by a theme flip
  can run before the class lands and paint the chart in the theme it just left. The duplication that
  creates is closed by `chart_theme.test.mjs`, which parses `index.css` and fails on drift — the
  same hazard and the same closure as `venues.ts` against `stadium_data.json` (§4.4).
- **The backend's `color` field is ignored.** All three generators write hex into `pie_chart_data`,
  and MLB assigns the two the opposite way round from NFL and NBA, so honouring it makes "Home" a
  different colour depending on the sport. Slots are keyed on the category label.
- **Entrance animation is off.** Recharts animates in JavaScript and so never honoured
  `prefers-reduced-motion`, which §5.6 requires of all animation.

**A chart with nothing to plot renders nothing, and its heading is omitted with it.** The predicates
live in `utils/chart_data.ts` and are shared by the chart components and the modal, so the two
cannot disagree and leave a heading over an empty frame. All-zero counts as nothing: a two-slice pie
of `0.0` and `0.0` draws no sectors but still produced a legend reading "Home (0.0)".

### 6.12 List row

**Built** — `components/ui/list_row.tsx` over the `lr-` block. The component §6 had been recording
as missing since this document was written, and §8.4 deferred until More was specified.

**A group is one surface with rows in it, not a stack of surfaces.** More previously drew all
fourteen of its rows as separate bordered cards. In light mode that put a `#ffffff` row on a
`#ffffff` page, so the list had no surface of its own — only a hairline where one row ended and the
next began, and thirteen more borders competing with it.

- **Group:** `panel`, 14px radius, 1px `line`, and on dark the same 1px inset top highlight the card
  uses (§5.5). Clips to its own radius
- **Divider:** 1px `line` between every pair of children, so a tile grid divides from a link row
  without a selector per combination
- **Row:** 48px minimum, 11px/13px padding, 14px label in `ink`, 18px leading icon in `ink-2`
- **Row hover:** `panel-hover`. **Row focus:** 2px `green-text` outline at `-3px` offset — negative
  because the group clips, and an outline drawn outside the row would be cut off by it
- **Trailing indicator:** 14px, `ink-3`. `arrow-up-right` where the row leaves the app,
  `chevron-right` where it does not

Four exported row shapes: `LinkRow` leaves the app, `ActionRow` acts on the screen, `SettingRow`
holds a control rather than being one, and `Tile` is for links that differ only by which service
they are. `SettingRow` is deliberately a `div`: the control inside takes the focus and the press, and
nesting that in a button would give the row two competing targets.

**Three rules live in the component rather than at the call site**, because all three were wrong at
the call site on the screen it replaced:

- **A `mailto:` is not a new tab.** `LinkRow` reads the scheme. `target="_blank"` on a `mailto:`
  leaves an empty tab behind on desktop once the mail client takes over, and announcing "opens in
  new tab" describes something that does not happen
- **The trailing glyph is chosen by the row type**, not passed in. Every row previously carried the
  same external-link glyph, including the two buttons that never left the screen
- **Icon sizes are fixed here.** The old action row set no size, so lucide's 24px default applied and
  one row in the list rendered 4px taller than its twelve neighbours

Measured on the running app, both themes, against the group's own `panel`:

| Element | Dark | Light | Required |
|---|---|---|---|
| Row label | 14.93:1 | 18.92:1 | 4.5 |
| Leading icon, `ink-2` | 6.38:1 | 6.15:1 | 3 — graphical object |
| Trailing indicator, `ink-3` | 3.27:1 | 3.19:1 | 3 — graphical object |
| Tile label, `ink-2`, 11px | 6.38:1 | 6.15:1 | 4.5 |

The trailing indicator is the tightest number in the block and it is `ink-3` on purpose. §6.3 and
§6.5 both corrected `ink-3` up to `ink-2`, and neither correction applies here: both were about
**text**, where 4.5:1 is the threshold. This is a graphic, where WCAG 1.4.11 asks 3:1, and the
information it carries is also in the accessible name. If it ever becomes the only signal that a row
leaves the app, it moves to `ink-2` with them.

**The group is not visible as a surface in light mode**, because the page behind it is also
`#ffffff` — `body` reads `--color-bg`, not `--ground`. The border and the dividers carry the
structure instead. That is app-wide rather than particular to this component; see defect 62.

---

## 7. Patterns

### 7.1 Scanning

The Games list is the canonical case. The pattern that makes it work:

1. **A fixed anchor column** at the start of each row (the abbreviation chip) so the eye locks on
   without parsing a long name.
2. **A fixed-width value column** at the end, right-aligned and tabular, so values align down the
   whole list regardless of digit count.
3. **Contrast, not chrome, marks the important item.** The model's pick keeps full contrast; the
   other side recedes to `ink-2` / `ink-3`.
4. **Rare signals get one loud treatment** (colour + rail + glow) rather than several quiet ones.

### 7.2 Progressive disclosure

Collapsed cards carry what you need to decide whether to look closer. Expanded cards carry the rest.
The chevron indicates state and rotates 180° on expand. On desktop, where there is room, cards are
expanded by default.

Expanded sections are separated by hairlines, never by nested boxes — the card stays one object
instead of becoming a stack of panels.

### 7.3 Absence and fallback

The general rule, applied everywhere:

| Situation | Response |
|---|---|
| A value in a list of values is missing | Omit it; the list closes up |
| Every value in a group is missing | One muted line explaining why, or omit the group |
| A whole optional section is empty | Omit the section |
| A paired value has only one half | Omit both — half a moneyline is meaningless |
| Data is genuinely pending | Say so once, plainly (`Odds not yet posted`) |

Never `N/A`. Never `--`. Never an empty row where a value would be.

Sport-specific fallback rules for odds and pitchers are in §8.1.

### 7.4 State encoding

State is encoded in **form as well as words**, so it survives a squint:

| State | Encoding |
|---|---|
| Live | Orange, pulsing dot, orange left rail |
| Final | 68% opacity on the card, score held at full contrast |
| Model's pick | Full contrast + a 5px triangle marker |
| High edge | Green rail, tinted border, radial wash, glowing chip |

### 7.5 Per-sport variation

The card is one component. Sport differences are additive and small:

| | MLB | NFL | NBA |
|---|---|---|---|
| Probable pitchers | Yes | — | — |
| Weather chip | Yes | Yes, dome-aware | **Never** |
| Injuries chip | — | Yes | Yes |
| Score column | `4.5` | `27.6` | `118.9` — sets the width |
| Lean bar scale | ±3.0 runs | ±14.0 pts | ±15.0 pts |

The score column takes a **fixed 74px min-width** across all sports so its right edge never moves —
between sports, or between cards on an NBA slate once a score crosses 100.

---

## 8. Screens

### 8.1 Games — specified

The card is a **matchup, not a list of facts**. Two rows, one per team, each carrying that team's
predicted score right-aligned in a fixed column. The model's pick keeps full contrast; the other
side recedes. This is the load-bearing decision: it lets a reader scan a fifteen-game slate by
running their eye down one column.

```
┌─────────────────────────────────────────────┐
│ ● HIGH EDGE · DET                  1:10 PM  │  status rail
│                                             │
│ [CLE]  Cleveland Guardians            3.7   │  away row (receded)
│ [DET]  Detroit Tigers               ▸ 4.5   │  home row (model's pick)
│ ─────────────────────────────────────────── │
│ ML +114 / −119 · SPR −1.5 · O/U 8       ▾  │  market strip
└─────────────────────────────────────────────┘
```

| Region | Contents | Rules |
|---|---|---|
| Status rail | Edge chip (left), time or state (right) | Always present; left slot empty when no edge |
| Team rows | Abbreviation chip, full name, score | Away first, then home. Order never changes |
| Market strip | ML, spread, total, chevron | Present values only. Hidden entirely on final cards |
| Expanded | Lean bar, pitchers (MLB), action chips | Hairline dividers between sections |

**Pick marker.** The favoured side is whichever predicted score is higher. It gets a 5px green
triangle and full-contrast text. On an exact tie neither row is marked and both stay at full
contrast.

**Edge chip names the team, not the side** — `High edge · DET`, not `High (Home)`. A fan thinks in
teams.

#### Edge tiers

| Tier | Chip | Card |
|---|---|---|
| High | Filled, bordered, dot, outer glow | 3px green rail + radial wash, green-tinted border |
| Medium | Tinted fill, soft border, no dot, no glow | — |
| Low | Transparent, hairline border, muted | — |
| None | Nothing rendered | — |

If High and Medium ever look similar at arm's length, the encoding has failed.

#### States

| State | Rail left | Rail right | Scores | Market strip |
|---|---|---|---|---|
| Scheduled | Edge chip or empty | Start time | Predicted, pick marked | Present |
| In progress | Pulsing dot + `LIVE` | `Started 7:05 PM` | Predicted, both rows dimmed, no pick marker | Present, or empty |
| Final | `FINAL` | Start time | Final scores, full contrast | **Hidden** |
| No prediction | Edge chip or empty | Start time | `—` in `ink-3` | Present |

Live cards keep the prediction visible but dimmed: the number is real data the app already has, and
hiding it mid-game discards it exactly when a fan is most curious. The dimming plus the absent pick
marker stops it reading as a live update.

#### Fallback — odds

A value counts as missing when it is `null`, `undefined`, non-numeric, or `0` — with one exception.
Present segments join with `·`; missing ones vanish.

| Value | Missing when | Result |
|---|---|---|
| Moneyline | `null`, `0`, non-numeric, **or only one side present** | Segment omitted. **Edge chip also disappears** — `computeBestEdge` returns `null` without both prices |
| Total (O/U) | `null`, `0`, non-numeric | Segment omitted. A total of zero is never a real line |
| Spread | `null`, non-numeric, or `0` **when no valid total sits beside it** | Segment omitted |
| All three | — | Pre-game: `Odds not yet posted`. Live or final: strip left empty |

**The spread exception.** A spread of `0` is a legitimate pick'em. But the NFL preseason feed sends
`0` for spread *and* total together, which is plainly placeholder — the source of the
`Spread: 0 / O/U: 0` that shipped on every preseason card until stage 5 closed defect 4. Treating a
zero spread as real only when a valid total accompanies it kills the placeholder without losing the
genuine pick'em.

> `game_card.tsx` computes `hasMarket` as `(ML pair) || spreadLine != null`, which calls
> `computeBestEdge` for spread-only games. That call always returns `null` because the de-vig cannot
> run. Harmless, but the guard is misleading.

#### Fallback — MLB pitchers

| Case | Render |
|---|---|
| Both names present | Both rows |
| Exactly one present | Both rows; the unknown reads **TBD** at 55% opacity |
| Neither present | Section omitted entirely |
| Name is whitespace or the literal `"TBD"` | Treated as absent |
| Handedness present and recognised | `(R)` / `(L)` |
| Handedness missing or unrecognised | Parenthetical omitted, name still shows |
| Sport is not MLB | Section never renders |

Handedness normalises before display — feeds send `R`, `RHP`, `Right` and `null` for the same thing.
Map to a single letter; drop anything that does not map rather than printing it raw.

The `AWAY` / `HOME` micro-labels are required, not decorative: when only one starter is known, an
unlabelled lone name is genuinely ambiguous.

#### Fallback — weather

| Condition | Render |
|---|---|
| Sport is NBA | No chip, ever. No request |
| Venue known indoor | **Roof closed**, muted, non-interactive. No weather request fired |
| Outdoor, request in flight | Skeleton at chip dimensions |
| Outdoor, data present | Wind arrow + `38°F · 12mph`. Opens the modal |
| Request failed, or `unavailable: true` | **Chip omitted.** Never `N/A` |
| Venue not in the stadium file | Chip omitted. The service already returns `reason: "NO_VENUE"` |

**Retractable roofs.** Five of the eleven NFL indoor venues retract (AT&T, Mercedes-Benz, NRG, Lucas
Oil, State Farm), and the flag treats them as permanently closed — usually right, occasionally
wrong. The copy stays honest rather than precise: "Roof closed", with no claim about outside
conditions. Do not let anyone add a temperature or "feels like" figure to a dome card.

### 8.2 Stats — specified

The screen is a **league table you re-sort**, not five tables behind tabs. One `DataTable` renders
every dataset from a column configuration; the sport selector lives in the header (§6.6), and the
sub-tabs and season selector are both §6.3 segmented controls.

```
┌──────────────────────────────────────────────────────┐
│ [TEAMS] Players  Advanced        2025-26 2024-25 ... │  toolbar, both §6.3
│                                                      │
│ NBA teams by Win %                                   │  states the sort
│ 2025-26 season · 30 teams                            │
│ ┌──────────────────────────────────────────────────┐ │
│ │  #  TEAM              WIN %    OFF PTS   DEF PTS │ │  sticky header
│ │  1  Oklahoma City     ▓▓▓77.2%   117.9     108.2 │ │
│ │  2  San Antonio       ▓▓ 72.0%   118.4     110.1 │ │
│ │  3  Detroit           ▓▓ 69.0%   115.8     108.8 │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

#### The sorted column is the subject

This is the load-bearing decision, and it settles decision 5.

The reader states their question by sorting. The screen answers it by making that column the
subject of the page: the heading names it, the column keeps full `ink` while every other numeric
column recedes to `ink-2`, and a magnitude bar behind each figure gives the column a shape.

| Element | Treatment |
|---|---|
| Rank gutter | Mono 11px 600 `ink-2`, 38px, first column, pinned. Numbers the current sort. `ink-2` rather than `ink-3` because a rank is a value a reader uses: `ink-3` measured 2.84:1 once a row hover lifts the surface |
| Heading | `NBA teams by Win %` — the sorted column named in `green-text`. Changes as you sort |
| Sorted column | `ink` text, 2.6% `ink` column tint through header and body, caret in `green-text` |
| Other numeric columns | `ink-2` |
| Magnitude bar | `ink` at 7%, right-anchored, width `12% + 88% × (v − min) / (max − min)` |

**The bar reports magnitude, never quality.** No scheme here may encode good or bad, for two
reasons and the second is the stronger one:

1. §5.1 has no red/amber/green status ramp. Green belongs to the model's output and the app's own
   chrome; orange belongs to the live state.
2. **The app does not know which direction is good.** A high `def_rtg` is a bad defence, a high
   `tov_pct` is bad, and `sos`, `pace` and `luck_factor` have no direction at all. A heat map would
   confidently mislead on three of the eight NBA advanced columns. This is §4 applied to a design
   question: do not display a judgement the app cannot make.

The bar's width is a fact about the number. The reader's own sort direction supplies the polarity,
and the rank gutter is the authority on order.

**Rejected:** marking the leading three rows. It spends green — reserved for the model's output — on
a descriptive league table the model had no part in, and re-encodes what row position already says.
By §3's rarity test, the top three of every column is not rare.

#### Layout

| Region | Rules |
|---|---|
| Toolbar | Sub-tabs left, seasons right, wrapping to two rows below `sm`. Full-bleed, §6.6 chrome |
| Heading | 20px 700 with the sorted column in `green-text`; a mono caption gives season and row count |
| Search | NBA players only. §6.4 input, debounced 250ms |
| Table | §6.5. Numeric columns take their natural width; the name column absorbs the slack |

**Numeric columns must not stretch.** The old table was `min-w-full` with as few as four columns
across a desktop viewport, so values sat a hand's width apart and comparing them meant tracking
across dead space. Numeric cells take `width: 1%` with `white-space: nowrap`; the name column is the
only elastic one.

#### Per-sport variation

| | MLB | NFL | NBA |
|---|---|---|---|
| Sub-tabs | Teams · Advanced | Teams · Advanced | Teams · Players · Advanced |
| Teams source | `team-stats` | `team-stats/summary` | `team-stats` |
| Season label | `2025` | `2025` | `2025-26` |
| Player search | — | — | Yes |

#### Absence

A missing statistic renders as an **empty cell**. The old `–` filler is exactly the placeholder §3
principle 3 and §7.3 forbid; a table cell can genuinely be blank, and a column of real values with
two gaps reads more honestly than one padded with dashes.

### 8.3 How to Use — specified

**Built** — `how_to_use_screen.tsx` over the `htu-` block. The one prose screen: wider measure, more
spacing, and the accent colours on tokens.

**The screen leads with the card, not with navigation.** It previously taught four gestures — switch
sport, expand a card, open two chips, visit Stats — and never said what a predicted score, the pick
marker or the edge chip meant. That is the product's entire output. A first-time reader's question is
what they are looking at, not how to switch sports.

| Region | Contents |
|---|---|
| Header | Title and a one-paragraph statement of what the app does |
| **Reading a game card** | An annotated specimen beside a parts list, each part named in the words the interface uses |
| **Getting around** | The numbered timeline — sport and date, the chips, Stats |
| **What the app does not do** | The three limits below |
| Footer | Primary button starting the tour |

**The numbered timeline is retained, and only for the navigation.** The numbering is legitimate there
because those steps genuinely are sequential; it would be decoration on the card anatomy, which is
not a sequence. Numbers are mono on `accent-fill`, centred on a rule that stops short at both ends.

**The specimen is built from the card's own components** — `TeamRow`, `EdgeChip`, `MarketStrip` and
the `gc-` stylesheet — rather than redrawn. This screen went stale because it described a card that
had been rebuilt underneath it, so every part that can share code does, and the market line is
generated by `marketSegments` from fixed demo values. The arrangement and the wording are still a
copy, so a structural change to the card does still need an edit here.

**The honest-limits block is required, not optional.** §4 exists because the code implies otherwise
and has already misled a reader on this project, and a sports app trains people to expect a live
feed. The screen states plainly: no live scores or clock; predictions clear once a game starts; the
edge is a comparison against the market, not a probability the app can stand behind.

**Offline, the guide still renders.** It is static prose and needs no connection. Only the snapshot
demo and the tour do, so the notice is inline (§6.9) and those two controls are disabled, rather
than the whole screen being replaced.

### 8.4 More — specified

**Built** — `more_screen.tsx` over the `mor-` block, with every row from §6.12.

**The screen was straddling two design systems and you could see the seam without measuring.** Its
offline notice was already on the v1 tokens — `panel` `#151c24`, hairline `#232e38` — while the rows
directly beneath it were on the previous generation plus raw Tailwind slate, `#161b22` and
`rgba(71,85,105,.6)`. Four hex values apart is close enough to read as a rendering fault rather than
a decision. That, rather than any single defect, is what this pass was for.

| Region | Contents |
|---|---|
| Heading | `h1`, "More". The screen had none, and four `h2`s with nothing above them |
| **Appearance and options** | The theme control (§6.3 via `theme_control.tsx`) and Restart the tour |
| **Feedback and support** | Report a bug, Request a feature, Support |
| **Information** | About, Documentation, Disclaimer, Terms of Service, Privacy Policy |
| **Connect with us** | Four tiles, one per account |
| Footer | The version line, mono `ink-3`, centred |

**The controls come first.** Two of the fourteen rows do something in the app and twelve leave it,
so appearance and the tour lead and the reference links follow. It also puts the guided tour's final
step on something already in view.

**The four social rows are one row of four tiles.** Three of the four labels ended in the same
handle, which §3.3 says to delete rather than restyle. The handle moves into the accessible name, so
a screen reader still gets it. Icon above an 11px label is the one arrangement §5.7 permits an icon
to lead, and it is what the bottom navigation already does.

**The theme control names both values.** It was a single button reading "Dark Mode", and nothing
about it said whether that was the theme you were in or the one you would get — with no
`aria-pressed`, no `aria-label` and no `role`, on the element the tour's last step points at. It is
now the shared segmented control, which brings `aria-pressed`, the 2px `green-text` focus outline
and the 44px target with it. Its track takes `panel-2` and `line-2` rather than the §6.3 default,
because the row it sits on is already `panel`. Measured, the track reads more strongly against its
surface than the header's shipped control does against `ground` — 1.56:1 against 1.17:1.

**Offline, the screen keeps its heading, the appearance group and the version line**, and defers
only the links. Both branches render the same group from the same code, so the offline state cannot
drift from the online one — which is how the old offline branch ended up with an unstyled toggle
nobody had seen.

**Guided-tour anchor.** `data-tour="theme-toggle"` is carried by `theme_control.tsx` through
`SegmentedControl`'s `tourId` prop on **both** branches. A `grep -rn "data-tour"` no longer finds the
literal in `more_screen.tsx`; the comment at the top of `theme_control.tsx` is what that audit finds
instead. Same arrangement, and same hazard, as the sport switcher (§6.10).

**Version.** `import.meta.env.VITE_APP_VERSION`, stamped by a `define` in `vite.config.ts` from
`package.json`, rendered unconditionally. It is not behind a guard on purpose: it used to be, nothing
ever set the variable, and the line silently never appeared. `version_stamp.test.mjs` fails if the
define is removed, because nothing else would.

### 8.5 Game detail — direction

**Game detail** expands in place from a card; it inherits the card language directly.

---

## 9. Accessibility

Target: **WCAG 2.1 AA**.

| Requirement | Rule |
|---|---|
| Text contrast | 4.5:1 for body, 3:1 for text 18px+ or 14px bold. Measured values in §5.1 |
| Non-text contrast | 3:1 for control borders, focus rings, and the edge chip's border |
| Touch targets | 44×44px minimum, achieved with padding where the visible element is smaller |
| Focus | Every interactive element has a visible focus state: 2px `green-lift` / `green-deep` ring at 2px offset. **`outline: none` without a replacement is a defect** |
| Motion | All animation respects `prefers-reduced-motion: reduce` |
| Colour independence | No meaning is carried by colour alone. The edge tier also varies by border, glow and label; live also has a label; the model's pick also has a triangle |
| Semantics | Cards are `<article>`; expandable headers carry `aria-expanded`; segmented controls carry `aria-pressed`; sortable headers carry `aria-sort`; live regions use `aria-live="polite"` |
| Screen reader | Predicted scores need an accessible label giving both numbers and their meaning — the visual split across two rows loses that context |

---

## 10. Content and voice

Plain, factual, unhedged. The app reports; it does not persuade or apologise.

| Do | Don't |
|---|---|
| `Odds not yet posted` | `Odds unavailable at this time` |
| `No NBA games on August 4` | `Sorry, nothing to show!` |
| `Roof closed` | `Weather N/A` |
| `Started 7:05 PM` | `Game in progress since 7:05 PM` |
| `High edge · DET` | `🔥 Strong value pick!` |

Rules:

- **Never imply certainty the model does not have.** No "lock", "guaranteed", "sure thing".
- **State facts, not feelings.** An empty state says what is true and offers a next step.
- **Sentence case** for headings and buttons; **uppercase** only for mono micro-labels.
- **Team names in full** in prose; abbreviations only in the chip and the edge chip.
- No exclamation marks. No emoji in interface copy.

---

## 11. Defect register

Seventy-four defects are on record — eighteen found while writing this document, one while briefing
the chrome work, six while building it, eight during the How to Use and tour refresh, thirteen during
the modal refresh, five more from running the guided tour by hand, ten from the Stats rebuild, eleven
from the More refresh and two from the backward-routing fix. **Sixty-five are fixed.** The nine still
open live on screens the redesign has not reached, in the backend, or need an app-wide sweep.

> Counted from the rows rather than carried forward. The running total had drifted from the table
> twice, so re-count it rather than incrementing it.

Defects 47 to 49 are worth reading together — a missing anchor, a filter that hid it, and a
regression in the commit meant to make step-skipping safer. **None of the three was reachable without
running the tour**, which for most of this project's life nothing could do automatically. They are
the argument for §6.10's rule that a filter is not a fix.

> **That constraint no longer holds, and it is worth knowing before the next tour change.** Four
> entries in this changelog and one row of the SOP's trap table record that
> `requestAnimationFrame` does not fire in the headless test browser, so the tooltip never lays out
> past step one. Re-measured on 2026-08-15: `document.hidden` is **`false`**, `visibilityState` is
> `visible`, rAF fires, and the full nine-step tour can be walked in both directions from the pane —
> which is how defects 50 and 73 were confirmed as a before-and-after rather than by reading.
> **`document.hasFocus()` is still `false`**, so `:focus` never matches and focus styles still
> cannot be measured. That is a different limitation which had been folded into this one.

Defects 20 to 23 were found by measuring the chrome rather than reading the brief for it, and 24 and
25 by reading the compiled bundle. Two of them — 20 and 21 — were more serious than anything the
brief listed: a contrast failure worse than the one it flagged, and a behaviour the brief asked to
preserve that had never functioned.

The modal pass repeated that pattern. The brief for it listed eight defects, all real; measuring
found five more that were worse, and **34 was the most serious defect found in any pass** — a modal
that never reached the viewport at all. Three of the thirteen (36, 37, 43) came from querying the
production feed and reading the service rather than trusting the type declarations, which in the
injuries case turned out to describe a status vocabulary the feed has never sent.

### Closed

Sixty-five of the seventy-four are closed. The closed entries — each with the defect, its measured
consequence and the change that fixed it — are maintained in the private repository and available
on request.

### Open

| # | Defect | Location | Scheduled |
|---|---|---|---|
| 33 | The schedule feed renders **`St.Louis Cardinals`** without a space. The abbreviation lookup normalises it (§4.3); the displayed name does not | Games feed mapping | Unscheduled |
| 41 | **`.focus-ring` uses brand green**, which measures 2.85:1 on the light panel and misses the 3:1 non-text requirement in §9. Every consumer app-wide is affected. The modal's own controls use `--green-text` instead | `index.css` | Unscheduled — needs an app-wide sweep |
| 43 | **`weather_service.js` omits `stadium` from its success response** while returning it on the no-venue, indoor and upstream-error paths — so the field is present only when it cannot be shown, and absent on the one path the weather modal opens on | `backend/server/services/weather_service.js` | Backend, unscheduled |
| 44 | **The backend embeds chart hex in the snapshot payload**, and MLB assigns Home and Away the opposite way round from NFL and NBA. The frontend now ignores the field (§6.11), leaving it as dead data in the payload | `backend/*_features/make_*_snapshots.py` | Backend, unscheduled |
| 45 | **`cacheTime` was renamed `gcTime` in React Query v5**, so the option passed here is silently ignored | `hooks/use_snapshot.js` | Unscheduled |
| 59 | **`SkeletonBox` is dark-only.** `bg-slate-700/50` with no light variant, so every loading state renders mid-grey bars on a white page. §6.8 requires `panel-2` with a shimmer. Six consumers across Games, game detail and the three schedule displays | `components/ui/skeleton_box.tsx` | Unscheduled — Stats stops using it in stage 5, which leaves the other five consumers exposed |
| 71 | **No screen in the app has a ground.** `body` is `bg-[var(--color-bg)]`, the previous generation — `#ffffff` in light and `#0d1117` in dark — rather than `--ground` (`#f4f7f6` / `#0b1016`). So in light mode every `panel` surface in the app is white on white, and a card, a table wrapper or a list group is delineated only by its 1px border at **1.26:1**. Found while measuring More, where it is the reason the new list group reads as an outline rather than a surface. §5.1's `ground` and `panel` pair, and §5.5's whole approach to elevation, are inert in light mode until this changes | `index.css`, `body` rule | Unscheduled — app-wide, touches every screen and needs its own pass |
| 72 | **Three answers to which typeface the app uses, and none of them loads.** §5.2 specifies Archivo self-hosted with JetBrains Mono for numerals; `tailwind.config.cjs` sets `sans` to Source Sans 3; `app.html` fetches **Inter** from Google Fonts, which no CSS rule in the project references. Measured on the running app, `document.fonts` is empty and body text resolves to the system UI sans — so the third-party request §5.2 forbids is being made, for a face nothing uses, while the specified face is absent. Related to decision 4, but the unused request is a defect regardless of how that decision goes | `frontend/app.html`, `tailwind.config.cjs` | Unscheduled — needs decision 4 settled first |
| 61 | **The NBA players table shows season totals under per-game labels.** `Pts 2212`, `Min 3003`, `GP 85` sit under headers — Pts, Reb, Ast, Min — that every stats site uses for per-game averages | `stats_screen.tsx` | Partly closed in stage 5: the caption now reads "season totals". Dividing by GP would invent a per-game figure the API does not send, so the values are unchanged and the ambiguity is narrowed rather than removed |

### Found since

ESLint was installed on 2026-08-13 — the project had a `lint` script but no config and no ESLint
installed, so it had never run. Its first pass found five genuine defects beyond the register above,
all now fixed: `useTour()` called inside an `onClick` handler, so the offline "Restart Interactive
Tour" button threw on press; two `snapshot_modal` chart titles written as discarded statements, so
NFL snapshots showed the NBA fallback titles; and hooks running after early returns in three
components, which React throws on when the branch flips.

**Still outstanding from that pass**, re-counted 2026-08-15 rather than carried forward: **22
warnings, 0 errors** across the whole of `src` — 13 `no-explicit-any`, 6 `no-unused-vars` and 3
`react-hooks/exhaustive-deps`. The `no-console` warnings this line used to report are gone, and the
`no-explicit-any` count has come down from 65 as the screens were rebuilt. All are visible in
`npm run lint` without failing it, and are worth a separate sweep.

> **`npm run check` does not run on Node 20.** `test:utils` passes a glob to `node --test`, which
> only expands it from Node 22, and the `.test.mjs` files import `.ts` directly, which needs type
> stripping — on by default only from Node 22.18. On an older runtime the script reports
> "Could not find src/**/*.test.mjs" and exits 1 without running a single test, which reads exactly
> like a missing-file error rather than a version one. Run the three parts separately, or use a
> current Node. All 122 tests pass on Node 22.14 with `--experimental-strip-types`.

---

## 12. Implementation plan

Order matters — each stage depends on the one before.

| Stage | Work | State |
|---|---|---|
| **1 — Foundations** | §5.1 tokens in both themes, Tailwind families. Defects 1, 2, 15, 16, 18 | ✅ Shipped 2026-08-14 |
| **2 — Shared chrome** | §6.3 segmented control, adopted in the header; §6.6 navigation. Defects 11, 12, 13, 19–23 | ✅ Shipped 2026-08-14 |
| **3 — Game card** | The §8.1 rewrite. Defects 4, 5, 9, 10 | ✅ Shipped 2026-08-14 |
| **4 — Fallbacks** | Odds, pitchers, weather. Defects 6, 7, 8, 17 | ✅ Shipped 2026-08-14 |
| **5 — Stats** | The §8.2 rewrite: one `DataTable`, both segmented controls, search, skeletons. Defects 24, 25, 42, 52–58 | ✅ Shipped 2026-08-15 |
| **6 — Remaining screens** | How to Use and the guided tour per §8.3 and §6.10; the shared offline notice per §6.9. Defects 3, 26–30 | ✅ Shipped 2026-08-14 — Game detail still to do |
| **7 — Games modals** | The §6.7 shell and the three modals on it; §6.11 chart colour; the §6.2 chip adopted. Defects 31, 32, 34–40, 46 | ✅ Shipped 2026-08-14 |
| **8 — More** | The §8.4 rewrite: the §6.12 list row, the theme control on §6.3, the version stamp. Defects 62–70 | ✅ Shipped 2026-08-15 |

Stages 1, 3 and 4 were built as seven commits, sequenced so the first four were invisible in the app
— tokens, stylesheet, helpers and components all landed before anything consumed them. That left one
commit a user would notice, which could be reverted alone without losing the rest. The record is in
`game_card_implementation.md`.

Stage 2 was deliberately deferred rather than skipped: the card was the screen users actually spend
time in, and the header could wait. It shipped in six commits on 2026-08-14, sequenced so the shared
component landed first with nothing consuming it — which is what unblocked the Stats, modal and
How-to-Use briefs, all three of which would otherwise have hand-rolled their own segmented control
and re-created defect 13.

**§6.2 chip was dropped from this stage.** It was listed here but the chrome contains no chips; the
action chip already ships as part of the Games card (§8.1), and the Stats screen is where a shared
chip would next earn its keep. It moves to stage 5.

Stage 2 was built without a dev server and **verified against the running app afterwards**. All four
screens, both themes: one shared surface with no seam, every contrast ratio measured and passing
(nav active 10.78 dark / 5.44 light, segment selected 6.65 / 5.79), all five `data-tour` anchors
present in the rendered DOM, and the 320px overflow closed. Full measurements in
`chrome_implementation.md` §8.

**One gap remains: the guided tour past its first step.** Step 1 was confirmed to land on
`[data-tour="sport-switch"]` with pixel-accurate geometry, but the tour cannot be advanced from the
headless test browser — `document.hidden` is `true` and `requestAnimationFrame` never fires, so the
tooltip never lays out. It needs a human to click through once.

Because the app is a Trusted Web Activity loading `scoregenius.io/app` at runtime, every stage ships
through Render with no Android build and is reversible within minutes.

---

## 13. Decisions

### Settled

| # | Decision | Outcome |
|---|---|---|
| 1 | **Team abbreviations** | Shipped. `utils/team_abbr.ts`, 92 clubs, normalised lookup — see §4.3 |
| 2 | **Dome weather requests** | Client-side set, no API change. Extended to MLB once decision 3 landed, since the round-trip was then equally pointless for those 8 ballparks — `utils/venues.ts`, 19 venues |
| 3 | **MLB `is_indoor` data** | Fixed. All 31 MLB entries now carry the flag explicitly, 8 of them indoor |
| 6 | **First-run "View details" tooltip** | Removed. ~100 lines of viewport measurement, a layout effect writing `style.left` onto a node, and a `sessionStorage` key. The chevron now carries a "More" label instead |
| 5 | **Stats numeric emphasis** | Settled as **the sorted column is the subject** — see §8.2. Contrast, a rank gutter and a neutral magnitude bar. A heat map was rejected twice over: the palette has no status ramp, and the app does not know which direction is good for `def_rtg`, `tov_pct`, `sos`, `pace` or `luck_factor` |

### Open

| # | Decision | Options | Notes |
|---|---|---|---|
| 4 | **Font adoption** | (a) both faces self-hosted, (b) mono only, keep Source Sans 3 | Currently (b): the mono stack resolves to Consolas and does most of the work. Archivo is the part worth a webfont. **Measured 2026-08-15: nothing loads at all.** `document.fonts` is empty on the running app and `app.html` fetches Inter, which no CSS rule references — see defect 72 |

---

## 14. Provenance

Approved from three mockups produced 2026-08-13: a "Proposed Minimalist" pass that corrected the
existing card without restructuring it, a "Proposed New Direction" that restructured it, and an
NFL/NBA pass that verified the system carries across sports. All three render every state at real
data values taken from production.

Deliberately excluded during review: a four-stat block showing model probability, market
probability, edge percentage and z-score. See §4.2.

### Changelog

**1.7 — 2026-08-15.** Defects 50, 73 and 74 closed, in eight commits, and the design question under
50 settled:
**the tour owns backward routing, the reader owns forward routing.** §6.10 gains that section and the
reasoning. Forwards the tour waits but never moves the reader, because "open this tab, then press
Next" *is* the lesson of those two steps. Backwards there is no lesson, so Back routes to the screen
that owns its anchor, waits for it exactly as advancing does, and only then commits.

The defect had two halves and neither alone explains it. `goBack` set the index blind while its
counterpart waited three seconds; and `TARGET_NOT_FOUND` incremented unconditionally, so a Back onto
an unmounted anchor was not refused but reversed. Six of the nine steps were never affected — they
sit on the reader's current screen or point at chrome — which is why this read as intermittent for
long enough to be filed as "needs a decision first".

**Defect 73, found on the way and arguably worse:** the step array shrank under the reader on every
run. The weather chip is a Games element, so following "Open the Stats tab" unmounted it, the
observer dropped its step, and 9 became 8 beneath a reader at index 4 — the counter and the content
changing while they read it. The note above `CONDITIONAL_ANCHORS` had described exactly this hazard
since it was written, with nothing enforcing it. It is now `freezeDrops`: presence may add or remove
a step only ahead of the reader.

A third fault was introduced during the pass and caught by driving it: committing a backward hop and
letting the skip handler sort it out cascades, because every earlier step is just as likely to be
missing. One Back press took the tour from step 5 to step 1. A backward hop that cannot reach its
anchor now refuses and leaves the reader where they were.

The step model moved to `utils/tour_steps.ts` so it could be tested at all — a `.test.mjs` can import
a `.ts` but not a `.tsx`. Twenty tests, two of them drift checks in the spirit of
`chart_theme.test.mjs`: the conditional-anchor selectors against the steps they filter, and every
route in `STEP_ROUTES` against the routes `App.tsx` defines. Checked by mutation rather than assumed.

**The standing claim that this tour cannot be driven from the headless test browser is wrong.** It
appears in four entries below and in the SOP's trap table. Re-measured: `document.hidden` is `false`,
rAF fires, and the whole sequence walks in both directions. Defect 50 was therefore confirmed as an
A/B on one build with only the tooltip swapped — Back on step 8 of 9 from More gives step 8 before
and step 7 on Stats after. `document.hasFocus()` is still `false`, so focus styles remain
unmeasurable; that is a separate limitation which had been folded into this one.

**Defect 74, fixed in a follow-up the same day.** Walking the tour surfaced it: every navigation to
Games or Stats reset the sport to NBA. A route effect in `sport_context` ran the same expression in
both of its branches, and both resolved to NBA, while the comments above it said "/stats → NFL
always" and "/games → MLB baseline". It undid the tour's own first lesson, and in August it landed
the reader on a sport with no games.

**The effect is removed rather than corrected, because all three candidate behaviours were wrong.**
The switcher lives in the header, which is chrome present on every screen (§6.6) — a control in
persistent chrome that resets when you change screen is broken by construction. Nothing needed a
per-route sport either: Stats renders for all three, and a sport with no games on a date already has
a designed empty state (§6.9) rather than a silent substitution.

Fixing only the navigation case would have moved the same complaint to the date control, since the
availability resolver reassigns on every new date by design. So an explicit choice is now remembered
and the resolver defers to it: it stays a first-load default rather than becoming a preference.
Verified by picking MLB — a sport the resolver did not choose for the day — and walking Games →
Stats → More → Games with it intact, and by confirming a fresh load still resolves NFL from an
initial state of NBA.

**1.6 — 2026-08-15.** More rebuilt, in five commits. §8.4 goes from direction to specification and
§6.12 adds the list row — the component this document has been recording as missing since it was
written. §8.4 is renumbered from "Game detail and More"; Game detail keeps its direction as §8.5.

**The screen's problem was not any one defect on the brief.** It was built from two token generations
at once: its offline notice was already on the v1 set while the rows beneath it were on the previous
generation plus raw Tailwind slate, four hex values apart — close enough to read as a rendering fault
rather than a decision. Fourteen bordered cards became four groups with hairline rows, which also
took the screen from 1093px to 886px on the specimens while *adding* a page heading and a version
line.

Register grows to 72, with eleven found in this pass and nine of those fixed. The worst is defect 62,
and it is worth reading as a pattern rather than a bug: offline, the theme toggle rendered with no
background, an off-palette `#e5e7eb` border at **1.24:1**, and a 38px target, directly above a fully
painted row. `variant="card"` made the component drop its own colours and wait for the parent, and
the offline branch never supplied any. **Nothing in the register or the brief had it, because it is
unreachable from the normal screen** — the same reason defects 47 to 49 needed the tour run by hand.
Both branches now render the same group from the same code, so that class of drift cannot recur here.

Two defects are recorded rather than fixed, both app-wide and both found by measuring this screen.
Defect 71: **no screen in the app has a ground.** `body` still reads `--color-bg`, so in light mode
every panel is white on white and §5.5's whole approach to elevation is inert — the new list group is
delineated by its border at 1.26:1 rather than by a surface. Fixing it on one screen would have
recreated exactly the two-generations problem this pass removed. Defect 72: **three answers to which
typeface the app uses, and none of them loads** — `app.html` fetches Inter, which no rule references,
while `document.fonts` is empty and the specified Archivo is absent.

Two divergences from the SOP are worth recording rather than tidying away. **The documentation was
written after the build, not before it** (§4), because the brief compressed the sequence to five
commits for a screen this small; no separate `more_implementation.md` was written, and this section
plus §8.4 carry the record instead. And **one defect was introduced during the pass and caught only
by measurement**: the divider rule and `.lr` have identical specificity, and `.lr` resets `border` to
0 for the button case, so with the divider written first every divider computed to `border-top: 0px
none` and the group rendered as one undivided slab. It looks like a design choice, which is why
reading the stylesheet would not have found it. Same cascade mechanism as defects 24 and 26, now on
its third appearance in this codebase.

**Not verified: focus states.** `document.hidden` is true in the headless test browser, so `:focus`
never matches and every focus rule reads as `none`. Defect 64 was diagnosed from
`--tw-ring-offset-color`, which is readable regardless, but no focus ring on this screen has been
seen to render. Nor has the guided tour past its first step, for the `requestAnimationFrame` reason
this document has now recorded four times. Both need a human pass.

**1.5 — 2026-08-15.** The Stats screen rebuilt, in seven commits. §8.2 goes from direction to
specification and decision 5 is settled: **the sorted column is the subject of the page** — contrast,
a rank gutter and a neutral magnitude bar. A heat map was rejected twice over, and the second reason
is the load-bearing one: the app does not know which direction is good for `def_rtg`, `tov_pct`,
`sos` or `pace`, so any scheme encoding quality would confidently mislead on three of the eight NBA
advanced columns. §6.5 rewritten around the two rules the old table broke in ways that looked like
styling — a sticky header needs a real scroll port, and sorting must be operable from the keyboard.
`panel-hover` added to §5.1.

Register grows to 61. Nine of the eleven defects on this screen were found by driving the running
app against production data rather than by reading it, and three were wrong information rather than
wrong styling: NFL Teams arrived sorted by a column it does not render, MLB reported Win % two ways
one tab apart, and the players table labels season totals as per-game averages. Three further
hypotheses that looked certain from the source were killed by checking, and are recorded in
`stats_implementation.md` §2 — reading alone would have shipped all
three as findings.

Measuring the new screen corrected the specification twice, both times the same way §6.3 was
corrected during stage 2: `ink-3` is too quiet for anything a reader actually reads. Column headers
and the rank gutter both moved to `ink-2`.

**1.4 — 2026-08-14.** The three Games modals rebuilt on one shell. §6.7 rewritten to describe
shipped code, §6.11 added for chart colour, §12 gains stage 7. Register grows to 46 with thirteen
found during the pass, of which five were worse than anything the brief listed — most seriously
defect 34, an injuries modal that never reached the viewport because it rendered inside a card
carrying `contain: layout` and `overflow: hidden`. Three more (36, 37, 43) came from querying the
production feed rather than trusting the types: the injury status union described a vocabulary the
feed has never sent, and 81% of the "injury report" was players who are not injured.

**One rule is now contradicted by shipped code.** §5.1 reserves orange for the live state, and the
injury modal's team names use `--orange-text` at the owner's request — 8.35:1 dark, 4.97:1 light, so
it passes AA on both panels, but it is the first use of orange outside the live state. Either §5.1
gains an exception or the team names revert to `ink`. Flagged, not settled.

**1.4 — 2026-08-14.** The guided tour was run by hand for the first time and **failed**, which found
three defects nothing automated in this project can reach — `requestAnimationFrame` does not fire in
the headless test browser, so the tooltip never lays out past step one.

Defect 47: NFL's win-percentage column never carried its tour anchor, because the teams tab renders
two header sets spelling that column `wins_all_percentage` and `winPct`. Defect 48: the tour dropped
both Stats steps on NFL on the false premise that its stats screen lacks those controls — the filter
had been concealing 47 for months and cost NFL two steps. Defect 49, a regression from 1.3's own
bounding of `TARGET_NOT_FOUND`: reading `stepIndex` from the closure made repeated events compute the
same index, so the tour stuck and re-logged "Target not mounted" instead of skipping.

All three sports now run the full sequence — **9 steps on MLB and NFL, 8 on NBA**. §6.10 gains a
subsection on step filtering, including the rule that earned it: **a filter is not a fix.** Check the
anchor exists before concluding a screen lacks the control.

A second pass, after that one succeeded on all three sports, found defect 51: **switching sport and
re-running jumped from step 1 to step 4.** Games swaps its whole grid for skeletons while a new slate
loads, so the card and chip anchors are briefly absent and Next skipped both steps. Readiness had
been a hand-maintained map with one entry; it now reads the target off the next step itself, so every
hop waits and no map can drift from the step definitions. Defect 50 — **Back can move the reader
forward**, for the mirror-image reason — is recorded and left open, because fixing it means deciding
whether the tour owns backward routing.

**1.3 — 2026-08-14.** How to Use and the guided tour rebuilt, in eight commits led by the copy. The
screen had been describing a card that was rebuilt underneath it on 13–14 August, so it was teaching
controls that no longer existed — a `▾` glyph that had become a labelled **More** chip, and a
"Weather" button that has never carried that label. Six of nine claims across the guide and the nine
tour steps were wrong or incomplete.

§8.3 moves from direction to specification: the screen now leads with an annotated card rather than
with four gestures, and the specimen is built from the card's own `TeamRow`, `EdgeChip` and
`MarketStrip` so most of the drift surface is gone. §6.10 is new and records the guided tour,
including **the anchor contract stage 5 must honour** and the rule that steps are identified by id
rather than by position. §6.9 gains the built two-shape offline component.

Defect 3 closed, and five found while building: 26 (`.howto-step-num` beating its own call site —
the same cascade mechanism as 24, in a second place), 27 (three hardcoded step indices), 28
(unbounded step advance), 29 (the tour restarting on the wrong screen) and 30 ("Live scores" in copy,
against §4.1). Three more recorded but not fixed, all on Games: 31, 32 and 33.

**Not verified: the guided tour past its first step.** `requestAnimationFrame` does not fire in the
headless test browser, so `react-floater` never lays the tooltip out. It needs a human pass on each
sport, and NFL is the interesting one — the filter assumes NFL's team table has no win-percentage
column, which is untested.

**1.2 — 2026-08-14.** Stage 2, the shared chrome, built and shipped in six commits. One segmented
control replaces the header's hand-rolled toggle and is available to Stats; the header, filters bar
and bottom navigation share a single `.chrome-surface` rule on `ground`, closing the seam. Defects
11, 12, 13 and 19 closed, and six more found by measuring rather than reading: 20 (sport labels at
2.45:1, worse than 19), 21 (hide-on-scroll had never worked), 22 (unreachable date picker), 23
(header overflowed at 320px), 24 (Stats filters bar misaligned at `md`+, still open) and 25
(hardcoded `text-secondary`/`text-primary`, still open).

Two amendments were made against measurement. §6.3 and §6.6 both specified `ink-3` for unselected and
inactive labels; at 3.27:1 and 3.65:1 those are AA failures on interactive labels, so both become
`ink-2`. And §6.6's requirement to preserve hide-on-scroll was dropped once the behaviour was shown
never to have run — reinstating it is now recorded as a new feature rather than a regression.

Added `accent-fill` / `accent-fill-ink` to §5.1: the selected-control green, and the only green in
the system that differs between themes.

**Verified against the running app** after the build, once a dev server was available: every chrome
contrast ratio measured and passing in both themes on all four screens, the shared surface confirmed
identical across header, filters bar and nav, and defect 23 closed at a 320px viewport. The guided
tour is confirmed only as far as step 1 — the headless test browser runs with `document.hidden` true
and no `requestAnimationFrame`, so the tooltip cannot position. One human click-through is
outstanding.

**1.1 — 2026-08-14.** Foundations and the Games screen built and shipped. Defect register updated:
14 of 18 closed, the 4 open ones scheduled with the screens they live on. Decisions 1, 2, 3 and 6
settled. Measured contrast added to §5.1, which corrected two values this document had asserted —
light orange text was failing AA at 4.29:1, and brand green on the dark panel passes at 6.02:1
rather than failing as claimed, so the lifted green is a legibility choice rather than an
accessibility requirement.

**1.0 — 2026-08-13.** First edition, written alongside the audit.
