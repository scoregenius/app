// frontend/src/screens/more_screen.tsx
import React from "react";
import {
  Info,
  BookOpen,
  ShieldCheck,
  FileText,
  Instagram,
  Twitter,
  Youtube,
  Bug,
  MessageSquareText,
  LifeBuoy,
  RotateCcw,
  SunMoon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import ThemeControl from "@/components/ui/theme_control";
import {
  ListGroup,
  LinkRow,
  ActionRow,
  SettingRow,
  TileGroup,
  Tile,
} from "@/components/ui/list_row";
import { useTour } from "@/contexts/tour_context";
import { useOnline } from "@/contexts/online_context";
import { OfflineNotice } from "@/components/offline_centered";

/**
 * More. See docs/design_system.md §8.4.
 *
 * Every row comes from the §6.12 list-row component. The screen used to
 * hand-roll two of its own over `bg-white`, `border-slate-300` and
 * `dark:bg-[var(--color-panel)]` — stock ramps mixed with the previous
 * generation of tokens, while the offline notice directly above them was
 * already on the v1 set. The two panels were four hex values apart,
 * which read as a rendering fault rather than a decision.
 *
 * **The controls come first.** Two of the fourteen rows do something in
 * the app; the other twelve leave it. Appearance and the tour therefore
 * lead, and the reference links follow. It also means the guided tour's
 * final step lands on something already in view.
 *
 * The guided-tour anchor `data-tour="theme-toggle"` is carried by
 * `ThemeControl` on both branches below — see §6.10 and the comment in
 * that file, because a grep for the literal no longer finds it here.
 */

/** Both branches render this, so the section is defined once. */
const APPEARANCE_HEADING = "Appearance and options";

/**
 * Stamped in by `define` in vite.config.ts, sourced from package.json.
 * Rendered unconditionally and on both branches. It used to sit behind
 * a truthiness check on the value, and because nothing ever set that
 * variable the check was never true and the line never appeared. A guard
 * here would put that back, so there is none — if the define is dropped this
 * renders visibly wrong rather than silently vanishing, and
 * `version_stamp.test.mjs` fails first.
 */
const VersionLine: React.FC = () => (
  <p className="mor-ver">ScoreGenius v{import.meta.env.VITE_APP_VERSION}</p>
);

const MoreScreen: React.FC = () => {
  const online = useOnline();

  /* Both branches need these, so they are read before the offline
   * return. They used to sit after it, which made them conditional, and
   * the offline branch reached useTour() a second way — from inside an
   * onClick, which throws the moment the button is pressed. */
  const { start } = useTour();
  const navigate = useNavigate();

  /**
   * The tour's second step targets a game card, which exists only on the
   * Games screen. Starting from here without moving first left that step
   * with nothing to point at, and the tooltip's fallback then claimed
   * "No games scheduled for this date" — which is not what had happened.
   */
  const handleStartTour = () => {
    navigate("/games");
    start();
  };

  const appearance = (
    <section className="mor-sec">
      <h2 className="mor-h2">{APPEARANCE_HEADING}</h2>
      <ListGroup>
        <SettingRow label="Theme" icon={SunMoon} className="mor-theme">
          <ThemeControl />
        </SettingRow>
        <ActionRow
          label="Restart the tour"
          icon={RotateCcw}
          onClick={handleStartTour}
        />
      </ListGroup>
    </section>
  );

  if (!online) {
    /* The screen still has something worth showing, so the notice is
     * inline (§6.9) and the two controls that need no connection stay.
     * Everything else on this screen is a link off it. */
    return (
      <div className="mor">
        <h1 className="mor-title">More</h1>
        <OfflineNotice>
          External links and support pages need a connection. You can still
          change the theme and restart the tour.
        </OfflineNotice>
        {appearance}
        <VersionLine />
      </div>
    );
  }

  return (
    <div className="mor">
      <h1 className="mor-title">More</h1>

      {appearance}

      <section className="mor-sec">
        <h2 className="mor-h2">Feedback and support</h2>
        <ListGroup>
          <LinkRow
            href="mailto:support@scoregenius.io?subject=Bug%20Report"
            label="Report a bug"
            icon={Bug}
          />
          <LinkRow
            href="mailto:support@scoregenius.io?subject=Feature%20Request"
            label="Request a feature"
            icon={MessageSquareText}
          />
          <LinkRow
            href="https://scoregenius.io/support"
            label="Support"
            icon={LifeBuoy}
          />
        </ListGroup>
      </section>

      <section className="mor-sec">
        <h2 className="mor-h2">Information</h2>
        <ListGroup>
          <LinkRow
            href="https://scoregenius.io"
            label="About ScoreGenius"
            icon={Info}
          />
          <LinkRow
            href="https://scoregenius.io/documentation"
            label="Documentation"
            icon={BookOpen}
          />
          <LinkRow
            href="https://scoregenius.io/disclaimer"
            label="Disclaimer"
            icon={ShieldCheck}
          />
          <LinkRow
            href="https://scoregenius.io/terms"
            label="Terms of Service"
            icon={ShieldCheck}
          />
          <LinkRow
            href="https://scoregenius.io/privacy"
            label="Privacy Policy"
            icon={FileText}
          />
        </ListGroup>
      </section>

      {/* One handle, three services. Carried in the accessible name
          rather than repeated down the visible labels. */}
      <section className="mor-sec">
        <h2 className="mor-h2">Connect with us</h2>
        <ListGroup>
          <TileGroup>
            <Tile
              href="https://instagram.com/scoregeniusapp"
              label="Instagram"
              icon={Instagram}
              ariaLabel="Instagram, @scoregeniusapp"
            />
            <Tile
              href="https://x.com/scoregeniusapp"
              label="X"
              icon={Twitter}
              ariaLabel="X, formerly Twitter, @scoregeniusapp"
            />
            <Tile
              href="https://youtube.com/@scoregenius"
              label="YouTube"
              icon={Youtube}
              ariaLabel="YouTube, @scoregenius"
            />
          </TileGroup>
        </ListGroup>
      </section>

      <VersionLine />
    </div>
  );
};

export default MoreScreen;
