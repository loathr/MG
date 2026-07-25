"use client";
import React, { useState } from "react";

const FILTERS = ["all", "fashion", "portraits", "events", "weddings", "film", "music", "postcards", "publishing", "graphics"];
const CARDS = [
  { c: "fashion", n: "Agidi Magazine", s: "Editorial", t: "Editorial fashion, art-directed", d: "A magazine story, shot end to end." },
  { c: "fashion", n: "LA SYNCDOCHE", s: "Campaign", t: "A fashion world, built", d: "Campaign & lookbook imagery." },
  { c: "fashion", n: "Black Renaissance", s: "Editorial", t: "Heritage, restated", d: "A fashion editorial series." },
  { c: "portraits", n: "Portraits", s: "Portraiture", t: "Faces, framed with intent", d: "Studio & location portraits." },
  { c: "events", n: "Events", s: "Coverage", t: "The room, remembered", d: "Full event documentation." },
  { c: "weddings", n: "Engagements", s: "Weddings", t: "Before the day", d: "Engagement & wedding coverage." },
  { c: "film", n: "GAS", s: "Film", t: "A film with a point of view", d: "Short film + stills.", play: true },
  { c: "film", n: "We Both Know Too Much", s: "Film", t: "A story worth the runtime", d: "Narrative short + stills.", play: true },
  { c: "film", n: "Reels", s: "Reels", t: "Built for the feed", d: "Vertical reels & cutdowns.", play: true },
  { c: "music", n: "L.O.A", s: "Music", t: "The album, made visual", d: "Cover & campaign imagery." },
  { c: "music", n: "Wavy", s: "Music Video", t: "The record, on screen", d: "Music video + performance stills.", play: true },
  { c: "postcards", n: "Post Cards", s: "Series", t: "Small format, big intent", d: "A postcard photo series." },
  { c: "publishing", n: "BOOK 1", s: "Publishing", t: "A legacy artefact", d: "Photo book — layout & sequencing." },
  { c: "graphics", n: "Afrotide Shorts", s: "Motion", t: "Motion with rhythm", d: "Motion-graphic shorts & loops.", play: true },
];

export default function Work() {
  const [f, setF] = useState("all");
  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="eyebrow mono reveal">Our work</div>
        <h1 className="h-hd reveal d1">We bring your boldest ideas to life.</h1>
        <p className="lead reveal d2" style={{ marginTop: 22 }}>Each project tells a story — client, challenge, solution, outcome. Not just a wall of images.</p>
      </div></section>

      <section><div className="wrap">
        <div className="filters">
          {FILTERS.map((x) => (
            <button key={x} className={f === x ? "on" : ""} onClick={() => setF(x)}>{x === "all" ? "All" : x[0].toUpperCase() + x.slice(1)}</button>
          ))}
        </div>
        <div className="work">
          {CARDS.filter((c) => f === "all" || c.c === f).map((c) => (
            <div className="wcard" key={c.n} data-cursor="Open" data-label="OPEN">
              <div className={`media${c.play ? " play" : ""}`}>{c.play ? <span className="pi">▶</span> : null}<div className="tag"><b>{c.c.toUpperCase()}</b>media · R2</div></div>
              <div className="body"><div className="meta"><span>{c.n}</span><span>{c.s}</span></div><h3>{c.t}</h3><p>{c.d}</p><span className="go">View project →</span></div>
            </div>
          ))}
        </div>
      </div></section>
    </>
  );
}
