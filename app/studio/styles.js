// ============================================================================
// Premium style families. Each is a parameter set the templates render with —
// palette, fonts, AND a per-family layout map — plus the Create-screen previews.
//
// "Premium editorial output, kid-simple controls" (spec §1): every family stays
// grown-up — serif or strong sans, restrained palette, generous type. None of
// them is childish/rounded/clip-art. Families also diverge in ARRANGEMENT: each
// maps cover/content slides to distinct layouts (`layouts`, rendered through
// templates.js `renderLayout`) — Editorial left-aligned & sourced, Enterprise a
// B&W intelligence brief, News Desk a newspaper nameplate. Single look-truth.
// ============================================================================

// The brand wordmark / Courier text face (self-hosted Courier Prime; see
// globals.css). "loathr" brand text is always Courier, and Courier Prime is also
// the default Label-tier (kicker) font across every desk.
export const BRAND_FONT = "'Courier Prime', 'Courier New', monospace";

export const STYLES = {
  editorial: {
    key: "editorial",
    label: "Editorial",
    blurb: "Serif, photo-led, restrained",
    layouts: { cover: "cover", content: "classic" },
    bg: "#0c0c0c",
    accent: "#e23744",
    secondary: "#e23744",                         // segment-header (kicker) colour; defaults to the accent
    ink: "#ffffff",
    sub: "#eaeaea",
    muted: "#9a9a9a",
    headFont: "Georgia, serif",
    bodyFont: "Helvetica, Arial, sans-serif",
    kickerFont: BRAND_FONT,                       // Label tier — Courier (mono)
    headWeight: 700,
    kickerWeight: 700,
    kickerSpacing: 4,
    accentBar: true,
    // Over-photo palette: light, readable text on a darkened photo background.
    onPhoto: { ink: "#ffffff", sub: "#f0f0f0", muted: "#d0d0d0", accent: "#e23744", secondary: "#e23744", scrim: 0.5 },
  },
  enterprise: {
    key: "enterprise",
    label: "Enterprise",
    blurb: "B&W, data-forward, formal",
    // Intelligence-brief cover; content runs as classic columns. Monochrome —
    // white ink AND accent on near-black (the ink-first remap in applyBrand keeps
    // body text readable on a palette swap).
    layouts: { cover: "dossier", content: "classic" },
    bg: "#0a0a0a",
    accent: "#ffffff",
    secondary: "#ffffff",
    ink: "#ffffff",
    sub: "#c8c8c8",
    muted: "#888888",
    headFont: "Helvetica, Arial, sans-serif",   // clean corporate sans headlines
    bodyFont: "Georgia, serif",                  // serif body (the original brief)
    kickerFont: BRAND_FONT,                      // Label tier — Courier (mono)
    headWeight: 700,
    kickerWeight: 700,
    kickerSpacing: 3,
    accentBar: true,
    onPhoto: { ink: "#ffffff", sub: "#ededed", muted: "#cccccc", accent: "#ffffff", secondary: "#ffffff", scrim: 0.55 },
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
    secondary: "#c41e1e",
    ink: "#1a1a1a",
    sub: "#3a3a3a",
    muted: "#6a6a6a",
    headFont: "Georgia, serif",
    bodyFont: "Georgia, serif",                       // serif body, like newsprint
    kickerFont: BRAND_FONT,                           // Label tier — Courier (mono), wire-copy dateline
    headWeight: 700,
    kickerWeight: 700,
    kickerSpacing: 2,
    accentBar: true,
    onPhoto: { ink: "#ffffff", sub: "#f0f0f0", muted: "#d6d6d6", accent: "#e23744", secondary: "#e23744", scrim: 0.5 },
  },
};

export const STYLE_LIST = [STYLES.editorial, STYLES.enterprise, STYLES.newsdesk];
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
    accent: st.accent, secondary: st.secondary, bg: st.bg, ink: st.ink, sub: st.sub, muted: st.muted,
    labelFont: st.kickerFont, headFont: st.headFont, bodyFont: st.bodyFont, wordmark: "LOATHR",
    frame: "off",
  };
}

