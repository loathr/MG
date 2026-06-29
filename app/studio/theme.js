// ============================================================================
// Editor chrome palette — the single token source for the Studio app shell
// (R3 colour parity). These are ONLY the editor UI (header, rail, panels,
// inspector, strip); canvas CONTENT colours live in styles.js / the deck brand.
//
// `brand` (the UI accent) drives primary actions + active/selected states, and
// `onBrand` is the text/icon colour that sits ON it. `select` (blue) is reserved
// for on-canvas selection handles + the marquee, which must read against the
// artwork — deliberately NOT the accent (the same call Figma/Canva make).
//
// Theme: MATTE BLACK + WHITE accent. The accent is white, so `onBrand` is near-
// black (white text would vanish on it). The LOATHR red lives only in the slide
// ARTWORK now, not the chrome.
// ============================================================================
export const UI = {
  rail: "#000000",      // tool rail (matte black)
  bg: "#050505",        // canvas / stage backdrop
  surface: "#0c0c0c",   // header, panels, strip
  surface2: "#161616",  // controls
  hover: "#1f1f1f",     // control hover
  border: "#262626",    // hairlines
  soft: "#1a1a1a",      // softer dividers
  text: "#f2f2f2",
  muted: "#8b8b93",
  brand: "#ffffff",     // white accent — CTA / active / selected
  brandHi: "#e2e2e2",   // accent hover (slightly dimmed white)
  onBrand: "#0a0a0a",   // text/icon ON the white accent (near-black)
  select: "#2d8cff",    // selection handles + marquee ONLY
};
