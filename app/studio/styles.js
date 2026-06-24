// ============================================================================
// Premium style families. Each is a parameter set the editorial templates render
// with — same layouts, different look — and the Create-screen gallery previews.
//
// "Premium editorial output, kid-simple controls" (spec §1): every family stays
// grown-up — serif or strong sans, restrained palette, generous type. None of
// them is childish/rounded/clip-art. Bold and Minimal are real, visually-distinct
// recolor/refont variants here; they deepen into distinct *layouts* in a later
// pass (§11 step 5). This registry is the single source of look truth.
// ============================================================================

export const STYLES = {
  editorial: {
    key: "editorial",
    label: "Editorial",
    blurb: "Serif, photo-led, restrained",
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
};

export const STYLE_LIST = [STYLES.editorial, STYLES.bold, STYLES.minimal];
export const DEFAULT_STYLE = "editorial";

export function getStyle(key) {
  return STYLES[key] || STYLES.editorial;
}

// The deck-wide brand defaults for a style — what the Brand panel starts from.
export function brandFromStyle(key) {
  const st = getStyle(key);
  return { accent: st.accent, headFont: st.headFont, bodyFont: st.bodyFont, wordmark: "LOATHR" };
}
