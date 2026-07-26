import { sanityFetch } from "../../../sanity/lib/fetch";
import { urlForImage } from "../../../sanity/lib/image";
import GalleryExperience from "./Gallery";

export const metadata = { title: "Our Work · The Gallery — Loathr" };

type Proj = { n: string; c: string; m: string; d: string; img: string | null; vid: string | null; slug: string | null };
type Card = { c: string; n: string; s: string; t: string; d: string; play?: boolean; img?: string | null };

// Safety-net fallback (mirrors /work) for when Sanity has no projects.
const FALLBACK_CARDS: Card[] = [
  { c: "fashion", n: "Agidi Magazine", s: "Editorial", t: "Editorial fashion, art-directed", d: "A magazine story, shot end to end." },
  { c: "fashion", n: "LA SYNCDOCHE", s: "Campaign", t: "A fashion world, built", d: "Campaign & lookbook imagery." },
  { c: "portraits", n: "Portraits", s: "Portraiture", t: "Faces, framed with intent", d: "Studio & location portraits." },
  { c: "film", n: "GAS", s: "Film", t: "A film with a point of view", d: "Short film + stills.", play: true },
  { c: "music", n: "L.O.A", s: "Music", t: "The album, made visual", d: "Cover & campaign imagery." },
  { c: "publishing", n: "BOOK 1", s: "Publishing", t: "A legacy artefact", d: "Photo book — layout & sequencing." },
];

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

type Doc = {
  n?: string; cat?: string; kind?: string; headline?: string; summary?: string;
  play?: boolean; coverUrl?: string; cover?: unknown; videoUrl?: string; slug?: string;
};

const QUERY = `*[_type == "project"] | order(order asc, _createdAt asc){
  "n": title, "cat": category, "kind": kind, "headline": headline, "summary": summary,
  "play": hasVideo, coverUrl, cover, videoUrl, "slug": slug.current
}`;

const HERO_QUERY = `*[_type == "workPage"][0]{ eyebrow, heading, lead }`;

const imgOf = (d: Doc) =>
  d.coverUrl || urlForImage(d.cover as never)?.width(720).height(900).fit("crop").url() || null;

export default async function GalleryPage() {
  const docs = await sanityFetch<Doc[] | null>(QUERY, null);
  const hero = await sanityFetch<{ eyebrow?: string; heading?: string; lead?: string } | null>(HERO_QUERY, null);

  let projects: Proj[];
  let cards: Card[];

  if (docs && docs.length) {
    projects = docs.map((d) => ({
      n: d.n || "Untitled",
      c: cap(d.cat || ""),
      m: d.kind || "",
      d: d.summary || d.headline || "",
      img: imgOf(d),
      vid: d.videoUrl || null,
      slug: d.slug || null,
    }));
    cards = docs.map((d) => ({
      c: d.cat || "graphics",
      n: d.n || "Untitled",
      s: d.kind || "",
      t: d.headline || d.n || "",
      d: d.summary || "",
      play: !!d.play || !!d.videoUrl,
      img: imgOf(d),
    }));
  } else {
    cards = FALLBACK_CARDS;
    projects = FALLBACK_CARDS.map((c) => ({ n: c.n, c: cap(c.c), m: c.s, d: c.d, img: c.img || null, vid: null, slug: null }));
  }

  return <GalleryExperience projects={projects} cards={cards} hero={hero || undefined} />;
}
