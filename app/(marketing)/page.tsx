import React from "react";
import Link from "next/link";
import { sanityFetch } from "../../sanity/lib/fetch";

const MARQUEE = ["Brand Strategy", "Photography", "Film & Motion", "Consultancy", "Web Design", "Storytelling", "Media Production", "Marketing", "Publishing"];

const SELECTED = [
  { name: "GAS", sub: "Film", title: "A film with a point of view", desc: "Short film + stills, shot and cut in-house.", play: true, tag: "FILM" },
  { name: "Agidi Magazine", sub: "Fashion", title: "Editorial fashion, art-directed", desc: "A magazine story shot end to end.", tag: "FASHION" },
  { name: "Portraits", sub: "Portraiture", title: "Faces, framed with intent", desc: "Studio & location portraiture.", tag: "PORTRAITS" },
  { name: "L.O.A", sub: "Music", title: "The album, made visual", desc: "Cover & campaign imagery for the release.", tag: "MUSIC" },
];

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
  ctaHeadingA: "Let's build something",
  ctaHeadingB: "undeniable.",
  ctaBody: "Developing brands, and driving visibility — from concept to completion.",
};

const HOME_QUERY = `*[_type == "siteSettings"][0]{
  heroEyebrow, heroLine1, heroLine2, heroLead, marquee,
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
  const [line2Lead, line2Tail] = splitTail(heroLine2);
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
          <div className="reveal"><div className="eyebrow mono">What we do</div><h2 className="h-lg">Three pillars.<br />One integrated partner.</h2></div>
          <p className="lead reveal d1">Strategy leads; creative and growth execute. One consultancy, one plan — never eleven disconnected services.</p>
        </div>
        <div className="grid3">
          <div className="pill reveal"><div className="n">01</div><h3>Strategy</h3><p>Clarity, direction, and priorities that become your competitive advantage.</p><ul><li>Brand Strategy</li><li>Business Consultancy</li><li>Project Management</li></ul></div>
          <div className="pill reveal d1"><div className="n">02</div><h3>Creative</h3><p>The visual execution arm — Loathr Studios. Creative in service of the strategy.</p><ul><li>Branding &amp; Identity</li><li>Design</li><li>Photography</li><li>Storytelling</li><li>Media Production</li></ul></div>
          <div className="pill reveal d2"><div className="n">03</div><h3>Growth</h3><p>Turning presence into demand, and perception into your most valuable asset.</p><ul><li>Marketing</li><li>Social Media</li><li>Web Design</li><li>Digital Support</li></ul></div>
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="shead">
          <div className="reveal"><div className="eyebrow mono">Selected work</div><h2 className="h-lg">Proof, not decoration.</h2></div>
          <Link className="btn ghost reveal d1" href="/work" data-cursor="All" data-label="ALL">All work</Link>
        </div>
        <div className="work">
          {SELECTED.map((w, i) => (
            <Link key={w.name} className={`wcard reveal${i ? " d" + i : ""}`} href="/work" data-cursor="Open" data-label="OPEN">
              <div className={`media${w.play ? " play" : ""}`}>{w.play ? <span className="pi">▶</span> : null}<div className="tag"><b>{w.tag}</b>media · pending</div></div>
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
