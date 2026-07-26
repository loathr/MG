import React from "react";
import Link from "next/link";
import { sanityFetch } from "../../sanity/lib/fetch";
import { urlForImage } from "../../sanity/lib/image";

const MARQUEE = ["Brand Strategy", "Photography", "Film & Motion", "Consultancy", "Web Design", "Storytelling", "Media Production", "Marketing", "Publishing"];

type Selected = { name: string; sub: string; title: string; desc: string; play?: boolean; tag: string; img?: string | null; slug?: string };

// The current Selected-work strip. Used verbatim whenever Sanity isn't configured
// or has no featured projects — so Home reads identically until real ones exist.
const SELECTED: Selected[] = [
  { name: "GAS", sub: "Film", title: "A film with a point of view", desc: "Short film + stills, shot and cut in-house.", play: true, tag: "FILM" },
  { name: "Agidi Magazine", sub: "Fashion", title: "Editorial fashion, art-directed", desc: "A magazine story shot end to end.", tag: "FASHION" },
  { name: "Portraits", sub: "Portraiture", title: "Faces, framed with intent", desc: "Studio & location portraiture.", tag: "PORTRAITS" },
  { name: "L.O.A", sub: "Music", title: "The album, made visual", desc: "Cover & campaign imagery for the release.", tag: "MUSIC" },
];

type FeaturedDoc = {
  name?: string; sub?: string; title?: string; desc?: string;
  play?: boolean; category?: string; coverUrl?: string; cover?: unknown; slug?: string;
};

// Featured projects drive the strip; same `project` documents as Our Work,
// filtered to `featured == true`, capped at the four the layout expects.
const FEATURED_QUERY = `*[_type == "project" && featured == true] | order(order asc, _createdAt asc)[0...4]{
  "name": title, "sub": kind, "title": headline, "desc": summary,
  "play": hasVideo, category, coverUrl, cover, "slug": slug.current
}`;

// Editable copy lives in Sanity (Site Settings singleton). These are the exact
// current values, used verbatim whenever Sanity isn't configured or a field is
// left blank — so the page reads identically until someone actually edits it.
const HOME_FALLBACK = {
  heroEyebrow: "Strategy-led · Creative studio",
  heroLine1: "From concept",
  heroLine2: "to completion.",
  heroLead:
    "Loathr is a strategy-led creative consultancy. We build stronger brands, execute meaningful projects, and create lasting impact — strategy first, creative throughout.",
  marquee: MARQUEE,
  pillarsEyebrow: "What we do",
  pillarsHeadA: "Three pillars.",
  pillarsHeadB: "One integrated partner.",
  pillarsLead: "Strategy leads; creative and growth execute. One consultancy, one plan — never eleven disconnected services.",
  homePillars: [
    { n: "01", title: "Strategy", desc: "Clarity, direction, and priorities that become your competitive advantage.", items: ["Brand Strategy", "Business Consultancy", "Project Management"] },
    { n: "02", title: "Creative", desc: "The visual execution arm — Loathr Studios. Creative in service of the strategy.", items: ["Branding & Identity", "Design", "Photography", "Storytelling", "Media Production"] },
    { n: "03", title: "Growth", desc: "Turning presence into demand, and perception into your most valuable asset.", items: ["Marketing", "Social Media", "Web Design", "Digital Support"] },
  ],
  selectedEyebrow: "Selected work",
  selectedHeading: "Proof, not decoration.",
  ctaHeadingA: "Let's build something",
  ctaHeadingB: "undeniable.",
  ctaBody: "Developing brands, and driving visibility — from concept to completion.",
};

const HOME_QUERY = `*[_type == "siteSettings"][0]{
  heroEyebrow, heroLine1, heroLine2, heroLead, marquee,
  pillarsEyebrow, pillarsHeadA, pillarsHeadB, pillarsLead,
  homePillars[]{ n, title, desc, items },
  selectedEyebrow, selectedHeading,
  ctaHeadingA, ctaHeadingB, ctaBody
}`;

// The trailing word of line 2 is rendered underlined; split it out.
function splitTail(line: string): [string, string] {
  const t = line.trim();
  const i = t.lastIndexOf(" ");
  return i === -1 ? ["", t] : [t.slice(0, i + 1), t.slice(i + 1)];
}

