// ─────────────────────────────────────────────────────────────────────────
//  OTE · content.ts — source of truth for the wall
// ─────────────────────────────────────────────────────────────────────────
//  Works are id-based; the app derives media URLs as
//    <NEXT_PUBLIC_MEDIA_BASE>/<discipline>/<id>/<variant>.webp
//  A work whose media isn't in R2 yet renders generative placeholder art.

export type Work = {
  id: string;
  title: string;
  type: "image" | "video";
  src?: string;
  poster?: string;
  w?: number;
  h?: number;
  year?: number;
  collection?: string;
};

export type Discipline = {
  slug: string;
  name: string;
  hue: number;
  blurb: string;
  pal: [string, string];
  works: Work[];
};

// slug matches the optimizer's slugify (lower, non-alnum → "-", trimmed),
// so ids here line up with the keys uploaded to R2.
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Expand [collectionName, count] into individual works with matching ids.
function fromCollections(colls: [string, number][]): Work[] {
  return colls.flatMap(([name, n]) =>
    Array.from({ length: n }, (_, i) => {
      const nn = String(i + 1).padStart(2, "0");
      return {
        id: `${slug(name)}-${nn}`,
        title: `${name} ${nn}`,
        type: "image" as const,
        collection: name,
      };
    })
  );
}

// Placeholder works for disciplines not yet uploaded (render generative art).
const placeholders = (prefix: string, n: number, label: string): Work[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${String(i + 1).padStart(2, "0")}`,
    title: `${label} ${String(i + 1).padStart(2, "0")}`,
    type: "image" as const,
  }));

export const DISCIPLINES: Discipline[] = [
  {
    slug: "photography",
    name: "Photography",
    hue: 198,
    blurb: "Portraits · Fashion · Weddings · Events · Festivals · Food",
    pal: ["#173247", "#bcd6e6"],
    // 86 real frames live in R2 under photography/<id>/…
    works: fromCollections([
      ["Portraits", 10],
      ["Fashion", 10],
      ["Weddings", 10],
      ["Corporate Events", 10],
      ["Events", 10],
      ["Festivals & Concerts", 10],
      ["iPhotos I", 10],
      ["iPhotos II", 10],
      ["Food", 6],
    ]),
  },
  {
    slug: "film",
    name: "Film",
    hue: 22,
    blurb: "Shorts · Music Videos · Documentary · Commercials",
    pal: ["#3a251a", "#e6c8a0"],
    works: placeholders("fl", 8, "Film"), // upload Production/ next
  },
  {
    slug: "design",
    name: "Design",
    hue: 44,
    blurb: "Identity · Motion Graphics · Type",
    pal: ["#2a2416", "#e6d6b0"],
    works: placeholders("ds", 6, "Design"), // upload Design/ next
  },
];

export const SITE = {
  name: "OTE",
  domain: "otes.me",
  tagline: "Emmanuel Owolabi — selected work, a live wall.",
  about:
    "Emmanuel Owolabi is a photographer and filmmaker working across portraiture, fashion, weddings, events, and motion. This wall is the whole of it — always on, always moving. Pick a channel and dive in.",
  email: "hello@otes.me",
};

export function findDiscipline(slug: string): Discipline | undefined {
  return DISCIPLINES.find((d) => d.slug === slug);
}
