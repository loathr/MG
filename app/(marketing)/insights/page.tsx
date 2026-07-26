import { sanityFetch } from "../../../sanity/lib/fetch";
import { urlForImage } from "../../../sanity/lib/image";
import InsightsGrid from "./InsightsGrid";

export const metadata = { title: "Insights · Loathr" };

type Post = { cat: string; t: string; d: string; img?: string | null; engine?: boolean };

// The current sample articles. Used verbatim whenever Sanity has no posts yet —
// the page reads identically until the loathrdotcom feed (or a hand-written
// post) populates the `post` collection.
const FALLBACK: Post[] = [
  { cat: "Film & TV", t: "The sequel nobody asked for earned it", d: "Six reasons the follow-up outran the original. Receipts inside." },
  { cat: "Enterprise", t: "What the market is actually pricing in", d: "The structural read three weeks before everyone else." },
  { cat: "News Desk", t: "Today: what we know, what we don't", d: "The story, framed. Handed to analysis, clean." },
  { cat: "Culture", t: "This one has hours on it", d: "Texture, history, weight, and why it matters." },
  { cat: "Culture", t: "The one true thing", d: "Everything else stripped away. Nothing phony survives." },
  { cat: "Branding", t: "10 brand failures worth learning from", d: "What standards look like when they're missing." },
];

type PostDoc = { cat?: string; t?: string; d?: string; engine?: boolean; cover?: unknown };

const POSTS_QUERY = `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc){
  "cat": category, "t": title, "d": excerpt, "engine": fromEngine, cover
}`;

const HERO_F = {
  eyebrow: "Insights",
  heading: "The blog, with a point of view.",
  engineNote: "Posts published straight from the loathrdotcom engine, generated, then rendered here as articles.",
};
const HERO_QUERY = `*[_type == "insightsPage"][0]{ eyebrow, heading, engineNote }`;

// Render the engine note, bolding any "loathrdotcom" mention so it stays
// editable as one plain string.
function noteParts(s: string) {
  return s.split(/(loathrdotcom)/g).map((seg, i) =>
    seg === "loathrdotcom" ? <b key={i}>{seg}</b> : <span key={i}>{seg}</span>
  );
}

export default async function Insights() {
  const docs = await sanityFetch<PostDoc[] | null>(POSTS_QUERY, null);
  const hero = { ...HERO_F, ...((await sanityFetch<Partial<typeof HERO_F> | null>(HERO_QUERY, null)) || {}) };

  const posts: Post[] = docs && docs.length
    ? docs.map((p) => ({
        cat: p.cat || "Culture",
        t: p.t || "Untitled",
        d: p.d || "",
        engine: !!p.engine,
        img: urlForImage(p.cover as never)?.width(720).height(900).fit("crop").url() || null,
      }))
    : FALLBACK;

  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="eyebrow mono reveal">{hero.eyebrow || HERO_F.eyebrow}</div>
        <h1 className="h-hd reveal d1">{hero.heading || HERO_F.heading}</h1>
        <div className="enginenote reveal d2" style={{ marginTop: 26 }}><span className="d" /> {noteParts(hero.engineNote || HERO_F.engineNote)}</div>
      </div></section>

      <InsightsGrid posts={posts} />
    </>
  );
}
