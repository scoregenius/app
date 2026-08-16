// frontend/src/screens/how_to_use_screen.tsx
import React, { useState } from "react";
import { HelpCircle, Play, ArrowRight, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTour } from "@/contexts/tour_context";
import SnapshotModal from "@/components/games/snapshot_modal";
import { useOnline } from "@/contexts/online_context";
import { OfflineNotice } from "@/components/offline_centered";
import TeamRow from "@/components/games/team_row";
import EdgeChip from "@/components/games/edge_chip";
import MarketStrip from "@/components/games/market_strip";
import { marketSegments } from "@/utils/market";

/**
 * The guide. See docs/design_system.md §8.3.
 *
 * Structured to teach the card before the navigation, because the card is
 * where the product's output actually lives and a reader's first question
 * is what they are looking at, not how to switch sports. The numbered
 * timeline is kept for the navigation, where the steps genuinely are
 * sequential.
 *
 * **The specimen is built from the real card's own components** —
 * TeamRow, EdgeChip, MarketStrip and the gc- stylesheet — rather than
 * redrawn here. This screen went stale in the first place because it
 * described a card that had been rebuilt underneath it, so the parts that
 * can share code do. What is still a copy is the arrangement of those
 * parts and the wording, so a structural change to the card does still
 * need an edit here.
 */

/** Fixed demo values. Not a real fixture — chosen to show every part at once. */
const DEMO_SEGMENTS = marketSegments({
  moneylineAway: 118,
  moneylineHome: -140,
  spreadLine: -1.5,
  totalLine: 8.5,
});

const CardSpecimen: React.FC = () => (
  <article className="gc gc--high" aria-hidden="true">
    <div className="gc-rail">
      <EdgeChip tier="HIGH" teamAbbr="CHC" />
      <span className="gc-time">2:20 PM</span>
    </div>

    <TeamRow
      abbr="STL"
      teamName="St. Louis Cardinals"
      value="3.8"
      faded
    />
    <TeamRow abbr="CHC" teamName="Chicago Cubs" value="4.7" isPick />

    <div className="gc-foot">
      <span className="gc-chev">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="gc-chev-label">More</span>
      </span>
      <MarketStrip segments={DEMO_SEGMENTS} />
    </div>

    <div className="gc-exp">
      <div className="gc-chips">
        <span className="gc-chip">
          <BarChart3 size={13} strokeWidth={1.8} aria-hidden="true" />
          H2H Stats
        </span>
        <span className="gc-chip">70°F · 2mph</span>
      </div>
    </div>
  </article>
);

