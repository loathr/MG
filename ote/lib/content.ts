// ─────────────────────────────────────────────────────────────────────────
//  OTE · content.ts — THE ONLY FILE YOU EDIT TO ADD REAL WORK
// ─────────────────────────────────────────────────────────────────────────
//  Add a discipline or a piece here and it appears on the wall. No engine edits.
//  • Media lives in /public/media (or a bucket later) — set `src`.
//  • A work with no `src` renders as generative placeholder art in its
//    discipline's palette, so the site looks complete before real media exists.
//  • `type: "video"` uses `poster` for the still frame (in-canvas playback lands
//    in a later pass); `type: "image"` uses `src`.

export type Work = {
  id: string;
  title: string;
  type: "image" | "video";
  src?: string;
  poster?: string;
  w?: number;
  h?: number;
  year?: number;
  collection?: string; // optional sub-collection, e.g. "Wedding"
};

export type Discipline = {
  slug: string;
  name: string;
  hue: number; // 0–360, drives the panel accent
  blurb: string;
  pal: [string, string]; // [shadow, light] for placeholder art
  works: Work[];
};

// Helper to spin up placeholder works quickly.
const ph = (id: string, title: string, year = 2025): Work => ({
  id,
  title,
  type: "image",
  year,
});

export const DISCIPLINES: Discipline[] = [
  {
    slug: "photography",
    name: "Photography",
    hue: 198,
    blurb: "Lifestyle · Wedding · Landscape · Street",
    pal: ["#173247", "#bcd6e6"],
    works: [
      ph("ph-01", "Morning, Kitchen"),
      ph("ph-02", "Cove"),
      ph("ph-03", "First Look"),
      ph("ph-04", "Ridgeline"),
      ph("ph-05", "Crossing"),
      ph("ph-06", "Low Tide"),
      ph("ph-07", "Veil"),
      ph("ph-08", "Neon, 2am"),
    ],
  },
  {
    slug: "film",
    name: "Film",
    hue: 22,
    blurb: "Shorts · Music Videos · Documentary",
    pal: ["#3a251a", "#e6c8a0"],
    works: [
      ph("fl-01", "Static"),
      ph("fl-02", "Bloom — Official Video"),
      ph("fl-03", "The Long Room"),
      ph("fl-04", "Interval"),
      ph("fl-05", "Understudy"),
      ph("fl-06", "Field Notes"),
    ],
  },
  {
    slug: "sound",
    name: "Sound",
    hue: 158,
    blurb: "Scores · Mixes · Field Recordings",
    pal: ["#123c38", "#b6e2d4"],
    works: [
      ph("sn-01", "Score — Interval"),
      ph("sn-02", "Nightbus Mix"),
      ph("sn-03", "Harbour, 5am"),
      ph("sn-04", "Ambient No. 3"),
      ph("sn-05", "Rooms"),
      ph("sn-06", "Signal Loss"),
    ],
  },
  {
    slug: "writing",
    name: "Writing",
    hue: 282,
    blurb: "Essays · Fiction · Criticism",
    pal: ["#281a3a", "#d4c2e6"],
    works: [
      ph("wr-01", "On Making Things"),
      ph("wr-02", "The Understudy"),
      ph("wr-03", "Against Polish"),
      ph("wr-04", "Short Weather"),
      ph("wr-05", "A Review, Sober"),
      ph("wr-06", "Notes on Light"),
    ],
  },
  {
    slug: "design",
    name: "Design",
    hue: 44,
    blurb: "Identity · Type · Motion",
    pal: ["#2a2416", "#e6d6b0"],
    works: [
      ph("ds-01", "Harbour — Identity"),
      ph("ds-02", "Grotesque OTE"),
      ph("ds-03", "Motion Study 07"),
      ph("ds-04", "Wayfinding"),
      ph("ds-05", "Mark Set"),
      ph("ds-06", "Loop"),
    ],
  },
];

export const SITE = {
  name: "OTE",
  domain: "otes.me",
  tagline: "Selected work — a live wall.",
  about:
    "OTE is a maker working across photography, film, sound, writing, and design. This wall is the whole of it — always on, always moving. Pick a channel and dive in.",
  email: "hello@otes.me",
};

export function findDiscipline(slug: string): Discipline | undefined {
  return DISCIPLINES.find((d) => d.slug === slug);
}
