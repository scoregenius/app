// frontend/scripts/structured_data.mjs
//
// The single source of truth for the site's schema.org structured data.
//
// The marketing site is ten hand-written static HTML files with no templating
// layer, so the honest options were to paste the same Organization block into
// every one of them and watch it drift, or to describe the site once here and
// generate the blocks. This is the second option; `generate_structured_data.mjs`
// does the writing, and its `--check` mode fails the build gate if any page
// drifts from what this file says.
//
// Two rules govern what may go in here:
//
//   1. Nothing is asserted that the page does not actually say. No invented
//      ratings, no invented founding or publication dates, no FAQ entries that
//      are not visible on the page. Structured data that contradicts the page
//      is a manual-action risk, not an SEO win.
//   2. No individual is named. The graph identifies ScoreGenius the product and
//      the organization behind it — never a person and never a legal entity.
//      `about.html` gets an AboutPage whose mainEntity is the organization,
//      not a Person node.
//
// Every node carries a stable `@id` so the graph is a graph: pages reference
// the organization, the app and the website rather than restating them, and a
// search engine consolidating across pages sees one entity per `@id` instead of
// ten lookalike copies.

const SITE = "https://scoregenius.io";

// Stable node identifiers. Fragment `@id`s are hung off the site root rather
// than off each page, so `#organization` means the same node on all ten pages.
const ORGANIZATION_ID = `${SITE}/#organization`;
const WEBSITE_ID = `${SITE}/#website`;
const APP_ID = `${SITE}/#app`;
const LOGO_ID = `${SITE}/#logo`;
const AUDIENCE_ID = `${SITE}/#audience`;

// Store listings. The Samsung URL is the plain appDetail form: the one in the
// page footers carries badge-campaign tracking parameters, which do not belong
// in an identity graph that is meant to stay stable for years.
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=io.scoregenius.app";
const MICROSOFT_STORE_URL = "https://apps.microsoft.com/detail/9P843BS4GCGP";
const SAMSUNG_STORE_URL =
  "https://apps.samsung.com/appquery/appDetail.as?appId=io.scoregenius.app";

// Social profiles, from the footer's "Follow Us" block. These must match the
// links on the page exactly — `sameAs` is a claim that the profile belongs to
// this organization, and a search engine cross-checks it against what the page
// actually links to. The YouTube entry is the canonical handle URL; a bare
// `/scoregenius` channel form used to appear once in privacy.html.
const SOCIAL_PROFILES = [
  "https://x.com/scoregeniusapp",
  "https://www.youtube.com/@scoregenius",
];

const SUPPORT_EMAIL = "support@scoregenius.io";

// ---------------------------------------------------------------------------
// Shared entities
// ---------------------------------------------------------------------------

// Who we are. Description and slogan are lifted from copy that is actually on
// the site, so the markup and the visible page agree.
const organization = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "ScoreGenius",
  url: `${SITE}/`,
  logo: {
    "@type": "ImageObject",
    "@id": LOGO_ID,
    url: `${SITE}/images/scoregenius_logo.png`,
    contentUrl: `${SITE}/images/scoregenius_logo.png`,
    width: 512,
    height: 512,
    caption: "ScoreGenius",
  },
  image: { "@id": LOGO_ID },
  slogan: "For sports fans…by sports fans.",
  description:
    "ScoreGenius builds pregame score forecasts and advanced analytics for NFL, NBA and MLB games. A machine-learning pipeline turns historical and in-season data into daily predictions, head-to-head form, rest and momentum metrics, live betting markets and Edge signals — delivered ad-free, with no account and no personal identifiers.",
  email: SUPPORT_EMAIL,
  sameAs: SOCIAL_PROFILES,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: SUPPORT_EMAIL,
    url: `${SITE}/support`,
    availableLanguage: "English",
  },
  // What the organization is authoritative about. This is the plainest way to
  // tell a search engine — or a model summarising the site — what subject
  // matter ScoreGenius covers.
  knowsAbout: [
    "NFL score predictions",
    "NBA score predictions",
    "MLB score predictions",
    "Sports analytics",
    "Predictive modeling",
    "Machine learning",
    "Advanced basketball statistics",
    "Sabermetrics",
    "Betting odds analysis",
  ],
  publishingPrinciples: `${SITE}/disclaimer`,
  termsOfService: `${SITE}/terms`,
};

