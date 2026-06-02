// Enterprise segment — B&W business/industry analysis
export var ENTERPRISE_ID = "enterprise";
export var ENTERPRISE_LABEL = "Enterprise";

export var ENTERPRISE_MODES = [
  { id: "analysis", label: "Analysis" },
  { id: "news", label: "Business News" },
  { id: "tips", label: "Industry Tips" },
];

export var ENTERPRISE_FORCES = [
  { id: "ai", label: "AI & Automation" },
  { id: "tech", label: "Tech Disruption" },
  { id: "policy", label: "Policy & Regulation" },
  { id: "markets", label: "Market Trends" },
  { id: "culture", label: "Culture Shift" },
  { id: "news", label: "Breaking News" },
];

export var ENTERPRISE_SECTORS = [
  { id: "healthcare", label: "Healthcare & Pharma" },
  { id: "energy", label: "Energy & Climate" },
  { id: "finance", label: "Finance & Banking" },
  { id: "realestate", label: "Real Estate" },
  { id: "defense", label: "Defense & Security" },
  { id: "supplychain", label: "Supply Chain" },
  { id: "agriculture", label: "Agriculture & Food" },
  { id: "space", label: "Space & Aerospace" },
  { id: "media", label: "Media & Entertainment" },
  { id: "education", label: "Education" },
  { id: "labor", label: "Labor & Workforce" },
  { id: "crypto", label: "Crypto & Web3" },
  { id: "lifestyle", label: "Lifestyle & Consumer" },
];

export var ENTERPRISE_TOPICS = {
  healthcare: ["Telehealth adoption post-pandemic", "AI drug discovery pipelines", "Hospital staffing crisis", "GLP-1 drug market explosion", "Medical device regulation", "Mental health tech startups"],
  energy: ["Grid modernization challenges", "EV charging infrastructure race", "Carbon credit market evolution", "Nuclear energy comeback", "Oil price volatility impacts", "Green hydrogen economics"],
  finance: ["Open banking disruption", "BNPL regulation wave", "Central bank digital currencies", "Insurance tech transformation", "Private credit boom", "Neo-bank profitability challenge"],
  realestate: ["Commercial real estate downturn", "PropTech valuation reset", "Housing affordability crisis", "Data center real estate boom", "Co-living market growth", "Climate risk in property"],
  defense: ["Cybersecurity spending surge", "Drone warfare economics", "Defense AI procurement", "Space militarization", "Critical infrastructure protection", "Private military tech"],
  supplychain: ["Nearshoring acceleration", "Port automation revolution", "Last-mile delivery economics", "Cold chain logistics growth", "Supply chain AI adoption", "Trade route disruptions"],
  agriculture: ["Precision agriculture ROI", "Vertical farming viability", "Food waste tech solutions", "Agricultural drone adoption", "Plant-based protein economics", "Water scarcity technology"],
  space: ["Satellite internet competition", "Space tourism economics", "Orbital manufacturing potential", "Space debris management", "Launch cost economics", "Earth observation data market"],
  media: ["Streaming profitability crisis", "AI-generated content impact", "Local news collapse", "Podcast monetization models", "Social media regulation", "Creator economy maturation"],
  education: ["EdTech post-pandemic reality", "AI tutoring disruption", "Student debt crisis solutions", "Corporate upskilling market", "University enrollment decline", "Micro-credential adoption"],
  labor: ["Remote work policy shifts", "Gig economy regulation", "AI job displacement timeline", "Union resurgence in tech", "Immigration and talent gaps", "Four-day work week adoption"],
  crypto: ["Bitcoin ETF market impact", "Stablecoin regulation", "DeFi institutional adoption", "CBDC competition with crypto", "NFT market evolution", "Blockchain in supply chain"],
  lifestyle: ["Wellness industry consolidation", "Luxury resale market growth", "Travel industry recovery", "Subscription fatigue", "Gen Z consumer behavior", "Longevity economy emergence"],
};

