import { sanityFetch } from "../../../sanity/lib/fetch";
import { urlForImage } from "../../../sanity/lib/image";
import WorkGrid from "./WorkGrid";

export const metadata = { title: "Our Work — Loathr" };

type Card = { c: string; n: string; s: string; t: string; d: string; play?: boolean; img?: string | null; slug?: string };

// The current curated grid. Used verbatim whenever Sanity isn't configured or
// has no projects yet — the page reads identically until real projects exist.
const FALLBACK_CARDS: Card[] = [
  { c: "fashion", n: "Agidi Magazine", s: "Editorial", t: "Editorial fashion, art-directed", d: "A magazine story, shot end to end." },
  { c: "fashion", n: "LA SYNCDOCHE", s: "Campaign", t: "A fashion world, built", d: "Campaign & lookbook imagery." },
  { c: "fashion", n: "Black Renaissance", s: "Editorial", t: "Heritage, restated", d: "A fashion editorial series." },
  { c: "portraits", n: "Portraits", s: "Portraiture", t: "Faces, framed with intent", d: "Studio & location portraits." },
  { c: "events", n: "Events", s: "Coverage", t: "The room, remembered", d: "Full event documentation." },
  { c: "weddings", n: "Engagements", s: "Weddings", t: "Before the day", d: "Engagement & wedding coverage." },
  { c: "film", n: "GAS", s: "Film", t: "A film with a point of view", d: "Short film + stills.", play: true },
  { c: "film", n: "We Both Know Too Much", s: "Film", t: "A story worth the runtime", d: "Narrative short + stills.", play: true },
  { c: "film", n: "Reels", s: "Reels", t: "Built for the feed", d: "Vertical reels & cutdowns.", play: true },
  { c: "music", n: "L.O.A", s: "Music", t: "The album, made visual", d: "Cover & campaign imagery." },
  { c: "music", n: "Wavy", s: "Music Video", t: "The record, on screen", d: "Music video + performance stills.", play: true },
  { c: "postcards", n: "Post Cards", s: "Series", t: "Small format, big intent", d: "A postcard photo series." },
  { c: "publishing", n: "BOOK 1", s: "Publishing", t: "A legacy artefact", d: "Photo book — layout & sequencing." },
  { c: "graphics", n: "Afrotide Shorts", s: "Motion", t: "Motion with rhythm", d: "Motion-graphic shorts & loops.", play: true },
];

type ProjectDoc = {
  c?: string; n?: string; s?: string; t?: string; d?: string;
  play?: boolean; coverUrl?: string; cover?: unknown; slug?: string;
};

const WORK_QUERY = `*[_type == "project"] | order(order asc, _createdAt asc){
  "c": category, "n": title, "s": kind, "t": headline, "d": summary,
  "play": hasVideo, coverUrl, cover, "slug": slug.current
}`;

const HERO_F = {
  eyebrow: "Our work",
  heading: "We bring your boldest ideas to life.",
  lead: "Each project tells a story — client, challenge, solution, outcome. Not just a wall of images.",
};
const HERO_QUERY = `*[_type == "workPage"][0]{ eyebrow, heading, lead }`;

export default async function Work() {
  const docs = await sanityFetch<ProjectDoc[] | null>(WORK_QUERY, null);
  const hero = { ...HERO_F, ...((await sanityFetch<Partial<typeof HERO_F> | null>(HERO_QUERY, null)) || {}) };

  const cards: Card[] = docs && docs.length
    ? docs.map((p) => ({
        c: p.c || "graphics",
        n: p.n || "Untitled",
        s: p.s || "",
        t: p.t || p.n || "",
        d: p.d || "",
        play: !!p.play,
        img: p.coverUrl || urlForImage(p.cover as never)?.width(900).height(560).fit("crop").url() || null,
        slug: p.slug,
      }))
    : FALLBACK_CARDS;

  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="eyebrow mono reveal">{hero.eyebrow || HERO_F.eyebrow}</div>
        <h1 className="h-hd reveal d1">{hero.heading || HERO_F.heading}</h1>
        <p className="lead reveal d2" style={{ marginTop: 22 }}>{hero.lead || HERO_F.lead}</p>
      </div></section>

      <WorkGrid cards={cards} />
    </>
  );
}
