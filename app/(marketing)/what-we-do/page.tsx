export const metadata = { title: "What We Do — Loathr" };

function Pill({ h, p }: { h: string; p: string }) {
  return <div className="pill reveal"><h3 style={{ fontSize: 20 }}>{h}</h3><p style={{ marginTop: 10 }}>{p}</p></div>;
}

export default function WhatWeDo() {
  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="eyebrow mono reveal">What we do</div>
        <h1 className="h-hd reveal d1" style={{ maxWidth: "15ch" }}>Everything a brand needs, under one roof — organised, not scattered.</h1>
        <p className="lead reveal d2" style={{ marginTop: 24 }}>Grouped into three pillars so it&rsquo;s clear how we work together, not eleven disconnected services.</p>
      </div></section>

      <section><div className="wrap">
        <div className="shead reveal"><div><div className="eyebrow mono">Strategy &amp; Consultancy · Loathr Enterprises</div><h2 className="h-md">The thinking that comes first</h2></div></div>
        <div className="grid3">
          <Pill h="Business Strategy &amp; Management" p="Business strategy, business management, growth strategy, market entry, competitive positioning." />
          <Pill h="Operations &amp; Structuring" p="Operational structuring, procurement strategy, process optimisation, financial structuring, risk." />
          <Pill h="Advisory &amp; Delivery" p="Business consultancy, project management, organisational development, representation &amp; negotiation." />
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="shead reveal"><div><div className="eyebrow mono">Creative · Loathr Studios</div><h2 className="h-md">The visual execution arm</h2></div></div>
        <div className="grid3">
          <Pill h="Branding &amp; Identity" p="The visual systems that make your presence undeniable." />
          <Pill h="Photography" p="Product, lifestyle, editorial, portraiture — art-directed end to end." />
          <Pill h="Media Production" p="Film, motion, commercials, documentary — cinematic precision." />
          <Pill h="Design" p="Editorial, campaign, and publishing design for longevity." />
          <Pill h="Storytelling" p="Documentary &amp; narrative — stories worth the runtime." />
          <Pill h="AI &amp; Hybrid Production" p="Synthetic + hybrid visual assets, disciplined and strategic." />
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="shead reveal"><div><div className="eyebrow mono">Growth</div><h2 className="h-md">Turning presence into demand</h2></div></div>
        <div className="grid3">
          <Pill h="Marketing" p="Measurable growth — SEO, PPC, and lead generation across the full funnel." />
          <Pill h="Social Media" p="Commanding the conversation with tactical, relentless digital." />
          <Pill h="Web Design" p="Award-worthy sites that meet business goals and feel like an experience." />
        </div>
        <div className="steps reveal" style={{ marginTop: 46 }}>
          {[["01", "Diagnose", "Deconstruct the model, stack, and landscape."], ["02", "Design", "Frameworks and roadmaps with clear objectives."], ["03", "Deploy", "Execute alongside your team, not from afar."], ["04", "Monitor", "Track against defined KPIs and benchmarks."], ["05", "Sustain", "Embed systems and transfer knowledge."]].map((s) => (
            <div className="st" key={s[0]}><div className="n">{s[0]}</div><h4>{s[1]}</h4><p>{s[2]}</p></div>
          ))}
        </div>
      </div></section>
    </>
  );
}