// Who we help. Answering this in the graph rather than only in prose is the
// point of the `audience` links below.
const audience = {
  "@type": "Audience",
  "@id": AUDIENCE_ID,
  audienceType: "Sports fans",
  name: "NFL, NBA and MLB fans, fantasy players and sports-analytics enthusiasts",
  geographicArea: {
    "@type": "Country",
    name: "United States",
  },
};

const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE}/`,
  name: "ScoreGenius",
  description:
    "Pregame NFL, NBA and MLB score forecasts, advanced statistics and live betting odds — free, ad-free and account-free.",
  publisher: { "@id": ORGANIZATION_ID },
  inLanguage: "en-US",
  // No `potentialAction`/SearchAction: the site has no search endpoint, and
  // declaring one that does not exist is the most common way this markup goes
  // wrong.
};

// What we do. Typed as all three application classes because it genuinely is
// all three: an installable PWA, a Play/Samsung Android app via Trusted Web
// Activity (and a Microsoft Store package), and a plain browser app.
//
// Deliberately absent: `aggregateRating`. The store ratings are real but they
// are not shown on this site, and rating markup that a visitor cannot see on
// the page is exactly what Google's structured-data policies prohibit.
const application = {
  "@type": ["SoftwareApplication", "MobileApplication", "WebApplication"],
  "@id": APP_ID,
  name: "ScoreGenius",
  url: `${SITE}/app`,
  applicationCategory: "SportsApplication",
  applicationSubCategory: "Sports analytics and score prediction",
  operatingSystem: "Android, iOS, Windows, macOS, Linux (any modern browser)",
  browserRequirements: "Requires JavaScript. Installable as a PWA.",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  installUrl: PLAY_STORE_URL,
  downloadUrl: PLAY_STORE_URL,
  sameAs: [PLAY_STORE_URL, MICROSOFT_STORE_URL, SAMSUNG_STORE_URL],
  featureList: [
    "Daily pregame score predictions for NFL, NBA and MLB",
    "Advanced team and player statistics by season",
    "Head-to-head form, rest and momentum metrics",
    "Live scores and injury status updates",
    "Gameday weather for NFL and MLB venues",
    "Moneyline, spread and totals odds for every covered game",
    "Edge signals comparing model probability to the vig-free market line",
    "Per-game Snapshots with charts and key insights",
    "Offline access to previously loaded data",
    "No ads, no accounts and no personal identifiers",
  ],
  softwareHelp: { "@id": `${SITE}/documentation#webpage` },
  publisher: { "@id": ORGANIZATION_ID },
  provider: { "@id": ORGANIZATION_ID },
  audience: { "@id": AUDIENCE_ID },
  inLanguage: "en-US",
};

// The product tour that plays on the home page: the 45-second cut of the
// walkthrough, mastered in docs/handover/video/. `uploadDate` is the date it
// went live on the page. Duration and dimensions come from the file itself
// (41.4s at 1920x1080), and `thumbnailUrl` is the frame the `poster` attribute
// paints, so the markup and what a visitor sees are the same image.
const tourVideo = {
  "@type": "VideoObject",
  "@id": `${SITE}/#tour-video`,
  name: "ScoreGenius product tour",
  description:
    "A short walkthrough of the ScoreGenius app: the day's NFL, NBA and MLB games with the model's score predictions, a head-to-head view behind one matchup, the player statistics table, and the light and dark themes.",
  thumbnailUrl: `${SITE}/media/scoregenius_walkthrough_poster.jpg`,
  uploadDate: "2026-08-18",
  duration: "PT41S",
  contentUrl: `${SITE}/media/scoregenius_walkthrough_45s.mp4`,
  encodingFormat: "video/mp4",
  width: 1920,
  height: 1080,
  isFamilyFriendly: true,
  inLanguage: "en-US",
  publisher: { "@id": ORGANIZATION_ID },
  about: { "@id": APP_ID },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Breadcrumbs are emitted for the sub-pages only. A single-item breadcrumb on
// the home page carries no information and Google ignores it.
function breadcrumb(pageUrl, pageName) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pageName,
        item: pageUrl,
      },
    ],
  };
}

