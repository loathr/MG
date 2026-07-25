"use client";
import React, { useState } from "react";

const FAQ = [
  ["What services do you offer?", "Strategy, creative/production, and growth — grouped as three pillars so engagements stay integrated, not scattered."],
  ["Typical project timeline?", "Scoped per engagement. We define scope, timeline, and budget parameters up front — no surprises."],
  ["Do you offer post-launch support?", "Yes — we embed systems and transfer knowledge. We don't hand over a report and walk away."],
  ["Online and offline projects?", "Both. Digital experiences, film, print, and physical brand systems."],
];

export default function Contact() {
  const [open, setOpen] = useState(-1);
  return (
    <section><div className="wrap" style={{ paddingTop: 112 }}>
      <div className="eyebrow mono reveal">Get started</div>
      <h1 className="h-hd reveal d1">Let&apos;s talk.</h1>
      <p className="lead reveal d2" style={{ marginTop: 20 }}>Whether you have a question or a project to scope — from concept to completion, we&rsquo;re here.</p>
      <div className="cGrid" style={{ marginTop: 58 }}>
        <form className="reveal" onSubmit={(e) => e.preventDefault()}>
          <div className="two">
            <div className="field"><label>Name</label><input placeholder="Your name" /></div>
            <div className="field"><label>Company</label><input placeholder="Company" /></div>
          </div>
          <div className="field"><label>Email</label><input placeholder="you@company.com" /></div>
          <div className="field"><label>Service of interest</label><select><option>Strategy — Business / Consultancy / PM</option><option>Creative — Branding / Photo / Film</option><option>Growth — Marketing / Social / Web</option><option>Not sure yet</option></select></div>
          <div className="field"><label>Message</label><textarea placeholder="Tell us about the project…" /></div>
          <button className="btn red" data-cursor="Send" data-label="→">Send message</button>
        </form>
        <div className="reveal d1">
          <div className="eyebrow mono">Frequent queries</div>
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <div className={`q${open === i ? " open" : ""}`} key={q} onClick={() => setOpen(open === i ? -1 : i)} data-cursor="Open" data-label="+">
                <h4>{q} <span className="pl">+</span></h4>
                <div className="a">{a}</div>
              </div>
            ))}
          </div>
          <div className="mono" style={{ color: "var(--mut2)", marginTop: 34 }}>Accredited &amp; trusted · logos pending</div>
        </div>
      </div>
    </div></section>
  );
}
