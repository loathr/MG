// Enterprise segment — B&W business/industry analysis
export var ENTERPRISE_ID = "enterprise";
export var ENTERPRISE_LABEL = "Enterprise";

export var ENTERPRISE_MODES = [
  { id: "analysis", label: "Analysis" },
  { id: "news", label: "Business News" },
  { id: "tips", label: "Industry Tips" },
];

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
  imageFilter: "none",
  containers: ["formal", "minimal", "glass"], // only these allowed
  borderColor: "#ffffff",
  borderWidth: 1,
  accentBorderColor: "#ffffff",
  fontHeading: "'Otilito','Foun',sans-serif",
  fontBody: "'Qogee','Maheni',serif",
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

export var ENTERPRISE_DEPTHS = [
  { id: "brief", label: "Quick Brief", slides: 5, desc: "5 slides — key takeaway only" },
  { id: "standard", label: "Standard", slides: 8, desc: "8 slides — full analysis" },
  { id: "deep", label: "Deep Dive", slides: 10, desc: "10 slides — comprehensive" },
];

export var ENTERPRISE_TONES = [
  { id: "neutral", label: "Neutral", prompt: "Present the analysis objectively. Balance opportunities and risks equally." },
  { id: "bullish", label: "Bullish", prompt: "Frame the analysis optimistically. Emphasize opportunities, growth, and upside potential." },
  { id: "bearish", label: "Bearish", prompt: "Frame the analysis cautiously. Emphasize risks, threats, and potential downside." },
  { id: "cautious", label: "Cautious", prompt: "Present a balanced but risk-aware analysis. Acknowledge opportunities but emphasize due diligence." },
];

export var ENTERPRISE_FOCUS = [
  { id: "data", label: "Data-Heavy", prompt: "Lead every slide with specific numbers, percentages, and statistics. Data drives the narrative." },
  { id: "narrative", label: "Narrative", prompt: "Tell the story behind the data. Use real people, real companies, real decisions as the through-line." },
  { id: "action", label: "Action-Oriented", prompt: "Every slide should point toward what a business should DO. The Playbook is the centerpiece — expand it with more specific, tactical steps." },
];

export function buildEnterprisePrompt(topic, force, editionSeed, picks) {
  var forceLabel = force ? force.label : "macro trends";
  var forceId = force ? force.id : null;
  var closerLine = ENTERPRISE_CLOSERS[Math.abs(editionSeed || 0) % ENTERPRISE_CLOSERS.length];
  var isBreaking = forceId === "news";
  // Enterprise-specific picks
  var ep = picks || {};
  var depth = ep.enterpriseDepth ? ENTERPRISE_DEPTHS.find(function(d) { return d.id === ep.enterpriseDepth; }) : null;
  var tone = ep.enterpriseTone ? ENTERPRISE_TONES.find(function(t) { return t.id === ep.enterpriseTone; }) : null;
  var focus = ep.enterpriseFocus ? ENTERPRISE_FOCUS.find(function(f) { return f.id === ep.enterpriseFocus; }) : null;
  var slideCount = depth ? depth.slides : (isBreaking ? 5 : 8);
  var d = new Date();
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var timestamp = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + " at " + d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");

  return "You are a senior business analyst writing for LOATHR ENTERPRISE, a black-and-white editorial Instagram brand focused on business intelligence.\n\n" +
    "Industry/Topic: \"" + topic + "\"\n" +
    "Force: \"" + forceLabel + "\"\n" +
    "Generated: " + timestamp + "\n\n" +
    (isBreaking ?
      "BREAKING NEWS MODE: Search for the MOST RECENT breaking story affecting \"" + topic + "\". Find a SPECIFIC current event from today or this week and analyze its immediate industry impact.\n" +
      "SLIDE COUNT: 5-6 slides (speed over depth).\n" +
      "Add 'breaking: true' and 'timestamp: \"" + timestamp + "\"' to the cover slide.\n" +
      "The cover title should start with 'JUST IN:' or 'BREAKING:'\n\n"
    :
      "Write a carousel analyzing how " + forceLabel.toLowerCase() + " impacts this industry/topic.\n" +
      "SLIDE COUNT: " + slideCount + " slides.\n\n"
    ) +
    "Use REAL company names, REAL numbers, REAL market data. Every claim must be specific and citable.\n" +
    "Use web search to find current data when available.\n" +
    (tone ? "\nTONE: " + tone.prompt + "\n" : "") +
    (focus ? "\nFOCUS: " + focus.prompt + "\n" : "") +
    (ep.customVoice ? "\nCUSTOM VOICE: " + ep.customVoice + "\n" : "") + "\n" +
    "WRITING RULES:\n" +
    "- Every slide must have a 'sources' field with 1-2 real citations\n" +
    "- Use specific numbers: revenue figures, market share %, growth rates\n" +
    "- Name real companies, real executives, real products\n" +
    "- NEVER use the word 'algorithm' or cliché phrases\n" +
    "- Keep body text to 2-3 sentences MAX per slide\n" +
    "- If you mention a person's full name, add a 'person' field\n" +
    "- On each content slide, include a 'keywords' array with 2-3 key terms from the body text to emphasize (company names, metrics, key concepts). Example: \"keywords\": [\"Tesla\", \"market share\", \"$4.2B\"]\n\n" +
    "SLIDE ROLES (in order):\n" +
    "- FIRST SLIDE: \"COVER\" — title, titleHighlight (exact substring to emphasize), subtitle\n" +
    "- \"THE LANDSCAPE\" — current state of the industry. heading, body, highlight, keywords, sources\n" +
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
    "CRITICAL: After searching the web, you MUST respond with valid JSON. Do NOT write commentary, analysis, or explanation outside the JSON. Your ENTIRE text response must be the JSON object.\n\nRespond ONLY with valid JSON, no markdown:\n{\"angle\":\"Enterprise Analysis\",\"slides\":[{...slides...}]}";
}

