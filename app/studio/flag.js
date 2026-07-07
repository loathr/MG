// flag.js — country → flag-derived deck palette. Pure + OFFLINE (no feeds, no
// model), so it's zero Claude cost and fully testable in-sandbox. When a country
// is chosen in Scope OR detected in the confirmed topic, the deck's ACCENT +
// SECONDARY (kicker / bars / rules) are pulled from that country's flag; the
// background stays dark and text stays light (a contrast guard), so it's always
// readable. Only chrome takes flag colour — never the slide background.

// Dominant flag colours per country (most iconic/vivid first). Keys are the
// canonical names used in trending.GEO_HINTS / REGIONS[].countries.
export const FLAG_PALETTES = {
  "United States": ["#b22234", "#3c3b6e", "#ffffff"],
  "United Kingdom": ["#c8102e", "#012169", "#ffffff"],
  "Canada": ["#ff0000", "#ffffff"],
  "Australia": ["#00008b", "#ff0000", "#ffffff"],
  "New Zealand": ["#cc142b", "#00247d", "#ffffff"],
  "Ireland": ["#169b62", "#ff883e", "#ffffff"],
  "France": ["#ed2939", "#002395", "#ffffff"],
  "Germany": ["#dd0000", "#ffce00", "#000000"],
  "Spain": ["#aa151b", "#f1bf00"],
  "Italy": ["#008c45", "#cd212a", "#ffffff"],
  "Netherlands": ["#ae1c28", "#21468b", "#ffffff"],
  "India": ["#ff9933", "#138808", "#000080"],
  "Japan": ["#bc002d", "#ffffff"],
  "China": ["#de2910", "#ffde00"],
  "South Korea": ["#c60c30", "#003478", "#ffffff"],
  "Singapore": ["#ef3340", "#ffffff"],
  "Brazil": ["#009c3b", "#ffdf00", "#002776"],
  "Mexico": ["#ce1126", "#006847", "#ffffff"],
  "Nigeria": ["#008751", "#ffffff"],
  "South Africa": ["#007a4d", "#de3831", "#ffb612", "#002395"],
  "Kenya": ["#bb0000", "#006600", "#000000", "#ffffff"],
  "Egypt": ["#ce1126", "#c09300", "#000000"],
  "Saudi Arabia": ["#006c35", "#ffffff"],
  "United Arab Emirates": ["#00732f", "#ce1126", "#000000"],
  "Israel": ["#0038b8", "#ffffff"],
  "Argentina": ["#74acdf", "#f6b40e", "#ffffff"],
  "Colombia": ["#fcd116", "#003893", "#ce1126"],
  "Chile": ["#d52b1e", "#0039a6", "#ffffff"],
  "Sweden": ["#006aa7", "#fecc00"],
  "Poland": ["#dc143c", "#ffffff"],
  "Ukraine": ["#0057b7", "#ffd700"],
  "Switzerland": ["#d52b1e", "#ffffff"],
  "Belgium": ["#fdda24", "#ef3340", "#000000"],
  "Portugal": ["#006600", "#ff0000", "#ffff00"],
  "Greece": ["#0d5eaf", "#ffffff"],
  "Turkey": ["#e30a17", "#ffffff"],
  "Ghana": ["#006b3f", "#fcd116", "#ce1126"],
  "Ethiopia": ["#078930", "#fcdd09", "#da121a"],
  "Morocco": ["#c1272d", "#006233"],
  "Tanzania": ["#1eb53a", "#00a3dd", "#fcd116"],
  "Indonesia": ["#ce1126", "#ffffff"],
  "Philippines": ["#0038a8", "#ce1126", "#fcd116"],
  "Vietnam": ["#da251d", "#ffff00"],
  "Thailand": ["#a51931", "#2d2a4a", "#ffffff"],
  "Malaysia": ["#cc0001", "#010066", "#ffcc00"],
  "Pakistan": ["#01411c", "#ffffff"],
  "Bangladesh": ["#006a4e", "#f42a41"],
  "Taiwan": ["#fe0000", "#000095", "#ffffff"],
  "Hong Kong": ["#de2910", "#ffffff"],
  "Iran": ["#239f40", "#da0000", "#ffffff"],
  "Iraq": ["#ce1126", "#007a3d", "#000000"],
  "Qatar": ["#8a1538", "#ffffff"],
  "Kuwait": ["#007a3d", "#ce1126", "#000000"],
  "Jordan": ["#007a3d", "#ce1126", "#000000"],
  "Lebanon": ["#ed1c24", "#00a651", "#ffffff"],
  "Bahrain": ["#ce1126", "#ffffff"],
  "Oman": ["#db161b", "#008000", "#ffffff"],
  "Fiji": ["#68bfe5", "#cf142b", "#ffffff"],
  "Papua New Guinea": ["#ce1126", "#fcd116", "#000000"],
};

