// Curated "Quick start" presets — named recipes that fill Voice + Tone + Angle +
// deck length in one tap. Each field is an id into the existing VOICES (voices.js),
// TONES (voices.js), ANGLES (trending.js) and LENGTHS (create screen), so a preset
// is pure data that just seeds those controls — no new generation plumbing. The
// user can still tweak any field afterwards, or Clear. Unit-tested for referential
// integrity against the id lists.
export const PRESETS = [
  { id: "spill-tea", name: "Spill the Tea", voice: "gossip", tone: "playful", angle: "contrarian", length: "standard" },
  { id: "explainer", name: "The Explainer", voice: "researcher", tone: "editorial", angle: "explainer", length: "deep" },
  { id: "hot-take", name: "Hot Take", voice: "critic", tone: "hype", angle: "contrarian", length: "brief" },
  { id: "numbers", name: "By the Numbers", voice: "researcher", tone: "academic", angle: "data", length: "standard" },
  { id: "origin", name: "Origin Story", voice: "storyteller", tone: "editorial", angle: "human", length: "deep" },
  { id: "insider", name: "The Insider", voice: "insider", tone: "dark", angle: "investigative", length: "standard" },
  { id: "street", name: "Street Level", voice: "street", tone: "casual", angle: "human", length: "brief" },
  { id: "future", name: "Future Shock", voice: "oracle", tone: "hype", angle: "future", length: "standard" },
];

// The preset (if any) whose whole bundle currently matches the chosen controls —
// so the chip lights up after a tap and un-lights the moment you tweak a field.
export function activePreset(voice, tone, angle, length) {
  return PRESETS.find((p) => p.voice === voice && p.tone === tone && p.angle === angle && p.length === length) || null;
}