const HowToUseScreen: React.FC = () => {
  // Hooks run unconditionally, above the offline branch.
  const online = useOnline();
  const { start } = useTour();
  const navigate = useNavigate();
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);

  const handleStartTour = () => {
    navigate("/games");
    start();
  };

  return (
    <>
      <section
        className="
          contain-layout w-full px-4 sm:px-6 md:px-8 lg:px-10
          2xl:max-w-4xl 2xl:mx-auto
          pb-[env(safe-area-inset-bottom)]
          pt-[calc(env(safe-area-inset-top)+1rem)]
          sm:pt-[calc(env(safe-area-inset-top)+1.5rem)]
          md:pt-[calc(env(safe-area-inset-top)+2rem)]
          overflow-x-hidden box-border
        "
      >
        <header>
          <h1 className="htu-title">
            <HelpCircle
              size={19}
              strokeWidth={1.8}
              className="stroke-[var(--green-text)]"
              aria-hidden="true"
            />
            How to use ScoreGenius
          </h1>
          <p className="htu-sub">
            ScoreGenius predicts a score for every game, then compares that
            prediction against the betting market. Everything on screen serves
            one question: which of today’s games are worth a closer look.
          </p>
        </header>

        {/* The guide itself is static prose and works offline. Only the
            snapshot demo and the tour need a connection, so the notice sits
            inline and the two controls below are disabled rather than the
            whole screen being replaced. */}
        {!online && (
          <div className="mt-6">
            <OfflineNotice>
              The snapshot demo and the tour need a connection. The rest of this
              guide works as it is.
            </OfflineNotice>
          </div>
        )}

        {/* ---------- reading a card ---------- */}
        <section className="htu-sec">
          <div className="htu-eyebrow">Reading a game card</div>
          <div className="htu-anno">
            <CardSpecimen />
            <ul className="htu-anno-list">
              <li>
                <span className="htu-anno-k">The two numbers</span>
                <span className="htu-anno-v">
                  The model’s <strong>predicted score</strong> for each team.
                  They appear before a game starts and clear once it does.
                </span>
              </li>
              <li>
                <span className="htu-anno-k">The green triangle</span>
                <span className="htu-anno-v">
                  Marks the side the model favours. That row keeps full
                  contrast and the other recedes. On an exact tie neither is
                  marked.
                </span>
              </li>
              <li>
                <span className="htu-anno-k">The edge chip</span>
                <span className="htu-anno-v">
                  <strong>High</strong>, <strong>Medium</strong> or{" "}
                  <strong>Low edge</strong>, naming a team. It says the model
                  and the market disagree, and roughly by how much. Most cards
                  have none — that is the point.
                </span>
              </li>
              <li>
                <span className="htu-anno-k">The bottom line</span>
                <span className="htu-anno-v">
                  Moneyline, spread and total as posted. Anything not yet
                  priced is left out rather than shown empty.
                </span>
              </li>
              <li>
                <span className="htu-anno-k">More</span>
                <span className="htu-anno-v">
                  Opens the rest: the lean bar, probable pitchers on MLB, and
                  the chips. Tapping the card does the same. On a wide screen
                  cards are already open.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* ---------- getting around ---------- */}
        <section className="htu-sec">
          <div className="htu-eyebrow">Getting around</div>
          <ol className="htu-ol">
            <li className="htu-li">
              <span className="htu-num">1</span>
              <h2 className="htu-h2">Sport and date</h2>
              <p className="htu-p">
                <strong>MLB</strong>, <strong>NBA</strong> and{" "}
                <strong>NFL</strong> sit in the header. The date control on the
                bar below changes which day’s games you see.
              </p>
            </li>

            <li className="htu-li">
              <span className="htu-num">2</span>
              <h2 className="htu-h2">The chips on an open card</h2>
              <p className="htu-p">
                <strong>H2H Stats</strong> opens the statistical snapshot for
                the matchup. The weather chip gives conditions at the venue and
                reads <strong>Roof closed</strong> where it is covered —
                basketball has none. <strong>Injuries</strong> is on NFL and
                NBA.
              </p>
              <button
                type="button"
                onClick={() => setIsSnapshotOpen(true)}
                disabled={!online}
                className="htu-cta mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                View a snapshot
                <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>

            <li className="htu-li">
              <span className="htu-num">3</span>
              <h2 className="htu-h2">Stats</h2>
              <p className="htu-p">
                Rankings for teams, and players on NBA, with an{" "}
                <strong>Advanced</strong> view for the derived metrics. Any
                column header sorts the table; press it again to reverse the
                order.
              </p>
            </li>
          </ol>
        </section>

        {/* ---------- honest limits ----------
            §4 exists because the code implies otherwise and has already
            misled a reader on this project. A sports app trains people to
            expect a live feed; saying plainly that there is not one costs a
            few lines and prevents the single most common wrong belief. */}
        <div className="htu-limits">
          <div className="htu-eyebrow" style={{ marginBottom: 2 }}>
            What the app does not do
          </div>
          <ul>
            <li>
              No live scores, innings, quarters or clock. A game is scheduled,
              in progress, or final.
            </li>
            <li>
              Predictions are for games that have not started. Once one has,
              the scores clear.
            </li>
            <li>
              A prediction is a model output, not a tip. The edge tier compares
              it against the market; it is not a probability the app can stand
              behind.
            </li>
          </ul>
        </div>

        <div className="pb-8">
          <button
            type="button"
            onClick={handleStartTour}
            disabled={!online}
            className="htu-cta disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={15} strokeWidth={2.2} aria-hidden="true" />
            Start the tour
          </button>
        </div>
      </section>

      {isSnapshotOpen && (
        <SnapshotModal
          onClose={() => setIsSnapshotOpen(false)}
          gameId="17342"
          sport="NFL"
        />
      )}
    </>
  );
};

export default HowToUseScreen;
