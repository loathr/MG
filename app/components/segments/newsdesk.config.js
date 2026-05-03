// News Desk segment — newspaper-style news coverage carousels
export var NEWSDESK_ID = "newsdesk";
export var NEWSDESK_LABEL = "News Desk";

// Urgency — how urgent is the story
export var NEWSDESK_URGENCY = [
  { id: "breaking", label: "Breaking", color: "#c41e1e" },
  { id: "developing", label: "Developing", color: "#e67e22" },
  { id: "trending", label: "Trending", color: "#1a1a1a" },
];

// Desks — newsroom beats
export var NEWSDESK_DESKS = [
  { id: "politics", label: "Politics", desc: "Elections, legislation, diplomacy, courts" },
  { id: "business", label: "Business", desc: "Markets, corporate, trade, employment" },
  { id: "crime", label: "Crime & Justice", desc: "Investigations, policing, trials, prisons" },
  { id: "health", label: "Health & Science", desc: "Pandemic, research, FDA, climate data" },
  { id: "tech", label: "Technology", desc: "Big tech, AI policy, cybersecurity, privacy" },
  { id: "sports", label: "Sports", desc: "Leagues, transfers, scandals, Olympics" },
  { id: "culture", label: "Arts & Culture", desc: "Film, music, fashion, social trends" },
  { id: "conflict", label: "Conflict & Defense", desc: "Wars, military, refugees, geopolitics" },
  { id: "environment", label: "Environment", desc: "Climate, disasters, conservation, energy" },
  { id: "education", label: "Education", desc: "Schools, universities, policy, student issues" },
];

// Legacy filters — kept for backward compatibility with existing code
export var NEWSDESK_FILTERS = [
  { id: "breaking", label: "Breaking" },
  { id: "developing", label: "Developing" },
  { id: "trending", label: "Trending" },
  { id: "politics", label: "Politics" },
  { id: "sports", label: "Sports" },
  { id: "money", label: "Money" },
  { id: "people", label: "People" },
  { id: "tech", label: "Tech" },
  { id: "culture", label: "Culture" },
  { id: "world", label: "World" },
];

export var NEWSDESK_REGIONS = [
  { id: "global", label: "Global", countries: [] },
  { id: "americas", label: "Americas", countries: ["United States", "Canada", "Mexico", "Brazil", "Argentina", "Colombia", "Chile", "Peru", "Cuba", "Jamaica", "Trinidad"] },
  { id: "europe", label: "Europe", countries: ["United Kingdom", "France", "Germany", "Spain", "Italy", "Netherlands", "Sweden", "Poland", "Ukraine", "Ireland", "Switzerland", "Belgium", "Portugal", "Greece", "Turkey"] },
  { id: "africa", label: "Africa", countries: ["Nigeria", "South Africa", "Kenya", "Ghana", "Ethiopia", "Egypt", "Tanzania", "Rwanda", "Senegal", "Morocco", "Algeria", "Uganda", "Cameroon", "Ivory Coast", "DR Congo"] },
  { id: "asia", label: "Asia", countries: ["China", "Japan", "India", "South Korea", "Indonesia", "Philippines", "Vietnam", "Thailand", "Singapore", "Malaysia", "Pakistan", "Bangladesh", "Taiwan", "Hong Kong"] },
  { id: "middleeast", label: "Middle East", countries: ["Saudi Arabia", "UAE", "Israel", "Iran", "Iraq", "Qatar", "Kuwait", "Jordan", "Lebanon", "Bahrain", "Oman"] },
  { id: "oceania", label: "Oceania", countries: ["Australia", "New Zealand", "Fiji", "Papua New Guinea"] },
];

export var NEWSDESK_TIMEFRAMES = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

export var NEWSDESK_PALETTE = {
  bg: "#f7f5f0",
  accent: "#c41e1e",
  accent2: "#1a1a1a",
  text: "#1a1a1a",
};

// Grungy newsprint texture for slide backgrounds — multi-layer CSS noise
export var NEWSDESK_BG_TEXTURE = "repeating-radial-gradient(circle at 0% 0%, rgba(40,30,20,0.04) 0px, transparent 1.4px, transparent 4px),repeating-radial-gradient(circle at 100% 100%, rgba(40,30,20,0.035) 0px, transparent 1.2px, transparent 5px),repeating-radial-gradient(circle at 50% 50%, rgba(40,30,20,0.025) 0px, transparent 0.8px, transparent 7px),repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.014) 2px, rgba(0,0,0,0.014) 3px),repeating-linear-gradient(90deg, transparent 0, transparent 3px, rgba(0,0,0,0.01) 3px, rgba(0,0,0,0.01) 4px),radial-gradient(ellipse at 25% 15%, rgba(180,160,120,0.05), transparent 55%),radial-gradient(ellipse at 75% 85%, rgba(120,100,80,0.04), transparent 60%)";

