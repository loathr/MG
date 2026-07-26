import Link from "next/link";

export const metadata = { title: "About — Loathr" };

export default function About() {
  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="eyebrow mono reveal">About Loathr</div>
        <h1 className="h-hd reveal d1" style={{ maxWidth: "16ch" }}>We help organisations make sense of who they are, and how they&rsquo;re perceived.</h1>
        <p className="lead reveal d2" style={{ marginTop: 26 }}>A strategy-first consultancy with a creative studio inside it — uniting strategy, creative, and growth on precision, long-term thinking, and ruthless execution.</p>
        <div className="stats reveal d3" style={{ marginTop: 72 }}>
          <div className="stat"><b>100<i>+</i></b><span>creatives &amp; collaborators</span></div>
          <div className="stat"><b>5<i>yr+</i></b><span>work that stays future-proof</span></div>
          <div className="stat"><b>3</b><span>integrated pillars</span></div>
          <div className="stat"><b>1</b><span>content engine · loathrdotcom</span></div>
        </div>
      </div></section>

      <section><div className="wrap grid3" style={{ gap: 20 }}>
        <div className="pill reveal"><div className="n">Our Story</div><p style={{ marginTop: 14 }}>Loathr began as a refusal to settle for &ldquo;good enough&rdquo; — an editorial stance that grew into a full consultancy.</p></div>
        <div className="pill reveal d1"><div className="n">Mission</div><p style={{ marginTop: 14 }}>To develop brands and drive visibility — turning high-level thinking into real-world results that actually work.</p></div>
        <div className="pill reveal d2"><div className="n">Approach</div><p style={{ marginTop: 14 }}>Diagnose, design, deploy, monitor, sustain. We don&rsquo;t hand over a report and walk away.</p></div>
      </div></section>

      <section><div className="wrap">
        <div className="eyebrow mono reveal">A deliberate stance</div>
        <h2 className="stmt reveal">We stay <em>faceless</em> on purpose.</h2>
        <div className="sub">
          <p className="reveal d1">No founder headshots. No team carousel. No names to remember.</p>
          <p className="reveal d2">The work is the introduction — everything else is noise until we&rsquo;re in a room.</p>
          <p className="reveal d3"><b>Judge us on what we make, not on who&rsquo;s in the photo.</b></p>
          <p className="reveal d4">When it matters, you&rsquo;ll meet us. Until then — the work.</p>
        </div>
      </div></section>

      <div className="band"><div className="g" /><div className="wrap">
        <h2 className="h-xl reveal">Let&apos;s build something<br /><em>undeniable.</em></h2>
        <div className="btnrow reveal d2" style={{ justifyContent: "center" }}><Link className="btn red" href="/contact" data-cursor="Let's talk" data-label="→">Get Started</Link></div>
      </div></div>
    </>
  );
}
