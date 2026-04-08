// News Desk segment — newspaper-style news coverage carousels
export var NEWSDESK_ID = "newsdesk";
export var NEWSDESK_LABEL = "News Desk";

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
  bg: "#f5f0e4",
  accent: "#c41e1e",
  accent2: "#1a1a1a",
  text: "#1a1a1a",
};

export var NEWSDESK_THEME = {
  pageBg: "#f5f0e4",
  pageText: "#1a1a1a",
  uiBg: "#ebe6d6",
  uiText: "#1a1a1a",
  uiBorder: "#c8c0aa",
  buttonBg: "transparent",
  buttonBorder: "#1a1a1a44",
  buttonText: "#1a1a1a",
  buttonActiveBg: "#1a1a1a11",
  buttonActiveText: "#1a1a1a",
  inputBg: "#ffffff",
  inputBorder: "#c8c0aa",
  inputText: "#1a1a1a",
  panelBg: "#ebe6d6",
  breakingColor: "#c41e1e",
};

export var NEWSDESK_DESIGN = {
  imageFilter: "saturate(0.7) contrast(1.05)",
  containers: ["formal", "minimal"],
  borderColor: "#1a1a1a",
  borderWidth: 1,
  fontHeading: "'Foun',Georgia,serif",
  fontBody: "'Maheni',Georgia,serif",
  watermarkColor: "#1a1a1a66",
};

export var NEWSDESK_SLIDE_ROLES = [
  "FRONT PAGE", "THE STORY", "THE BACKGROUND", "THE REACTION",
  "THE NUMBERS", "THE PERSPECTIVE", "RELATED", "SOURCES"
];

export function buildNewsDeskPrompt(keywords, filter, region, timeframe, country) {
  var filterLabel = filter ? filter.label : "general news";
  var regionLabel = region ? region.label : "Global";
  var countryLabel = country || "";
  var locationLabel = countryLabel ? countryLabel + " (" + regionLabel + ")" : regionLabel;
  var timeLabel = timeframe ? timeframe.label.toLowerCase() : "today";
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
    "RULES:\n" +
    "- Every fact must be from a real, verifiable source\n" +
    "- Include the publication name, date, and author when available on EVERY slide in a 'sources' field\n" +
    "- NEVER fabricate quotes, statistics, or events\n" +
    "- NEVER use the word 'algorithm'\n" +
    "- Keep body text to 2-3 sentences MAX per slide\n\n" +
    "SLIDE ROLES:\n" +
    "- FIRST SLIDE: \"FRONT PAGE\" — title (headline), titleHighlight (key phrase), subtitle (dateline), leadParagraph (1 hard-news sentence: who did what where when)\n" +
    "- \"THE STORY\" — heading, body (who, what, when, where, why), sources\n" +
    (isUrgent ? "" : "- \"THE BACKGROUND\" — heading, body (history/context), sources\n") +
    "- \"THE REACTION\" — heading, body (quotes from key figures), person (name), sources. Include at least one direct quote.\n" +
    "- \"THE NUMBERS\" — key statistic. Use statFormat \"killer\" with stat and caption. sources\n" +
    (isUrgent ? "" : "- \"THE PERSPECTIVE\" — heading, body (op-ed analysis), sources\n- \"RELATED\" — heading, body (connected stories), sources\n") +
    "- LAST SLIDE: \"SOURCES\" — fullSources (array: [{publication, title, date, url}]), hashtags" + (isDeveloping ? ", developingNote: \"This is a developing story. Information may change as details emerge.\"" : "") + "\n\n" +
    "Respond ONLY with valid JSON:\n{\"angle\":\"News Coverage\",\"slides\":[{...slides...}]}";
}