// Subtler texture for editor UI chrome — premium feel, not grungy
export var NEWSDESK_UI_TEXTURE = "repeating-radial-gradient(circle at 0% 0%, rgba(40,30,20,0.025) 0px, transparent 1.2px, transparent 5px),repeating-radial-gradient(circle at 100% 100%, rgba(40,30,20,0.02) 0px, transparent 1px, transparent 6px),repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0,0,0,0.008) 3px, rgba(0,0,0,0.008) 4px)";

export var NEWSDESK_THEME = {
  pageBg: "#f7f5f0",
  pageText: "#1a1a1a",
  uiBg: "#fafaf7",
  uiText: "#1a1a1a",
  uiBorder: "#d8d6d0",
  buttonBg: "transparent",
  buttonBorder: "#1a1a1a44",
  buttonText: "#1a1a1a",
  buttonActiveBg: "#1a1a1a11",
  buttonActiveText: "#1a1a1a",
  inputBg: "#ffffff",
  inputBorder: "#d8d6d0",
  inputText: "#1a1a1a",
  panelBg: "#fafaf7",
  breakingColor: "#c41e1e",
  uiTexture: NEWSDESK_UI_TEXTURE,
};

export var NEWSDESK_DESIGN = {
  imageFilter: "saturate(0.75) contrast(1.08)",
  containers: ["formal", "minimal"],
  borderColor: "#1a1a1a",
  borderWidth: 1,
  fontHeading: "'Foun',Georgia,serif",
  fontBody: "'Maheni',Georgia,serif",
  watermarkColor: "#1a1a1a66",
  bgTexture: NEWSDESK_BG_TEXTURE,
};

export var NEWSDESK_SLIDE_ROLES = [
  "FRONT PAGE", "THE STORY", "THE BACKGROUND", "THE REACTION",
  "THE NUMBERS", "THE PERSPECTIVE", "RELATED", "SOURCES"
];

export var NEWSDESK_ANGLES = [
  { id: "neutral", label: "Neutral", prompt: "Report objectively. Present all sides without editorial judgment." },
  { id: "critical", label: "Critical", prompt: "Take a critical editorial stance. Question official narratives and examine power dynamics." },
  { id: "investigative", label: "Investigative", prompt: "Dig deeper. Follow the money, connections, and hidden motivations behind the story." },
];

export var NEWSDESK_EMPHASIS = [
  { id: "facts", label: "Facts-First", prompt: "Lead every slide with verified facts. Minimize analysis, maximize reporting." },
  { id: "context", label: "Context-Heavy", prompt: "Provide deep historical and political context for every claim. Connect this story to larger patterns." },
  { id: "quotes", label: "Quote-Driven", prompt: "Build the story around direct quotes from key figures. Every slide should have a voice." },
];

