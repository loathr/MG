// News Desk segment — newspaper-style news coverage carousels
export var NEWSDESK_ID = "newsdesk";
export var NEWSDESK_LABEL = "News Desk";

export var NEWSDESK_FILTERS = [
  { id: "breaking", label: "Breaking" },
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
  { id: "global", label: "Global" },
  { id: "americas", label: "Americas" },
  { id: "europe", label: "Europe" },
  { id: "africa", label: "Africa" },
  { id: "asia", label: "Asia" },
  { id: "middleeast", label: "Middle East" },
  { id: "oceania", label: "Oceania" },
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

export function buildNewsDeskPrompt(keywords, filter, region, timeframe) {
  var filterLabel = filter ? filter.label : "general news";
  var regionLabel = region ? region.label : "Global";
  var timeLabel = timeframe ? timeframe.label.toLowerCase() : "today";
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var d = new Date();
  var dateline = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();

  return "You are a senior news editor writing for LOATHR NEWS DESK, an editorial Instagram brand that presents news in a newspaper-style carousel format.\n\n" +
    "SEARCH KEYWORDS: \"" + keywords + "\"\n" +
    "FILTER: " + filterLabel + "\n" +
    "REGION: " + regionLabel + "\n" +
    "TIMEFRAME: " + timeLabel + "\n" +
    "DATE: " + dateline + "\n\n" +
    "Use web search to find CURRENT, REAL news matching these keywords. This is a NEWS product — accuracy is critical.\n\n" +
    "RULES:\n" +
    "- Every fact must be from a real, verifiable source\n" +
    "- Include the publication name, date, and author when available on EVERY slide in a 'sources' field\n" +
    "- Use dateline format on the cover: \"CITY — " + dateline + "\"\n" +
    "- If the filter is 'Breaking', lead with urgency and recency\n" +
    "- If the filter is 'Trending', focus on why this is gaining attention now\n" +
    "- NEVER fabricate quotes, statistics, or events\n" +
    "- NEVER use the word 'algorithm'\n" +
    "- Keep body text to 2-3 sentences MAX per slide\n\n" +
    "SLIDE ROLES (8 slides):\n" +
    "- FIRST SLIDE: \"FRONT PAGE\" — title (the headline), titleHighlight (key phrase), subtitle (dateline: \"CITY — " + dateline + "\"), leadParagraph (1 sentence summary)\n" +
    (filter && filter.id === "breaking" ? "- Add 'breaking: true' to the cover slide for a red BREAKING banner\n" : "") +
    "- \"THE STORY\" — heading, body (who, what, when, where, why), sources\n" +
    "- \"THE BACKGROUND\" — heading, body (history/context that led to this), sources\n" +
    "- \"THE REACTION\" — heading, body (quotes from key figures), person (quoted person name), sources. Include at least one direct quote.\n" +
    "- \"THE NUMBERS\" — key statistic. Use statFormat \"killer\" with stat and caption. sources\n" +
    "- \"THE PERSPECTIVE\" — heading, body (op-ed analysis, what this means), sources\n" +
    "- \"RELATED\" — heading, body (connected stories, what else is happening), sources\n" +
    "- LAST SLIDE: \"SOURCES\" — fullSources (array of objects: [{publication, title, date, url}]), hashtags string\n\n" +
    "TEXT PLACEMENT: On each content slide, include 'textPosition' field.\n" +
    "On 1-2 slides, add '\"mosaic\": true' for photo collage.\n\n" +
    "Respond ONLY with valid JSON:\n{\"angle\":\"News Coverage\",\"slides\":[{...slides...}]}";
}