// Every FAQ entry below is copied from text visible on the page it is attached
// to. Google narrowed FAQ *rich results* to health and government sites in
// 2023, so this is not chasing a snippet — it is machine-readable Q&A for the
// search and assistant surfaces that do still read it.
function faq(pageUrl, entries) {
  return {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.a,
      },
    })),
  };
}

// The metric glossaries on /documentation and /betting_odds are the most
// distinctive content on the site — definitions nobody else words the same way.
// DefinedTermSet is what schema.org has for exactly this.
function definedTerms(pageUrl, setName, setDescription, terms) {
  const setId = `${pageUrl}#glossary`;
  return [
    {
      "@type": "DefinedTermSet",
      "@id": setId,
      name: setName,
      description: setDescription,
      url: pageUrl,
      inLanguage: "en-US",
      hasDefinedTerm: terms.map((term) => ({
        "@id": `${setId}-${term.slug}`,
      })),
    },
    ...terms.map((term) => ({
      "@type": "DefinedTerm",
      "@id": `${setId}-${term.slug}`,
      name: term.name,
      description: term.description,
      inDefinedTermSet: { "@id": setId },
    })),
  ];
}

// The WebPage node every page shares. `type` lets a page narrow itself to
// AboutPage/ContactPage/etc.; `extra` carries the page-specific links.
function webPage({ url, name, description, type = "WebPage", extra = {} }) {
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    primaryImageOfPage: { "@id": LOGO_ID },
    inLanguage: "en-US",
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Page graphs
// ---------------------------------------------------------------------------

// `targets` are the files each graph is written into, relative to `frontend/`.
// The home page has two: `public/index.html` is what ships, and `home.html` is
// a byte-identical copy at the frontend root that has been edited in lockstep
// with it through the site's whole history. Generating both keeps that true.
export const PAGES = [
  {
    id: "home",
    targets: ["public/index.html", "home.html"],
    url: `${SITE}/`,
    graph: [
      organization,
      website,
      audience,
      application,
      tourVideo,
      webPage({
        url: `${SITE}/`,
        name: "ScoreGenius – Powerful Predictive Stats for Passionate Sports Fans",
        description:
          "Daily pregame score forecasts and advanced head-to-head analytics for NFL, NBA and MLB, powered by a machine-learning pipeline. No ads, no sign-ups, no account required.",
        extra: {
          mainEntity: { "@id": APP_ID },
          audience: { "@id": AUDIENCE_ID },
          video: { "@id": `${SITE}/#tour-video` },
          significantLink: [
            `${SITE}/app`,
            `${SITE}/documentation`,
            `${SITE}/betting_odds`,
          ],
        },
      }),
    ],
  },

  {
    id: "app",
    targets: ["app.html"],
    url: `${SITE}/app`,
    graph: [
      organization,
      website,
      audience,
      application,
      webPage({
        url: `${SITE}/app`,
        name: "ScoreGenius – Powerful Predictive Stats for Passionate NFL, NBA and MLB Fans",
        description:
          "The ScoreGenius app: daily pregame forecasts, betting edge signals and advanced analytics in an ad-free, data-safe progressive web app.",
        extra: {
          mainEntity: { "@id": APP_ID },
          audience: { "@id": AUDIENCE_ID },
        },
      }),
    ],
  },

  {
    id: "about",
    targets: ["public/about.html"],
    url: `${SITE}/about`,
    graph: [
      organization,
      website,
      // AboutPage, and its mainEntity is the organization — never a person.
      webPage({
        url: `${SITE}/about`,
        name: "About ScoreGenius",
        description:
          "Why ScoreGenius exists: transparent, data-driven insight for sports fans, powered by an end-to-end data pipeline built and maintained in-house — from ingestion and modeling through to delivery in the app.",
        type: "AboutPage",
        extra: {
          mainEntity: { "@id": ORGANIZATION_ID },
          breadcrumb: { "@id": `${SITE}/about#breadcrumb` },
        },
      }),
      breadcrumb(`${SITE}/about`, "About"),
    ],
  },

  {
    id: "documentation",
    targets: ["public/documentation.html"],
    url: `${SITE}/documentation`,
    graph: [
      organization,
      website,
      audience,
      application,
      webPage({
        url: `${SITE}/documentation`,
        name: "ScoreGenius Documentation",
        description:
          "Overview, usage tips and metric definitions for the ScoreGenius NFL, NBA and MLB analytics app — the Teams, Players and Advanced tabs, and the per-game Snapshots view.",
        type: "TechArticle",
        extra: {
          headline: "ScoreGenius Documentation",
          mainEntityOfPage: `${SITE}/documentation`,
          author: { "@id": ORGANIZATION_ID },
          publisher: { "@id": ORGANIZATION_ID },
          about: { "@id": APP_ID },
          audience: { "@id": AUDIENCE_ID },
          breadcrumb: { "@id": `${SITE}/documentation#breadcrumb` },
          hasPart: { "@id": `${SITE}/documentation#glossary` },
          articleSection: [
            "Purpose & Usage",
            "Teams Tab",
            "Players Tab",
            "Advanced Stats",
            "Snapshots",
          ],
        },
      }),
      breadcrumb(`${SITE}/documentation`, "Documentation"),
      ...definedTerms(
        `${SITE}/documentation`,
        "ScoreGenius Metric Definitions",
        "How ScoreGenius computes each team, player and advanced metric shown in the app.",
        [
          {
            slug: "win-percentage",
            name: "Win %",
            description:
              "wins_all_percentage — wins divided by games played, for the selected team and season.",
          },
          {
            slug: "avg-points-for",
            name: "Average Points For / Runs For",
            description:
              "points_for_avg_all (NBA) or runs_for_avg_all (MLB) — total points or runs scored divided by games played.",
          },
          {
            slug: "avg-points-against",
            name: "Average Points Against / Runs Against",
            description:
              "points_against_avg_all (NBA) or runs_against_avg_all (MLB) — total points or runs allowed divided by games played.",
          },
          {
            slug: "streak",
            name: "Streak",
            description:
              "current_form — the team's active run of wins or losses, expressed as a W or L streak count.",
          },
          {
            slug: "pace",
            name: "Pace",
            description:
              "NBA advanced metric: possessions per 48 minutes, a measure of game tempo.",
          },
          {
            slug: "offensive-rating",
            name: "Offensive Rating (OffRtg)",
            description:
              "NBA advanced metric: points scored per 100 possessions.",
          },
          {
            slug: "defensive-rating",
            name: "Defensive Rating (DefRtg)",
            description:
              "NBA advanced metric: points allowed per 100 possessions.",
          },
          {
            slug: "efg-pct",
            name: "Effective Field Goal % (eFG%)",
            description:
              "efg_pct — (field goals made + 0.5 × three-pointers made) divided by field goals attempted, times 100.",
          },
          {
            slug: "tov-pct",
            name: "Turnover % (TOV%)",
            description:
              "tov_pct — turnovers divided by possessions, times 100.",
          },
          {
            slug: "oreb-pct",
            name: "Offensive Rebound % (ORB%)",
            description:
              "oreb_pct — offensive rebounds divided by the sum of offensive rebounds and opponent defensive rebounds, times 100.",
          },
          {
            slug: "pythagorean-win-pct",
            name: "Pythagorean Win %",
            description:
              "pythagorean_win_pct — runs for squared, divided by the sum of runs for squared and runs against squared, times 100. The win rate a team's run scoring and prevention imply.",
          },
          {
            slug: "run-differential",
            name: "Run Differential",
            description:
              "run_differential — runs scored minus runs allowed across the season; run_differential_avg divides that by games played.",
          },
          {
            slug: "luck-factor",
            name: "Luck Factor",
            description:
              "luck_factor — actual wins minus expected wins, the gap between a team's record and what its run differential predicts.",
          },
          {
            slug: "snapshots",
            name: "Snapshots",
            description:
              "A per-game breakdown for MLB and NBA matchups: key insights such as rest advantage and form differential, bar, radar and pie charts, MLB handedness splits against left- and right-handed pitching, and NBA pace, offensive and defensive rating, eFG% and TOV% in a radar view.",
          },
        ]
      ),
    ],
  },

  {
    id: "betting_odds",
    targets: ["public/betting_odds.html"],
    url: `${SITE}/betting_odds`,
    graph: [
      organization,
      website,
      audience,
      application,
      webPage({
        url: `${SITE}/betting_odds`,
        name: "Betting Odds and Edge Insights – ScoreGenius",
        description:
          "Live NFL, NBA and MLB moneyline, spread and totals odds shown next to ScoreGenius pregame projections, plus Edge signals that measure where the model's probability diverges from the vig-free market line.",
        extra: {
          about: { "@id": APP_ID },
          audience: { "@id": AUDIENCE_ID },
          breadcrumb: { "@id": `${SITE}/betting_odds#breadcrumb` },
          mentions: { "@id": `${SITE}/betting_odds#glossary` },
          // Predictions are entertainment, not advice, and the disclaimer is
          // the page that says so.
          significantLink: [`${SITE}/disclaimer`, `${SITE}/documentation`],
        },
      }),
      breadcrumb(`${SITE}/betting_odds`, "Betting Odds"),
      faq(`${SITE}/betting_odds`, [
        {
          q: "Do odds update in real time?",
          a: "Odds refresh periodically on the Games screen. Lines can move — open the matchup to see the latest markets next to our projection.",
        },
        {
          q: "Do you show moneyline, spread, and totals for every game?",
          a: "Yes — when markets are available for that matchup, we display all three alongside our predicted score.",
        },
        {
          q: "What does “Edge” actually mean?",
          a: "It is the gap between our model's probability and the sportsbook's vig-free probability. For moneyline that means comparing win probabilities; for spread it means cover probabilities. We flag the edge as Low, Medium or High based on statistical thresholds.",
        },
        {
          q: "Where can I learn more?",
          a: "See the ScoreGenius documentation for feature details, or the disclaimer for important usage notes.",
        },
      ]),
      ...definedTerms(
        `${SITE}/betting_odds`,
        "ScoreGenius Betting Glossary",
        "The betting-market terms ScoreGenius displays alongside its pregame projections.",
        [
          {
            slug: "moneyline",
            name: "Moneyline",
            description:
              "Odds to win the game outright, for example -145 for the favorite and +125 for the underdog.",
          },
          {
            slug: "spread",
            name: "Spread",
            description:
              "The point handicap applied to the favorite; a team must cover that margin for a spread wager to win.",
          },
          {
            slug: "total",
            name: "Total (Over/Under)",
            description:
              "The combined score line for both teams; a wager selects over or under that number.",
          },
          {
            slug: "implied-probability",
            name: "Implied Probability",
            description:
              "The probability a line represents once converted from moneyline odds — the base ScoreGenius compares its model probability against.",
          },
          {
            slug: "edge",
            name: "Edge",
            description:
              "The ScoreGenius signal: model probability minus the market's vig-free probability, graded High at an edge of 5% or more with a z-score of at least 0.75, Medium at 3% and 0.5, Low at 1.5% and 0.25, and No Value below that.",
          },
        ]
      ),
    ],
  },

  {
    id: "support",
    targets: ["public/support.html"],
    url: `${SITE}/support`,
    graph: [
      organization,
      website,
      // Both a contact page and an FAQ page, which is what the page is.
      webPage({
        url: `${SITE}/support`,
        name: "ScoreGenius Support",
        description:
          "Help with ScoreGenius: how to install the app, a quick start guide, answers to common questions about predictions and offline use, troubleshooting steps, and how to reach support.",
        type: ["ContactPage", "WebPage"],
        extra: {
          mainEntity: { "@id": ORGANIZATION_ID },
          breadcrumb: { "@id": `${SITE}/support#breadcrumb` },
          significantLink: [PLAY_STORE_URL, MICROSOFT_STORE_URL, SAMSUNG_STORE_URL],
        },
      }),
      breadcrumb(`${SITE}/support`, "Support"),
      faq(`${SITE}/support`, [
        {
          q: "How often are predictions updated?",
          a: "Predictions are generated before each game and refresh daily as new data arrives. Once a game starts, its predicted scores are cleared — ScoreGenius does not update predictions during play.",
        },
        {
          q: "How accurate are the predictions?",
          a: "Predictions come from statistical models trained on historical results and evaluated on games the models had not seen. They are estimates, not certainties, and are provided for information and entertainment only.",
        },
        {
          q: "Does ScoreGenius offer betting advice?",
          a: "No. ScoreGenius shows posted odds and its own predictions side by side for informational and educational purposes only. It does not accept wagers, facilitate gambling, or recommend bets.",
        },
        {
          q: "Does the app work offline?",
          a: "Yes. Previously loaded games, stats and predictions are cached for offline viewing; new data requires an internet connection.",
        },
      ]),
    ],
  },

  {
    id: "privacy",
    targets: ["public/privacy.html"],
    url: `${SITE}/privacy`,
    graph: [
      organization,
      website,
      webPage({
        url: `${SITE}/privacy`,
        name: "ScoreGenius Privacy Policy",
        description:
          "ScoreGenius has no accounts and never asks for your name, email address or any other personal identifier. The app collects no analytics; this website uses Google Analytics to measure visits, and nothing is sold, rented or shared for advertising.",
        extra: {
          breadcrumb: { "@id": `${SITE}/privacy#breadcrumb` },
          // From the "Last updated" line on the page itself.
          dateModified: "2026-08-11",
        },
      }),
      breadcrumb(`${SITE}/privacy`, "Privacy Policy"),
    ],
  },

  {
    id: "terms",
    targets: ["public/terms.html"],
    url: `${SITE}/terms`,
    graph: [
      organization,
      website,
      webPage({
        url: `${SITE}/terms`,
        name: "ScoreGenius Terms of Service",
        description:
          "The terms governing use of ScoreGenius: personal non-commercial use, how analytics and predictions are provided, limitation of liability, termination and governing law.",
        extra: {
          breadcrumb: { "@id": `${SITE}/terms#breadcrumb` },
          dateModified: "2025-04-30",
        },
      }),
      breadcrumb(`${SITE}/terms`, "Terms of Service"),
    ],
  },

  {
    id: "disclaimer",
    targets: ["public/disclaimer.html"],
    url: `${SITE}/disclaimer`,
    graph: [
      organization,
      website,
      webPage({
        url: `${SITE}/disclaimer`,
        name: "ScoreGenius Disclaimer",
        description:
          "ScoreGenius predictions, statistics and analysis are provided for entertainment and educational purposes only. They are not professional advice, outcomes may differ from forecasts, and any betting or financial decision is taken at the user's own risk.",
        extra: {
          breadcrumb: { "@id": `${SITE}/disclaimer#breadcrumb` },
          dateModified: "2025-04-30",
        },
      }),
      breadcrumb(`${SITE}/disclaimer`, "Disclaimer"),
    ],
  },

  {
    id: "404",
    targets: ["public/404.html"],
    url: `${SITE}/404`,
    // Identity only. A 404 is served for URLs that do not exist, so giving it a
    // WebPage node would be asserting that a page exists at whatever address
    // produced the error — the one page on the site where the shared entities
    // are worth carrying and a page-level claim is not. It has no canonical tag
    // for the same reason.
    graph: [organization, website],
  },
];

export const SHARED = { organization, website, application, audience };
export const CONSTANTS = { SITE, ORGANIZATION_ID, WEBSITE_ID, APP_ID };