export function buildNewsDeskPrompt(keywords, filter, region, timeframe, country, picks) {
  var filterLabel = filter ? filter.label : "general news";
  var regionLabel = region ? region.label : "Global";
  var countryLabel = country || "";
  var locationLabel = countryLabel ? countryLabel + " (" + regionLabel + ")" : regionLabel;
  var timeLabel = timeframe ? timeframe.label.toLowerCase() : "today";
  var np = picks || {};
  var angle = np.newsdeskAngle ? NEWSDESK_ANGLES.find(function(a) { return a.id === np.newsdeskAngle; }) : null;
  var emphasis = np.newsdeskEmphasis ? NEWSDESK_EMPHASIS.find(function(e) { return e.id === np.newsdeskEmphasis; }) : null;
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var d = new Date();
  var dateline = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();

  var filterId = filter ? filter.id : null;
  var isBreaking = filterId === "breaking";
  var isDeveloping = filterId === "developing";
  var isUrgent = isBreaking || isDeveloping;
  var timestamp = dateline + " at " + d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");

  // Force today for breaking/developing regardless of user timeframe selection
  var effectiveTime = isUrgent ? "today" : timeLabel;

  return "You are a senior news editor writing for LOATHR NEWS DESK, an editorial Instagram brand that presents news in a newspaper-style carousel format.\n\n" +
    "SEARCH KEYWORDS: \"" + keywords + "\"\n" +
    "FILTER: " + filterLabel + "\n" +
    "LOCATION: " + locationLabel + "\n" +
    "TIMEFRAME: " + effectiveTime + "\n" +
    "TIMESTAMP: " + timestamp + "\n\n" +
    "Use web search to find CURRENT, REAL news matching these keywords. This is a NEWS product — accuracy is critical.\n\n" +
    (isBreaking ?
      "BREAKING NEWS MODE:\n" +
      "- Find the MOST RECENT story matching these keywords — within hours if possible\n" +
      "- Lead with hard-news urgency: who did what, where, when\n" +
      "- The leadParagraph MUST be a single factual sentence\n" +
      "- Use dateline with time: \"CITY — " + timestamp + "\"\n" +
      "- Add 'breaking: true' and 'timestamp: \"" + timestamp + "\"' to the cover slide\n" +
      "- SLIDE COUNT: 5-6 slides (speed over depth)\n\n"
    : isDeveloping ?
      "DEVELOPING STORY MODE:\n" +
      "- This story is STILL UNFOLDING — present what is known so far\n" +
      "- Clearly mark what is confirmed vs what is reported but unverified\n" +
      "- Use dateline with time: \"CITY — " + timestamp + "\"\n" +
      "- Add 'developing: true' and 'timestamp: \"" + timestamp + "\"' to the cover slide\n" +
      "- SLIDE COUNT: 5-6 slides\n" +
      "- The Sources closer must include: 'This is a developing story. Information may change as details emerge.'\n\n"
    :
      "SLIDE COUNT: 8 slides.\n" +
      "- Use dateline format on the cover: \"CITY — " + dateline + "\"\n\n"
    ) +
    (angle ? "EDITORIAL ANGLE: " + angle.prompt + "\n" : "") +
    (emphasis ? "EMPHASIS: " + emphasis.prompt + "\n" : "") +
    "\nRULES:\n" +
    "- Every fact must be from a real, verifiable source\n" +
    "- Include the publication name, date, and author when available on EVERY slide in a 'sources' field\n" +
    "- NEVER fabricate quotes, statistics, or events\n" +
    "- NEVER use the word 'algorithm'\n" +
    "- Write DENSE body text — 4-6 sentences per slide. This is a newspaper, not a tweet.\n" +
    "- Include specific numbers, names, dates, and places in every body field\n\n" +
    "SLIDE STRUCTURE:\n" +
    "This is a NEWSPAPER. Pack information densely. Some slides COMBINE multiple segments.\n\n" +
    "HEADING RULE: Every slide's 'heading' field MUST be a SPECIFIC editorial headline — NOT the role name. Write it like a real newspaper sub-headline that summarizes the slide's content. Examples:\n" +
    "- BAD: \"The Story\" — this is just the role name\n" +
    "- GOOD: \"Jassy Doubles Down on AI Bet Despite Wall Street Skepticism\"\n" +
    "- BAD: \"The Background + Numbers\" — this is the role name\n" +
    "- GOOD: \"From Cloud Giant to AI Powerhouse: The $200B Gamble\"\n" +
    "- BAD: \"The Reaction\" — generic\n" +
    "- GOOD: \"'We Won't Be Conservative' — Industry Leaders Push Back\"\n\n" +
    "SLIDE ROLES:\n" +
    "- FIRST SLIDE: \"FRONT PAGE\" — title (main headline), titleHighlight (key phrase), subtitle (dateline), leadParagraph (2-3 hard-news sentences), body (additional context paragraph)\n" +
    "- \"THE STORY\" — heading (specific editorial headline), body (who, what, when, where, why — 5-6 sentences), highlight (key quote or pull-out fact), stat (inline number if relevant), statCaption (what the number means), sources\n" +
    (isUrgent ? "" : "- \"THE BACKGROUND + NUMBERS\" — heading (specific headline about the context), body (history/context — 4-5 sentences), stat (key number), statCaption (explanation), highlight (important context quote), sources. This slide COMBINES background context with the key statistic.\n") +
    "- \"THE REACTION\" — heading (headline about the response/reaction), body (analysis around the quotes — 4-5 sentences), quote (direct quote), person (who said it), relatedBody (brief related development), sources\n" +
    (isUrgent ? "" : "- \"THE PERSPECTIVE + RELATED\" — heading (editorial angle headline), body (op-ed analysis — 5-6 sentences), highlight (editorial pull quote), relatedBody (connected story summary — 2-3 sentences), sources. This slide COMBINES perspective with related stories.\n") +
    "- LAST SLIDE: \"SOURCES\" — fullSources (array: [{publication, title, date, url}]), hashtags" + (isDeveloping ? ", developingNote: \"This is a developing story. Information may change as details emerge.\"" : "") + "\n\n" +
    "IMPORTANT: Do NOT use statFormat field. Stats should be inline as 'stat' and 'statCaption' fields within content slides, not separate stat-only slides.\n\n" +
    "CRITICAL: After searching the web, you MUST respond with valid JSON. Do NOT write commentary, analysis, or explanation outside the JSON. Your ENTIRE text response must be the JSON object.\n\nRespond ONLY with valid JSON, no markdown:\n{\"angle\":\"News Coverage\",\"slides\":[{...slides...}]}";
}
