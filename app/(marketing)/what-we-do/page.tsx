import { sanityFetch } from "../../../sanity/lib/fetch";

export const metadata = { title: "What We Do — Loathr" };

type Svc = { h: string; p: string };
type Pillar = { eyebrow: string; heading: string; services: Svc[] };
type Step = { n: string; title: string; desc: string };
type WWD = { eyebrow: string; heading: string; lead: string; pillars: Pillar[]; steps: Step[] };

// Current copy, verbatim.
const F: WWD = {
  eyebrow: "What we do",
  heading: "Everything a brand needs, under one roof — organised, not scattered.",
  lead: "Grouped into three pillars so it’s clear how we work together, not eleven disconnected services.",
  pillars: [
    {
      eyebrow: "Strategy & Consultancy · Loathr Enterprises",
      heading: "The thinking that comes first",
      services: [
        { h: "Business Strategy & Management", p: "Business strategy, business management, growth strategy, market entry, competitive positioning." },
        { h: "Operations & Structuring", p: "Operational structuring, procurement strategy, process optimisation, financial structuring, risk." },
        { h: "Advisory & Delivery", p: "Business consultancy, project management, organisational development, representation & negotiation." },
      ],
    },
    {
      eyebrow: "Creative · Loathr Studios",
      heading: "The visual execution arm",
      services: [
        { h: "Branding & Identity", p: "The visual systems that make your presence undeniable." },
        { h: "Photography", p: "Product, lifestyle, editorial, portraiture — art-directed end to end." },
        { h: "Media Production", p: "Film, motion, commercials, documentary — cinematic precision." },
        { h: "Design", p: "Editorial, campaign, and publishing design for longevity." },
        { h: "Storytelling", p: "Documentary & narrative — stories worth the runtime." },
        { h: "AI & Hybrid Production", p: "Synthetic + hybrid visual assets, disciplined and strategic." },
      ],
    },
    {
      eyebrow: "Growth",
      heading: "Turning presence into demand",
      services: [
        { h: "Marketing", p: "Measurable growth — SEO, PPC, and lead generation across the full funnel." },
        { h: "Social Media", p: "Commanding the conversation with tactical, relentless digital." },
        { h: "Web Design", p: "Award-worthy sites that meet business goals and feel like an experience." },
      ],
    },
  ],
  steps: [
    { n: "01", title: "Diagnose", desc: "Deconstruct the model, stack, and landscape." },
    { n: "02", title: "Design", desc: "Frameworks and roadmaps with clear objectives." },
    { n: "03", title: "Deploy", desc: "Execute alongside your team, not from afar." },
    { n: "04", title: "Monitor", desc: "Track against defined KPIs and benchmarks." },
    { n: "05", title: "Sustain", desc: "Embed systems and transfer knowledge." },
  ],
};

const QUERY = `*[_type == "whatWeDoPage"][0]{
  eyebrow, heading, lead,
  pillars[]{ eyebrow, heading, services[]{ h, p } },
  steps[]{ n, title, desc }
}`;

const arr = <T,>(a: T[] | undefined, f: T[]) => (a && a.length ? a : f);

export default async function WhatWeDo() {
  const cms = await sanityFetch<Partial<WWD> | null>(QUERY, null);
  const c = { ...F, ...(cms || {}) };

  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="eyebrow mono reveal">{c.eyebrow || F.eyebrow}</div>
        <h1 className="h-hd reveal d1" style={{ maxWidth: "15ch" }}>{c.heading || F.heading}</h1>
        <p className="lead reveal d2" style={{ marginTop: 24 }}>{c.lead || F.lead}</p>
      </div></section>

      {arr(c.pillars, F.pillars).map((pillar, pi) => (
        <section key={pi}><div className="wrap">
          <div className="shead reveal"><div><div className="eyebrow mono">{pillar.eyebrow}</div><h2 className="h-md">{pillar.heading}</h2></div></div>
          <div className="grid3">
            {(pillar.services || []).map((s, si) => (
              <div className="pill reveal" key={si}><h3 style={{ fontSize: 20 }}>{s.h}</h3><p style={{ marginTop: 10 }}>{s.p}</p></div>
            ))}
          </div>
          {pi === arr(c.pillars, F.pillars).length - 1 ? (
            <div className="steps reveal" style={{ marginTop: 46 }}>
              {arr(c.steps, F.steps).map((s) => (
                <div className="st" key={s.n}><div className="n">{s.n}</div><h4>{s.title}</h4><p>{s.desc}</p></div>
              ))}
            </div>
          ) : null}
        </div></section>
      ))}
    </>
  );
}
