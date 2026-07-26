import Link from "next/link";
import { sanityFetch } from "../../../sanity/lib/fetch";

export const metadata = { title: "About · Loathr" };

type Stat = { value: string; suffix?: string; label: string };
type Card = { label: string; body: string };
type Line = { text: string; strong?: boolean };
type About = {
  eyebrow: string; heading: string; lead: string;
  stats: Stat[]; cards: Card[];
  stanceEyebrow: string; stanceHeadA: string; stanceHeadEm: string; stanceHeadB: string;
  stanceLines: Line[]; ctaHeadA: string; ctaHeadEm: string;
};

// Current copy, verbatim — the page reads identically until edited in the CMS.
const F: About = {
  eyebrow: "About Loathr",
  heading: "We help organisations make sense of who they are, and how they’re perceived.",
  lead: "A strategy-first consultancy with a creative studio inside it, uniting strategy, creative, and growth on precision, long-term thinking, and ruthless execution.",
  stats: [
    { value: "100", suffix: "+", label: "creatives & collaborators" },
    { value: "5", suffix: "yr+", label: "work that stays future-proof" },
    { value: "3", label: "integrated pillars" },
    { value: "1", label: "content engine · loathrdotcom" },
  ],
  cards: [
    { label: "Our Story", body: "Loathr began as a refusal to settle for “good enough,” an editorial stance that grew into a full consultancy." },
    { label: "Mission", body: "To develop brands and drive visibility, turning high-level thinking into real-world results that actually work." },
    { label: "Approach", body: "Diagnose, design, deploy, monitor, sustain. We don’t hand over a report and walk away." },
  ],
  stanceEyebrow: "A deliberate stance",
  stanceHeadA: "We stay ",
  stanceHeadEm: "faceless",
  stanceHeadB: " on purpose.",
  stanceLines: [
    { text: "No founder headshots. No team carousel. No names to remember." },
    { text: "The work is the introduction. Everything else is noise until we’re in a room." },
    { text: "Judge us on what we make, not on who’s in the photo.", strong: true },
    { text: "When it matters, you’ll meet us. Until then, the work." },
  ],
  ctaHeadA: "Let's build something",
  ctaHeadEm: "undeniable.",
};

const QUERY = `*[_type == "aboutPage"][0]{
  eyebrow, heading, lead, stats, cards,
  stanceEyebrow, stanceHeadA, stanceHeadEm, stanceHeadB, stanceLines, ctaHeadA, ctaHeadEm
}`;

const arr = <T,>(a: T[] | undefined, f: T[]) => (a && a.length ? a : f);

export default async function About() {
  const cms = await sanityFetch<Partial<About> | null>(QUERY, null);
  const c = { ...F, ...(cms || {}) };
  const dcls = ["", " d1", " d2", " d3", " d4"];

  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="eyebrow mono reveal">{c.eyebrow || F.eyebrow}</div>
        <h1 className="h-hd reveal d1" style={{ maxWidth: "16ch" }}>{c.heading || F.heading}</h1>
        <p className="lead reveal d2" style={{ marginTop: 26 }}>{c.lead || F.lead}</p>
        <div className="stats reveal d3" style={{ marginTop: 72 }}>
          {arr(c.stats, F.stats).map((s, i) => (
            <div className="stat" key={i}><b>{s.value}{s.suffix ? <i>{s.suffix}</i> : null}</b><span>{s.label}</span></div>
          ))}
        </div>
      </div></section>

      <section><div className="wrap grid3" style={{ gap: 20 }}>
        {arr(c.cards, F.cards).map((card, i) => (
          <div className={`pill reveal${dcls[i] || ""}`} key={i}><div className="n">{card.label}</div><p style={{ marginTop: 14 }}>{card.body}</p></div>
        ))}
      </div></section>

      <section><div className="wrap">
        <div className="eyebrow mono reveal">{c.stanceEyebrow || F.stanceEyebrow}</div>
        <h2 className="stmt reveal">{c.stanceHeadA}<em>{c.stanceHeadEm}</em>{c.stanceHeadB}</h2>
        <div className="sub">
          {arr(c.stanceLines, F.stanceLines).map((l, i) => (
            <p className={`reveal${dcls[i + 1] || ""}`} key={i}>{l.strong ? <b>{l.text}</b> : l.text}</p>
          ))}
        </div>
      </div></section>

      <div className="band"><div className="g" /><div className="wrap">
        <h2 className="h-xl reveal">{c.ctaHeadA || F.ctaHeadA}<br /><em>{c.ctaHeadEm || F.ctaHeadEm}</em></h2>
        <div className="btnrow reveal d2" style={{ justifyContent: "center" }}><Link className="btn red" href="/contact" data-cursor="Let's talk" data-label="→">Get Started</Link></div>
      </div></div>
    </>
  );
}
