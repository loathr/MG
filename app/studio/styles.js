// ============================================================================
// Premium style families. Each is a parameter set the templates render with —
// palette, fonts, AND a per-family layout map — plus the Create-screen previews.
//
// "Premium editorial output, kid-simple controls" (spec §1): every family stays
// grown-up — serif or strong sans, restrained palette, generous type. None of
// them is childish/rounded/clip-art. Families also diverge in ARRANGEMENT: each
// maps cover/content slides to distinct layouts (`layouts`, rendered through
// templates.js `renderLayout`) — Editorial left-aligned & sourced, Bold big &
// bottom-anchored, Minimal centered & airy. Single source of look truth.
// ============================================================================

export const STYLES = {
  editorial: {
    key: "editorial",
    label: "Editorial",
    blurb: "Serif, photo-led, restrained",
    layouts: { cover: "cover", content: "classic" },
    bg: "#0c0c0c",
    accent: "#e23744",
    ink: "#ffffff",
    sub: "#eaeaea",
    muted: "#9a9a9a",
    headFont: "Georgia, serif",
    bodyFont: "Helvetica, Arial, sans-serif",
    kickerFont: "Helvetica, Arial, sans-serif",
    headWeight: 700,
    kickerWeight: 700,
    kickerSpacing: 4,
    accentBar: true,
    // Over-photo palette: light, readable text on a darkened photo background.
    onPhoto: { ink: "#ffffff", sub: "#f0f0f0", muted: "#d0d0d0", accent: "#e23744", scrim: 0.5 },
  },
  bold: {
    key: "bold",
    label: "Bold",
    blurb: "Big type, high contrast",
    layouts: { cover: "statement", content: "bottom" },
    bg: "#0a0a0a",
    accent: "#ffd400",
    ink: "#ffffff",
    sub: "#f2f2f2",
    muted: "#c0c0c0",
    headFont: "'Arial Black', Impact, sans-serif",
    bodyFont: "Helvetica, Arial, sans-serif",
    kickerFont: "'Arial Black', Impact, sans-serif",
    headWeight: 800,
    kickerWeight: 800,
    kickerSpacing: 2,
    accentBar: true,
    onPhoto: { ink: "#ffffff", sub: "#f4f4f4", muted: "#d6d6d6", accent: "#ffd400", scrim: 0.52 },
  },
  minimal: {
    key: "minimal",
    label: "Minimal",
    blurb: "Light, airy, refined",
    layouts: { cover: "centered", content: "centered" },
    bg: "#f4f1ea",
    accent: "#141414",
    ink: "#141414",
    sub: "#3a3a3a",
    muted: "#8a8a8a",
    headFont: "Georgia, serif",
    bodyFont: "Helvetica, Arial, sans-serif",
    kickerFont: "Helvetica, Arial, sans-serif",
    headWeight: 600,
    kickerWeight: 600,
    kickerSpacing: 6,
    accentBar: false,
    // Minimal is light-on-light; over a photo it flips to white text so it reads.
    onPhoto: { ink: "#ffffff", sub: "#ececec", muted: "#cccccc", accent: "#ffffff", scrim: 0.46 },
  },
  newsdesk: {
    key: "newsdesk",
    label: "News Desk",
    blurb: "Newsprint, serif, red flags",
    // Front-page nameplate cover; content runs as classic newspaper columns
    // (red section label + rule + serif headline + body + Courier sources).
    layouts: { cover: "masthead", content: "classic" },
    bg: "#f7f5f0",       // newsprint cream
    accent: "#c41e1e",   // newspaper red (section flags, "BREAKING")
    ink: "#1a1a1a",
    sub: "#3a3a3a",
    muted: "#6a6a6a",
    headFont: "Georgia, serif",
    bodyFont: "Georgia, serif",                       // serif body, like newsprint
    kickerFont: "'Courier New', Courier, monospace",  // wire-copy dateline/sources
    headWeight: 700,
    kickerWeight: 700,
    kickerSpacing: 2,
    accentBar: true,
    onPhoto: { ink: "#ffffff", sub: "#f0f0f0", muted: "#d6d6d6", accent: "#e23744", scrim: 0.5 },
  },
};

export const STYLE_LIST = [STYLES.editorial, STYLES.bold, STYLES.minimal, STYLES.newsdesk];
export const DEFAULT_STYLE = "editorial";

export function getStyle(key) {
  return STYLES[key] || STYLES.editorial;
}

// The deck-wide brand defaults for a style — what the Brand panel starts from.
// Carries the full color set (so a palette swap has a known "previous" to remap
// from) plus fonts and the closing wordmark.
export function brandFromStyle(key) {
  const st = getStyle(key);
  return {
    accent: st.accent, bg: st.bg, ink: st.ink, sub: st.sub, muted: st.muted,
    headFont: st.headFont, bodyFont: st.bodyFont, wordmark: "LOATHR",
  };
}

// ----------------------------------------------------------------------------
// Editorial palettes — the original 9 category color schemes, revived as
// one-click "looks" in the Brand panel. Color only: accent + background + ink,
// applied over any family without touching its layout or typography.
// ----------------------------------------------------------------------------

function clamp8(n) { return n < 0 ? 0 : n > 255 ? 255 : n; }

// Linear blend of two #rrggbb hexes (t=0 → a, t=1 → b). Used to tint sub/muted
// text between the palette ink and its background so contrast + hierarchy hold.
function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((x, i) => clamp8(Math.round(x + (pb[i] - x) * t)).toString(16).padStart(2, "0")).join("");
}

export const EDITORIAL_PALETTES = [
  { id: "film",      label: "Film & TV",        bg: "#1a1a2e", accent: "#e6a817", ink: "#f5f0e4" },
  { id: "photo",     label: "Photography",      bg: "#0a0a0a", accent: "#ffffff", ink: "#f4f4f4" },
  { id: "sports",    label: "Sports × Culture", bg: "#111111", accent: "#e63946", ink: "#ffffff" },
  { id: "trivia",    label: "Did You Know?",    bg: "#0d1f2d", accent: "#1abc9c", ink: "#ffffff" },
  { id: "art",       label: "Art & Music",      bg: "#1a0a3e", accent: "#ff2d55", ink: "#f8f0ff" },
  { id: "fashion",   label: "Fashion",          bg: "#141420", accent: "#00d2d3", ink: "#f5f5f0" },
  { id: "food",      label: "Food & Drink",     bg: "#1a0f0a", accent: "#e67e22", ink: "#fff5eb" },
  { id: "nightlife", label: "Nightlife",        bg: "#0a0a1a", accent: "#9b59b6", ink: "#f0e6ff" },
  { id: "gossip",    label: "The Tea",          bg: "#1a0a14", accent: "#ff4081", ink: "#fff0f5" },
];

// Expand a palette into the brand color set the deck re-themes with. sub/muted
// are tinted between ink and bg so body/source text stays readable on the new
// background while keeping a step of hierarchy below the heading.
export function paletteBrand(p) {
  return {
    bg: p.bg, accent: p.accent, ink: p.ink,
    sub: mix(p.ink, p.bg, 0.14), muted: mix(p.ink, p.bg, 0.46),
  };
}
