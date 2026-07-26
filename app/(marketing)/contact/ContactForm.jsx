"use client";
import React, { useState } from "react";

export default function ContactForm({ eyebrow, heading, lead, serviceOptions, submitLabel, faq, trustNote }) {
  const [open, setOpen] = useState(-1);
  return (
    <section><div className="wrap" style={{ paddingTop: 112 }}>
      <div className="eyebrow mono reveal">{eyebrow}</div>
      <h1 className="h-hd reveal d1">{heading}</h1>
      <p className="lead reveal d2" style={{ marginTop: 20 }}>{lead}</p>
      <div className="cGrid" style={{ marginTop: 58 }}>
        <form className="reveal" onSubmit={(e) => e.preventDefault()}>
          <div className="two">
            <div className="field"><label>Name</label><input placeholder="Your name" /></div>
            <div className="field"><label>Company</label><input placeholder="Company" /></div>
          </div>
          <div className="field"><label>Email</label><input placeholder="you@company.com" /></div>
          <div className="field"><label>Service of interest</label><select>{serviceOptions.map((o) => <option key={o}>{o}</option>)}</select></div>
          <div className="field"><label>Message</label><textarea placeholder="Tell us about the project…" /></div>
          <button className="btn red" data-cursor="Send" data-label="→">{submitLabel}</button>
        </form>
        <div className="reveal d1">
          <div className="eyebrow mono">Frequent queries</div>
          <div className="faq">
            {faq.map(({ q, a }, i) => (
              <div className={`q${open === i ? " open" : ""}`} key={q} onClick={() => setOpen(open === i ? -1 : i)} data-cursor="Open" data-label="+">
                <h4>{q} <span className="pl">+</span></h4>
                <div className="a">{a}</div>
              </div>
            ))}
          </div>
          <div className="mono" style={{ color: "var(--mut2)", marginTop: 34 }}>{trustNote}</div>
        </div>
      </div>
    </div></section>
  );
}
