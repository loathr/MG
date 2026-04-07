// Enterprise segment — B&W business/industry analysis
export var ENTERPRISE_ID = "enterprise";
export var ENTERPRISE_LABEL = "Enterprise";

export var ENTERPRISE_FORCES = [
  { id: "tech", label: "Tech Disruption" },
  { id: "policy", label: "Policy & Regulation" },
  { id: "ai", label: "AI & Automation" },
  { id: "markets", label: "Market Trends" },
  { id: "culture", label: "Culture Shift" },
  { id: "media", label: "Media & Entertainment" },
  { id: "education", label: "Education" },
  { id: "stocks", label: "Stock Market" },
  { id: "lifestyle", label: "Lifestyle & Consumer" },
  { id: "news", label: "Breaking News" },
];

export var ENTERPRISE_PALETTE = {
  bg: "#0a0a0a",
  accent: "#ffffff",
  accent2: "#888888",
  text: "#ffffff",
};

export var ENTERPRISE_THEME = {
  pageBg: "#0a0a0a",
  pageText: "#eeeeee",
  uiBg: "#111111",
  uiText: "#dddddd",
  uiBorder: "#333333",
  buttonBg: "transparent",
  buttonBorder: "#555555",
  buttonText: "#cccccc",
  buttonActiveBg: "#ffffff22",
  buttonActiveText: "#ffffff",
  inputBg: "#1a1a1a",
  inputBorder: "#333333",
  inputText: "#eeeeee",
  panelBg: "#111111",
};

export var ENTERPRISE_DESIGN = {
  imageFilter: "grayscale(1) contrast(1.1) brightness(0.85)",
  containers: ["formal", "minimal", "glass"], // only these allowed
  borderColor: "#ffffff",
  borderWidth: 1,
  accentBorderColor: "#ffffff",
  fontHeading: "'Foun',Georgia,serif",
  fontBody: "'Maheni',Georgia,serif",
  mosaicGap: 2,
  mosaicGapColor: "#ffffff",
  watermarkColor: "#ffffff66",
  coverDarken: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.95))",
};

export var ENTERPRISE_SLIDE_ROLES = [
  "COVER", "THE LANDSCAPE", "THE FORCE", "THE IMPACT",
  "THE WINNERS", "THE LOSERS", "THE DATA", "THE PLAYBOOK",
  "THE FORECAST", "CLOSER"
];

export var ENTERPRISE_CLOSERS = [
  "Not financial advice. We can barely manage our own subscriptions.",
  "Disclaimer: Our crystal ball is in the shop. Consult actual professionals.",
  "For entertainment only. Our lawyers made us say that.",
  "Not responsible for any pivot decisions made at 2am after reading this.",
  "Educational purposes only. We're journalists, not your accountant.",
  "If we could predict the market, we wouldn't be making carousels.",
  "Take this with a grain of salt. And maybe a whole salt mine.",
  "Past performance does not guarantee we know what we're talking about.",
];

export function buildEnterprisePrompt(topic, force, editionSeed, picks) {
  var forceLabel = force ? force.label : "macro trends";
  var closerLine = ENTERPRISE_CLOSERS[Math.abs(editionSeed || 0) % ENTERPRISE_CLOSERS.length];

  return "You are a senior business analyst writing for LOATHR ENTERPRISE, a black-and-white editorial Instagram brand focused on business intelligence.\n\n" +
    "Industry/Topic: \"" + topic + "\"\n" +
    "Force: \"" + forceLabel + "\"\n\n" +
    "Write a carousel analyzing how " + forceLabel.toLowerCase() + " impacts this industry/topic.\n" +
    "Use REAL company names, REAL numbers, REAL market data. Every claim must be specific and citable.\n" +
    "Use web search to find current data when available.\n\n" +
    "SLIDE COUNT: 8-10 slides.\n\n" +
    "WRITING RULES:\n" +
    "- Every slide must have a 'sources' field with 1-2 real citations\n" +
    "- Use specific numbers: revenue figures, market share %, growth rates\n" +
    "- Name real companies, real executives, real products\n" +
    "- NEVER use the word 'algorithm' or cliché phrases\n" +
    "- Keep body text to 2-3 sentences MAX per slide\n" +
    "- If you mention a person's full name, add a 'person' field\n\n" +
    "SLIDE ROLES (in order):\n" +
    "- FIRST SLIDE: \"COVER\" — title, titleHighlight (exact substring to emphasize), subtitle\n" +
    "- \"THE LANDSCAPE\" — current state of the industry. heading, body, highlight, sources\n" +
    "- \"THE FORCE\" — what's disrupting/changing it. heading, body, highlight, sources\n" +
    "- \"THE IMPACT\" — what's already changed, evidence. heading, body, highlight, sources\n" +
    "- \"THE WINNERS\" — who's benefiting, adapting. heading, body, highlight, sources\n" +
    "- \"THE LOSERS\" — who's threatened, displaced. heading, body, highlight, sources\n" +
    "- \"THE DATA\" — key statistic. Use statFormat \"killer\" with stat and caption. sources\n" +
    "- \"THE PLAYBOOK\" — 3-5 numbered actionable steps. heading, body (numbered list), sources. Each step specific enough to act on this week.\n" +
    "- \"THE FORECAST\" — prediction for 2-5 years. heading, body, highlight, sources\n" +
    "- LAST SLIDE: \"CLOSER\" — hashtags string. MUST include in the slide data: funnyLine: \"" + closerLine + "\", disclaimer: \"This carousel is for entertainment and educational purposes only. Not professional advice.\"\n\n" +
    "TEXT PLACEMENT: On each content slide, include a 'textPosition' field. Options: 'bottom-left', 'bottom-right', 'top-left', 'top-right', 'split-corners', 'side-left', 'side-right', 'l-shape'.\n\n" +
    "On 2-3 content slides, add '\"mosaic\": true' for photo collage backgrounds.\n\n" +
    "Respond ONLY with valid JSON, no markdown:\n{\"angle\":\"Enterprise Analysis\",\"slides\":[{...slides...}]}";
}