// Business News prompt — current events through business lens
export function buildEnterpriseNewsPrompt(keywords, force, editionSeed, picks) {
  var forceLabel = force ? force.label : "business";
  var closerLine = ENTERPRISE_CLOSERS[Math.abs(editionSeed || 0) % ENTERPRISE_CLOSERS.length];
  var d = new Date();
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var timestamp = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + " at " + d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  var ep = picks || {};
  var tone = ep.enterpriseTone ? ENTERPRISE_TONES.find(function(t) { return t.id === ep.enterpriseTone; }) : null;

  return "You are a senior business news editor writing for LOATHR ENTERPRISE, a black-and-white editorial Instagram brand.\n\n" +
    "SEARCH KEYWORDS: \"" + keywords + "\"\n" +
    "BUSINESS SECTOR: " + forceLabel + "\n" +
    "TIMESTAMP: " + timestamp + "\n\n" +
    "Search the web for the MOST RECENT business news matching these keywords. Focus on the business and industry IMPACT of the news.\n\n" +
    (tone ? "TONE: " + tone.prompt + "\n" : "") +
    (ep.customVoice ? "CUSTOM VOICE: " + ep.customVoice + "\n" : "") +
    "\nSLIDE COUNT: 5-6 slides.\n\n" +
    "RULES:\n" +
    "- Every fact must be from a real, verifiable source with 'sources' field\n" +
    "- Focus on BUSINESS IMPACT — not just what happened, but who profits, who loses, what changes\n" +
    "- NEVER fabricate quotes, statistics, or events\n" +
    "- Keep body text to 2-3 sentences MAX\n" +
    "- On each content slide, include a 'keywords' array with 2-3 key terms to emphasize in the body\n\n" +
    "SLIDE ROLES:\n" +
    "- COVER — title (headline), subtitle (\"" + timestamp + "\"), breaking: true, timestamp: \"" + timestamp + "\"\n" +
    "- \"WHAT HAPPENED\" — heading, body (the news event), keywords, sources\n" +
    "- \"WHO'S AFFECTED\" — heading, body (industries, companies, roles impacted), keywords, sources\n" +
    "- \"THE NUMBERS\" — statFormat \"killer\", stat, caption, sources\n" +
    "- \"WHAT TO DO\" — heading, body (immediate action items for businesses), sources\n" +
    "- CLOSER — hashtags, funnyLine: \"" + closerLine + "\", disclaimer: \"For entertainment and educational purposes only.\"\n\n" +
    "CRITICAL: Your ENTIRE text response must be valid JSON.\n\nRespond ONLY with JSON:\n{\"angle\":\"Business News\",\"slides\":[{...}]}";
}

// Industry Tips prompt — actionable tactical advice
export function buildEnterpriseTipsPrompt(topic, force, editionSeed, picks) {
  var forceLabel = force ? force.label : "business strategy";
  var closerLine = ENTERPRISE_CLOSERS[Math.abs(editionSeed || 0) % ENTERPRISE_CLOSERS.length];
  var ep = picks || {};
  var focus = ep.enterpriseFocus ? ENTERPRISE_FOCUS.find(function(f) { return f.id === ep.enterpriseFocus; }) : null;
  var tone = ep.enterpriseTone ? ENTERPRISE_TONES.find(function(t) { return t.id === ep.enterpriseTone; }) : null;

  return "You are a senior business strategist writing for LOATHR ENTERPRISE, a black-and-white editorial Instagram brand.\n\n" +
    "Industry: \"" + topic + "\"\n" +
    "Focus Area: " + forceLabel + "\n\n" +
    "Write an ACTIONABLE TIPS carousel for businesses in this industry. Every slide should contain a specific, tactical tip that a business owner could implement this week.\n\n" +
    (tone ? "TONE: " + tone.prompt + "\n" : "") +
    (focus ? "FOCUS: " + focus.prompt + "\n" : "") +
    (ep.customVoice ? "CUSTOM VOICE: " + ep.customVoice + "\n" : "") +
    "\nSLIDE COUNT: 7-8 slides.\n\n" +
    "RULES:\n" +
    "- Each tip must be SPECIFIC — not 'use social media' but 'post LinkedIn carousels 3x/week targeting procurement managers'\n" +
    "- Include a real tool, platform, or resource name where relevant\n" +
    "- Include estimated cost, time investment, or expected ROI when possible\n" +
    "- Use web search to find current best practices and tools\n" +
    "- Keep body text to 2-3 sentences MAX\n" +
    "- On each content slide, include a 'keywords' array with 2-3 key terms to emphasize in the body\n\n" +
    "SLIDE ROLES:\n" +
    "- COVER — title (e.g. \"5 Things Every [Industry] Should Do Now\"), subtitle\n" +
    "- \"TIP 1\" through \"TIP 5\" — each slide: heading (the tip as a command), body (why + how + example), highlight (the tool/resource), keywords, sources\n" +
    "- \"THE WHY\" — heading, body (data/context backing the tips), statFormat \"killer\" with stat and caption, sources\n" +
    "- CLOSER — hashtags, funnyLine: \"" + closerLine + "\", disclaimer: \"For entertainment and educational purposes only. Not professional advice.\"\n\n" +
    "CRITICAL: Your ENTIRE text response must be valid JSON.\n\nRespond ONLY with JSON:\n{\"angle\":\"Industry Tips\",\"slides\":[{...}]}";
}