// General topics when no sector selected
export var ENTERPRISE_GENERAL_TOPICS = [
  "The AI talent war", "Interest rate impacts on startups", "Supply chain reshoring trend",
  "Remote work productivity debate", "Cybersecurity spending surge", "Creator economy maturation",
  "Healthcare cost disruption", "EV market competition", "Social media regulation wave",
  "Private equity in consumer brands", "Climate tech investment boom", "Gig economy legislation",
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

export function buildEnterprisePrompt(topic, force, editionSeed, picks, sector) {
  var forceLabel = force ? force.label : "macro trends";
  var forceId = force ? force.id : null;
  var sectorLabel = sector ? sector.label : null;
  var closerLine = ENTERPRISE_CLOSERS[Math.abs(editionSeed || 0) % ENTERPRISE_CLOSERS.length];
  var isBreaking = forceId === "news";
  // Enterprise-specific picks
  var ep = picks || {};
  var depth = ep.enterpriseDepth ? ENTERPRISE_DEPTHS.find(function(d) { return d.id === ep.enterpriseDepth; }) : null;
  var tone = ep.enterpriseTone ? ENTERPRISE_TONES.find(function(t) { return t.id === ep.enterpriseTone; }) : null;
  var focus = ep.enterpriseFocus ? ENTERPRISE_FOCUS.find(function(f) { return f.id === ep.enterpriseFocus; }) : null;
  // Explicit pages picker (picks.slideCount) wins over depth preset; fallback to breaking/standard default
  var slideCount = (typeof ep.slideCount === "number" && ep.slideCount >= 4 && ep.slideCount <= 12)
    ? ep.slideCount
    : (depth ? depth.slides : (isBreaking ? 5 : 8));
  // Use scheduled publishDate (YYYY-MM-DD) when set so "today" / dateline references reflect the post date, not generation date
  var d = ep.publishDate ? new Date(ep.publishDate + "T12:00:00") : new Date();
  if (isNaN(d.getTime())) d = new Date();
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var timestamp = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + " at " + d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  var scheduleNote = ep.publishDate ? "\nNOTE: This carousel is scheduled to publish on " + timestamp + ". Web search returns what is current as you read this, but anchor 'today' / 'now' / 'this week' to the publish date when writing prose. Prefer stories from the days/weeks before the publish date.\n" : "";

  return "You are a senior business analyst writing for LOATHR ENTERPRISE, a black-and-white editorial Instagram brand focused on business intelligence.\n\n" +
    "TODAY'S DATE: " + timestamp + ". Treat this as 'today' / 'now' / 'currently'. Do NOT default to your training cutoff. Use web search to verify current facts." + scheduleNote + "\n\n" +
    "Industry/Topic: \"" + topic + "\"\n" +
    "Force: \"" + forceLabel + "\"\n" +
    (sectorLabel ? "Sector: \"" + sectorLabel + "\"\n" : "") +
    "Generated: " + timestamp + "\n\n" +
    (isBreaking ?
      "BREAKING NEWS MODE: Search for the MOST RECENT breaking story affecting \"" + topic + "\". Find a SPECIFIC current event from today or this week and analyze its immediate industry impact.\n" +
      "SLIDE COUNT: 5-6 slides (speed over depth).\n" +
      "Add 'breaking: true' and 'timestamp: \"" + timestamp + "\"' to the cover slide.\n" +
      "The cover title should start with 'JUST IN:' or 'BREAKING:'\n\n"
    :
      "Write a carousel analyzing how " + forceLabel.toLowerCase() + " impacts this industry/topic.\n" +
      "SLIDE COUNT: Generate EXACTLY " + slideCount + " slides total. The total INCLUDES the Cover (slide 1) and the Closer (last slide). Do NOT generate " + (slideCount + 1) + " or " + (slideCount - 1) + " — produce exactly " + slideCount + ".\n\n"
    ) +
    "SOURCE-FIRST WORKFLOW (mandatory):\n" +
    "1. RESEARCH — Run web_search on the industry/topic + force. Identify 5 to 8 authoritative recent articles (Bloomberg, FT, Reuters, WSJ, Economist, sector trade press, SEC filings). Prefer primary financial/regulatory documents over secondary coverage.\n" +
    "2. SOURCE LIST — Compile {publication, title, date, author, url} for each before drafting. Every numeric claim, named executive, market cap, growth rate, and quote must be derivable from this list.\n" +
    "3. BIND SLIDES — Decide which 1-2 sources will ground each slide. Put short citations in that slide's 'sources' field.\n" +
    "4. WRITE — Compose the slides. If a specific number isn't in your sources, write 'approximately' or omit. Never invent a figure.\n\n" +
    "ANTI-CONFABULATION:\n" +
    "- If you don't know an exact number, write 'approximately X' or omit. Never invent a figure to fill a stat slot.\n" +
    "- Quotes must be attributed to real, verifiable speakers from real sources. Otherwise paraphrase.\n" +
    "- If a named executive on a slide isn't verified, leave the 'person' field out.\n" +
    "- Standardize formatting: dollars with $, billions as B, percentages with %.\n\n" +
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
    "- LAST SLIDE: \"CLOSER\" — hashtags string. MUST include in the slide data: funnyLine: \"" + closerLine + "\", funnyLineAlts: [array of 4 ALTERNATE closer taglines you'd write for this brief — one manifesto-style, one skeptical/dry, one inspirational/punchy, one question-style. Each ≤ 90 chars, no quote marks], disclaimer: \"This carousel is for entertainment and educational purposes only. Not professional advice.\"\n\n" +
    "TEXT PLACEMENT: On each content slide, include a 'textPosition' field. Options: 'bottom-left', 'bottom-right', 'top-left', 'top-right', 'split-corners', 'side-left', 'side-right', 'l-shape'.\n\n" +
    "On 2-3 content slides, add '\"mosaic\": true' for photo collage backgrounds.\n\n" +
    "SELF-CONSISTENCY CHECK (do this BEFORE returning):\n" +
    "- Re-read your slides. If a number (revenue, market share, valuation) appears on more than one slide, normalize to the most accurate value across all occurrences.\n" +
    "- If two slides make contradictory factual claims, fix one or remove.\n" +
    "- Confirm every 'sources' field cites material that actually supports the slide's body.\n\n" +
    "CRITICAL: After searching the web, you MUST respond with valid JSON. Do NOT write commentary, analysis, or explanation outside the JSON. Your ENTIRE text response must be the JSON object.\n\nRespond ONLY with valid JSON, no markdown:\n{\"angle\":\"Enterprise Analysis\",\"slides\":[{...slides...}]}";
}

// Business News prompt — current events through business lens
export function buildEnterpriseNewsPrompt(keywords, force, editionSeed, picks, sector) {
  var forceLabel = force ? force.label : "business";
  var closerLine = ENTERPRISE_CLOSERS[Math.abs(editionSeed || 0) % ENTERPRISE_CLOSERS.length];
  var ep = picks || {};
  var d = ep.publishDate ? new Date(ep.publishDate + "T12:00:00") : new Date();
  if (isNaN(d.getTime())) d = new Date();
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var timestamp = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + " at " + d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  var scheduleNote = ep.publishDate ? "\nNOTE: This carousel is scheduled to publish on " + timestamp + ". Anchor 'today' / 'now' to the publish date in prose; web_search still returns current state.\n" : "";
  var tone = ep.enterpriseTone ? ENTERPRISE_TONES.find(function(t) { return t.id === ep.enterpriseTone; }) : null;

  return "You are a senior business news editor writing for LOATHR ENTERPRISE, a black-and-white editorial Instagram brand.\n\n" +
    "TODAY'S DATE: " + timestamp + ". Treat this as 'today' / 'now'. Do NOT default to your training cutoff. Always use web_search for current facts." + scheduleNote + "\n\n" +
    "SEARCH KEYWORDS: \"" + keywords + "\"\n" +
    "BUSINESS SECTOR: " + forceLabel + (sector ? " (" + sector.label + ")" : "") + "\n" +
    "TIMESTAMP: " + timestamp + "\n\n" +
    "SOURCE-FIRST WORKFLOW (mandatory):\n" +
    "1. RESEARCH — Run web_search for the most recent business news matching these keywords. Identify 4 to 6 authoritative articles (Bloomberg, FT, Reuters, WSJ, named beat reporters).\n" +
    "2. SOURCE LIST — Compile {publication, title, date, author, url} before drafting. Every fact must trace to this list.\n" +
    "3. BIND SLIDES — Decide which source(s) ground each slide. Cite them in the 'sources' field.\n" +
    "4. WRITE — Compose with focus on business IMPACT. If a specific number isn't in your sources, write 'approximately' or omit. Never fabricate.\n\n" +
    "ANTI-CONFABULATION: No invented quotes, statistics, or events. Standardize $ B %.\n\n" +
    "Search the web for the MOST RECENT business news matching these keywords. Focus on the business and industry IMPACT of the news.\n\n" +
    (tone ? "TONE: " + tone.prompt + "\n" : "") +
    (ep.customVoice ? "CUSTOM VOICE: " + ep.customVoice + "\n" : "") +
    "\nSLIDE COUNT: " + ((typeof ep.slideCount === "number" && ep.slideCount >= 4 && ep.slideCount <= 12) ? ("Generate EXACTLY " + ep.slideCount + " slides total, INCLUDING Cover and Closer. Do NOT generate " + (ep.slideCount + 1) + " or " + (ep.slideCount - 1) + ".") : "5-6 slides.") + "\n\n" +
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
    "- CLOSER — hashtags, funnyLine: \"" + closerLine + "\", funnyLineAlts: [array of 3 alternate closer taglines — one dry, one punchy, one question-style. Each ≤ 90 chars], disclaimer: \"For entertainment and educational purposes only.\"\n\n" +
    "CRITICAL: Your ENTIRE text response must be valid JSON.\n\nRespond ONLY with JSON:\n{\"angle\":\"Business News\",\"slides\":[{...}]}";
}

// Industry Tips prompt — actionable tactical advice
export function buildEnterpriseTipsPrompt(topic, force, editionSeed, picks, sector) {
  var forceLabel = force ? force.label : "business strategy";
  var closerLine = ENTERPRISE_CLOSERS[Math.abs(editionSeed || 0) % ENTERPRISE_CLOSERS.length];
  var ep = picks || {};
  var focus = ep.enterpriseFocus ? ENTERPRISE_FOCUS.find(function(f) { return f.id === ep.enterpriseFocus; }) : null;
  var tone = ep.enterpriseTone ? ENTERPRISE_TONES.find(function(t) { return t.id === ep.enterpriseTone; }) : null;

  var d = ep.publishDate ? new Date(ep.publishDate + "T12:00:00") : new Date();
  if (isNaN(d.getTime())) d = new Date();
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var today = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  var scheduleNote = ep.publishDate ? "\nNOTE: This carousel is scheduled to publish on " + today + ". Anchor 'today' / 'this week' to the publish date in prose; web_search still returns current state.\n" : "";
  return "You are a senior business strategist writing for LOATHR ENTERPRISE, a black-and-white editorial Instagram brand.\n\n" +
    "TODAY'S DATE: " + today + ". Treat this as 'today' / 'now'. Do NOT default to your training cutoff. Use web_search for current best practices and tools." + scheduleNote + "\n\n" +
    "Industry: \"" + topic + "\"\n" +
    "Focus Area: " + forceLabel + (sector ? " (" + sector.label + ")" : "") + "\n\n" +
    "SOURCE-FIRST WORKFLOW (mandatory):\n" +
    "1. RESEARCH — Run web_search for current best practices, tools, and tactics in this industry. Identify 4 to 6 authoritative sources (industry publications, expert blogs with named authors, tool documentation, case studies).\n" +
    "2. SOURCE LIST — Compile {publication/source, title, date, url} before drafting. Every tool name, statistic, and claim must trace to this list.\n" +
    "3. BIND TIPS — Each tip slide should ground at least one specific source. Cite them in 'sources'.\n" +
    "4. WRITE — Compose actionable tips. If you can't verify a tool's pricing or specific feature, write 'approximately' or omit specifics. Never invent vendor claims.\n\n" +
    "ANTI-CONFABULATION: No invented tool names, pricing, or features. If unsure, describe the category rather than naming a specific product.\n\n" +
    "Write an ACTIONABLE TIPS carousel for businesses in this industry. Every slide should contain a specific, tactical tip that a business owner could implement this week.\n\n" +
    (tone ? "TONE: " + tone.prompt + "\n" : "") +
    (focus ? "FOCUS: " + focus.prompt + "\n" : "") +
    (ep.customVoice ? "CUSTOM VOICE: " + ep.customVoice + "\n" : "") +
    "\nSLIDE COUNT: " + ((typeof ep.slideCount === "number" && ep.slideCount >= 4 && ep.slideCount <= 12) ? ("Generate EXACTLY " + ep.slideCount + " slides total, INCLUDING Cover and Closer. Do NOT generate " + (ep.slideCount + 1) + " or " + (ep.slideCount - 1) + ".") : "7-8 slides.") + "\n\n" +
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
    "- CLOSER — hashtags, funnyLine: \"" + closerLine + "\", funnyLineAlts: [array of 3 alternate closer taglines — one tactical, one inspirational, one dry/skeptical. Each ≤ 90 chars], disclaimer: \"For entertainment and educational purposes only. Not professional advice.\"\n\n" +
    "CRITICAL: Your ENTIRE text response must be valid JSON.\n\nRespond ONLY with JSON:\n{\"angle\":\"Industry Tips\",\"slides\":[{...}]}";
}