// Demonyms / adjectival forms → canonical country, so a topic like "French
// pension reform" resolves, not just "France".
const DEMONYMS = {
  American: "United States", British: "United Kingdom", Canadian: "Canada",
  Australian: "Australia", French: "France", German: "Germany", Spanish: "Spain",
  Italian: "Italy", Dutch: "Netherlands", Indian: "India", Japanese: "Japan",
  Chinese: "China", Korean: "South Korea", "South Korean": "South Korea",
  Brazilian: "Brazil", Mexican: "Mexico", Nigerian: "Nigeria", Kenyan: "Kenya",
  Egyptian: "Egypt", Saudi: "Saudi Arabia", Israeli: "Israel",
  Argentine: "Argentina", Argentinian: "Argentina", Colombian: "Colombia",
  Chilean: "Chile", Swedish: "Sweden", Polish: "Poland", Ukrainian: "Ukraine",
  Swiss: "Switzerland", Belgian: "Belgium", Portuguese: "Portugal", Greek: "Greece",
  Turkish: "Turkey", Ghanaian: "Ghana", Ethiopian: "Ethiopia", Moroccan: "Morocco",
  Tanzanian: "Tanzania", Indonesian: "Indonesia", Filipino: "Philippines",
  Philippine: "Philippines", Vietnamese: "Vietnam", Thai: "Thailand",
  Malaysian: "Malaysia", Pakistani: "Pakistan", Bangladeshi: "Bangladesh",
  Taiwanese: "Taiwan", Iranian: "Iran", Iraqi: "Iraq", Qatari: "Qatar",
  Kuwaiti: "Kuwait", Jordanian: "Jordan", Lebanese: "Lebanon", Irish: "Ireland",
  Singaporean: "Singapore", "South African": "South Africa",
};

// Safe abbreviations (bare "US" is omitted — it collides with the pronoun "us").
const ALIASES = { USA: "United States", "U.S.": "United States", UK: "United Kingdom", UAE: "United Arab Emirates" };

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const NEEDLE_TO_COUNTRY = {};
for (const c of Object.keys(FLAG_PALETTES)) NEEDLE_TO_COUNTRY[c.toLowerCase()] = c;
for (const d of Object.keys(DEMONYMS)) NEEDLE_TO_COUNTRY[d.toLowerCase()] = DEMONYMS[d];
for (const a of Object.keys(ALIASES)) NEEDLE_TO_COUNTRY[a.toLowerCase()] = ALIASES[a];
// Longest needles first so "United States" wins over "States", "South Korean"
// over "Korean", etc., at a shared position.
const NEEDLES = Object.keys(NEEDLE_TO_COUNTRY).sort((a, b) => b.length - a.length);
const DETECT_RX = new RegExp("\\b(" + NEEDLES.map(esc).join("|") + ")\\b", "i");

// Detect a country named (or implied by a demonym) in a text. Returns the
// canonical country name, or null. Pure — the earliest, longest match wins.
export function detectCountry(text) {
  const m = DETECT_RX.exec(String(text == null ? "" : text));
  return m ? NEEDLE_TO_COUNTRY[m[1].toLowerCase()] : null;
}

// ---- Colour helpers (pure) --------------------------------------------------
function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(n, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}
function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}
const hsl = (hex) => rgbToHsl(hexToRgb(hex));
function hueDiff(a, b) {
  const d = Math.abs(hsl(a).h - hsl(b).h) % 360;
  return d > 180 ? 360 - d : d;
}
// A colour vivid enough to be an accent on a dark deck: saturated, not near-white
// or near-black. Exported for tests.
export function isVivid(hex) {
  const c = hsl(hex);
  return c.s >= 0.25 && c.l >= 0.15 && c.l <= 0.92;
}

// Derive a brand from a country's flag: accent = most saturated vivid colour,
// secondary = the next vivid colour of a clearly different hue (so a bar and a
// kicker read apart). Background/ink are LEFT as the base (dark bg, light ink) —
// the readability guard. A flag with no vivid colour (pure black/white) returns
// the base brand unchanged. Pure.
export function flagBrand(country, baseBrand) {
  const base = baseBrand || {};
  const pal = FLAG_PALETTES[country];
  if (!pal || !pal.length) return base;
  const vivid = pal.filter(isVivid);
  if (!vivid.length) return base;
  const ranked = vivid.slice().sort((a, b) => hsl(b).s - hsl(a).s);
  const accent = ranked[0];
  const secondary = ranked.find((c) => c !== accent && hueDiff(c, accent) > 40) || ranked[1] || accent;
  return Object.assign({}, base, { accent, secondary, flagCountry: country });
}

// The effective country for a deck: an explicit Scope country wins; otherwise the
// one detected in the (confirmed) topic. Null when neither. Pure.
export function effectiveCountry(scopeCountry, topic) {
  return (scopeCountry && String(scopeCountry).trim()) || detectCountry(topic) || null;
}
