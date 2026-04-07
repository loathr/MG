// Editorial segment — the original 9 categories
export var EDITORIAL_CATEGORIES = [
  { id: "film", label: "Film & TV" },
  { id: "photo", label: "Photography" },
  { id: "sports", label: "Sports × Culture" },
  { id: "trivia", label: "Did You Know?" },
  { id: "art", label: "Art & Music" },
  { id: "fashion", label: "Fashion" },
  { id: "food", label: "Food & Drink" },
  { id: "nightlife", label: "Nightlife" },
  { id: "gossip", label: "The Tea" },
];

export var EDITORIAL_PALETTES = {
  film:   { bg: "#1a1a2e", accent: "#e6a817", accent2: "#c8a050", text: "#f5f0e4" },
  photo:  { bg: "#0a0a0a", accent: "#ffffff", accent2: "#888888", text: "#ffffff" },
  sports: { bg: "#111111", accent: "#e63946", accent2: "#f2e307", text: "#ffffff" },
  trivia: { bg: "#0d1f2d", accent: "#1abc9c", accent2: "#8e44ad", text: "#ffffff" },
  art:    { bg: "#1a0a3e", accent: "#ff2d55", accent2: "#0984e3", text: "#f8f0ff" },
  fashion: { bg: "#141420", accent: "#00d2d3", accent2: "#ff9ff3", text: "#f5f5f0" },
  food: { bg: "#1a0f0a", accent: "#e67e22", accent2: "#27ae60", text: "#fff5eb" },
  nightlife: { bg: "#0a0a1a", accent: "#9b59b6", accent2: "#f1c40f", text: "#f0e6ff" },
  gossip: { bg: "#1a0a14", accent: "#ff4081", accent2: "#ffab40", text: "#fff0f5" },
};

export var EDITORIAL_THEME = {
  pageBg: null, // uses browser default
  pageText: null,
  uiBg: null,
  uiText: null,
  uiBorder: null,
};
