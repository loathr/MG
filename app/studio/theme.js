// ============================================================================
// Editor chrome palette — the single token source for the Studio app shell
// (R3 colour parity). These are ONLY the editor UI (header, rail, panels,
// inspector, strip); canvas CONTENT colours live in styles.js / the deck brand.
//
// `brand` (LOATHR red) drives primary actions + active/selected states. `select`
// (blue) is reserved for on-canvas selection handles + the marquee, which must
// read against red/accent artwork — so it is deliberately NOT the brand colour
// (the same call Figma/Canva make).
// ============================================================================
export const UI = {
  rail: "#0a0a0c",      // tool rail (darkest)
  bg: "#0e0e11",        // canvas / stage backdrop
  surface: "#161619",   // header, panels, strip
  surface2: "#1e1e22",  // controls
  hover: "#27272c",     // control hover
  border: "#2c2c32",    // hairlines
  soft: "#202024",      // softer dividers
  text: "#ededf0",
  muted: "#8b8b93",
  brand: "#e23744",     // LOATHR red — CTA / active / selected
  brandHi: "#ff4d5b",   // brand hover
  select: "#2d8cff",    // selection handles + marquee ONLY
};