// The style family with the deck's LIVE brand overrides merged on top. This is
// what lets the renderer draw a re-flowed or reset slide in the current brand
// instead of snapping back to the family palette (the old "edit a slide and it
// disconnects from the deck" bug). A null/default brand is a strict no-op, so
// generation output is unchanged. The accent override also extends into the
// over-photo palette (so emphasis on photo slides follows the brand), but only
// when it actually differs — onPhoto's light ink/sub/muted stay put for
// legibility on a darkened photo.
export function effectiveStyle(key, brand) {
  const st = getStyle(key);
  if (!brand) return st;
  const out = Object.assign({}, st);
  if (brand.accent != null) out.accent = brand.accent;
  if (brand.secondary != null) out.secondary = brand.secondary;
  if (brand.bg != null) out.bg = brand.bg;
  if (brand.ink != null) out.ink = brand.ink;
  if (brand.sub != null) out.sub = brand.sub;
  if (brand.muted != null) out.muted = brand.muted;
  if (brand.labelFont != null) out.kickerFont = brand.labelFont;
  if (brand.headFont != null) out.headFont = brand.headFont;
  if (brand.bodyFont != null) out.bodyFont = brand.bodyFont;
  if (st.onPhoto && ((brand.accent != null && brand.accent !== st.accent) || (brand.secondary != null && brand.secondary !== st.secondary))) {
    out.onPhoto = Object.assign({}, st.onPhoto,
      brand.accent != null && brand.accent !== st.accent ? { accent: brand.accent } : null,
      brand.secondary != null && brand.secondary !== st.secondary ? { secondary: brand.secondary } : null);
  }
  return out;
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

// ----------------------------------------------------------------------------
// Type tier controls (Brand panel). FONT_OPTIONS feeds the FontSelect dropdowns
// — Standard faces plus the unique loathr library (each stack mirrors the old
// monolith's fallbacks). FONT_PRESETS set all three tiers at once and mimic the
// monolith's per-desk typography; Label is always Courier.
// ----------------------------------------------------------------------------

export const FONT_OPTIONS = [
  { group: "Standard", fonts: [
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Times", value: "'Times New Roman', serif" },
    { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
    { label: "Arial Black", value: "'Arial Black', Impact, sans-serif" },
    { label: "Trebuchet", value: "'Trebuchet MS', sans-serif" },
    { label: "Courier Prime", value: BRAND_FONT },
  ] },
  { group: "Unique · loathr library", fonts: [
    { label: "Otilito", value: "'Otilito', 'Foun', sans-serif" },
    { label: "Qogee", value: "'Qogee', 'Maheni', serif" },
    { label: "Foun", value: "'Foun', Georgia, serif" },
    { label: "Maheni", value: "'Maheni', Georgia, serif" },
    { label: "Matina", value: "'Matina', 'Maheni', serif" },
    { label: "Wenssep", value: "'Wenssep', Georgia, serif" },
    { label: "Medhorn", value: "'Medhorn', 'Foun', serif" },
    { label: "CrownHeritage", value: "'CrownHeritage', 'Cheelaved', serif" },
    { label: "VintageTypist", value: "'VintageTypist', 'CarbonText', serif" },
    { label: "CarbonText", value: "'CarbonText', 'Maheni', sans-serif" },
    { label: "Eroded", value: "'Eroded', 'Medhorn', serif" },
    { label: "GrandHalva", value: "'GrandHalva', 'Foun', serif" },
    { label: "Bramos", value: "'Bramos', 'QuickZip', sans-serif" },
    { label: "Cheelaved", value: "'Cheelaved', 'GrandHalva', serif" },
  ] },
];

export const FONT_PRESETS = [
  { id: "standard",   label: "Standard",   labelFont: BRAND_FONT, headFont: "Georgia, serif",                       bodyFont: "Helvetica, Arial, sans-serif" },
  { id: "editorial",  label: "Editorial",  labelFont: BRAND_FONT, headFont: "'VintageTypist', Georgia, serif",       bodyFont: "'Maheni', Georgia, serif" },
  { id: "enterprise", label: "Enterprise", labelFont: BRAND_FONT, headFont: "'Otilito', 'Foun', sans-serif",        bodyFont: "'Qogee', 'Maheni', serif" },
  { id: "newsdesk",   label: "News Desk",  labelFont: BRAND_FONT, headFont: "'CrownHeritage', 'Cheelaved', serif",  bodyFont: "'CarbonText', 'Maheni', sans-serif" },
];

// Which preset (if any) the brand's three tiers currently match — else null ("Custom").
export function activePresetId(brand) {
  const b = brand || {};
  const m = FONT_PRESETS.find((p) => p.labelFont === b.labelFont && p.headFont === b.headFont && p.bodyFont === b.bodyFont);
  return m ? m.id : null;
}