export default async function Home() {
  const cms = await sanityFetch<Partial<typeof HOME_FALLBACK> | null>(HOME_QUERY, null);
  const c = { ...HOME_FALLBACK, ...(cms || {}) };
  // A present-but-empty field should still fall back rather than blank the page.
  const heroEyebrow = c.heroEyebrow || HOME_FALLBACK.heroEyebrow;
  const heroLine1 = c.heroLine1 || HOME_FALLBACK.heroLine1;
  const heroLine2 = c.heroLine2 || HOME_FALLBACK.heroLine2;
  const heroLead = c.heroLead || HOME_FALLBACK.heroLead;
  const marquee = c.marquee && c.marquee.length ? c.marquee : HOME_FALLBACK.marquee;
  const ctaHeadingA = c.ctaHeadingA || HOME_FALLBACK.ctaHeadingA;
  const ctaHeadingB = c.ctaHeadingB || HOME_FALLBACK.ctaHeadingB;
  const ctaBody = c.ctaBody || HOME_FALLBACK.ctaBody;
  const pillarsEyebrow = c.pillarsEyebrow || HOME_FALLBACK.pillarsEyebrow;
  const pillarsHeadA = c.pillarsHeadA || HOME_FALLBACK.pillarsHeadA;
  const pillarsHeadB = c.pillarsHeadB || HOME_FALLBACK.pillarsHeadB;
  const pillarsLead = c.pillarsLead || HOME_FALLBACK.pillarsLead;
  const homePillars = c.homePillars && c.homePillars.length ? c.homePillars : HOME_FALLBACK.homePillars;
  const selectedEyebrow = c.selectedEyebrow || HOME_FALLBACK.selectedEyebrow;
  const selectedHeading = c.selectedHeading || HOME_FALLBACK.selectedHeading;
  const [line2Lead, line2Tail] = splitTail(heroLine2);

  const featured = await sanityFetch<FeaturedDoc[] | null>(FEATURED_QUERY, null);
  const selected: Selected[] = featured && featured.length
    ? featured.map((p) => ({
        name: p.name || "Untitled",
        sub: p.sub || "",
        title: p.title || p.name || "",
        desc: p.desc || "",
        play: !!p.play,
        tag: (p.category || "").toUpperCase(),
        img: p.coverUrl || urlForImage(p.cover as never)?.width(900).height(560).fit("crop").url() || null,
        slug: p.slug,
      }))
    : SELECTED;
  return (
    <>
      <section className="hero">
        <div className="heroGlow" />
        <div className="wrap">
          <div className="eyebrow mono">{heroEyebrow}</div>
          <h1 className="h-xl">
            <span className="ln"><span>{heroLine1}</span></span>
            <span className="ln"><span>{line2Lead}<em className="uline" style={{ fontStyle: "normal" }}>{line2Tail}</em></span></span>
          </h1>
          <p className="lead">{heroLead}</p>
          <div className="btnrow">
            <Link className="btn red" href="/work" data-cursor="View" data-label="VIEW">See the work</Link>
            <Link className="btn ghost" href="/contact" data-cursor="Start" data-label="→">Start a project</Link>
          </div>
        </div>
        <div className="scrollcue"><span className="l" />Scroll</div>
      </section>

      <div className="marq"><div className="track">
        {[0, 1].map((k) => marquee.map((w, i) => (
          <React.Fragment key={`${k}-${i}`}><b>{w}</b><span className="dot">✦</span></React.Fragment>
        )))}
      </div></div>

      <section><div className="wrap">
        <div className="shead">
          <div className="reveal"><div className="eyebrow mono">{pillarsEyebrow}</div><h2 className="h-lg">{pillarsHeadA}<br />{pillarsHeadB}</h2></div>
          <p className="lead reveal d1">{pillarsLead}</p>
        </div>
        <div className="grid3">
          {homePillars.map((p, i) => (
            <div className={`pill reveal${i ? " d" + i : ""}`} key={p.n}><div className="n">{p.n}</div><h3>{p.title}</h3><p>{p.desc}</p><ul>{(p.items || []).map((it) => <li key={it}>{it}</li>)}</ul></div>
          ))}
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="shead">
          <div className="reveal"><div className="eyebrow mono">{selectedEyebrow}</div><h2 className="h-lg">{selectedHeading}</h2></div>
          <Link className="btn ghost reveal d1" href="/work" data-cursor="All" data-label="ALL">All work</Link>
        </div>
        <div className="work">
          {selected.map((w, i) => (
            <Link key={w.name + w.title} className={`wcard reveal${i ? " d" + i : ""}`} href={w.slug ? `/work/${w.slug}` : "/work"} data-cursor="Open" data-label="OPEN">
              <div className={`media${w.play ? " play" : ""}`}>
                {w.img ? <img className="cover" src={w.img} alt={w.title || w.name} loading="lazy" /> : null}
                {w.play ? <span className="pi">▶</span> : null}
                {w.img ? null : <div className="tag"><b>{w.tag}</b>media · pending</div>}
              </div>
              <div className="body"><div className="meta"><span>{w.name}</span><span>{w.sub}</span></div><h3>{w.title}</h3><p>{w.desc}</p><span className="go">View project →</span></div>
            </Link>
          ))}
        </div>
      </div></section>

      <div className="band"><div className="g" /><div className="wrap">
        <h2 className="h-xl reveal">{ctaHeadingA}<br /><em>{ctaHeadingB}</em></h2>
        <p className="reveal d1">{ctaBody}</p>
        <div className="btnrow reveal d2"><Link className="btn red" href="/contact" data-cursor="Let's talk" data-label="→">Get Started</Link></div>
      </div></div>
    </>
  );
}
