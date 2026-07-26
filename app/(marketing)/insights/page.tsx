"use client";
import React, { useState } from "react";

const TABS = ["Latest", "Film & TV", "Enterprise", "News Desk", "Culture", "Branding"];
const POSTS = [
  { cat: "Film & TV", t: "The sequel nobody asked for earned it", d: "Six reasons the follow-up outran the original — receipts inside." },
  { cat: "Enterprise", t: "What the market is actually pricing in", d: "The structural read three weeks before everyone else." },
  { cat: "News Desk", t: "Today — what we know, what we don't", d: "The story, framed. Handed to analysis, clean." },
  { cat: "Culture", t: "This one has hours on it", d: "Texture, history, weight — and why it matters." },
  { cat: "Culture", t: "The one true thing", d: "Everything else stripped away. Nothing phony survives." },
  { cat: "Branding", t: "10 brand failures worth learning from", d: "What standards look like when they're missing." },
];

export default function Insights() {
  const [tab, setTab] = useState("Latest");
  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="eyebrow mono reveal">Insights</div>
        <h1 className="h-hd reveal d1">The blog, with a point of view.</h1>
        <div className="enginenote reveal d2" style={{ marginTop: 26 }}><span className="d" /> Posts published straight from the <b>loathrdotcom</b> engine — generated, then rendered here as articles.</div>
      </div></section>

      <section><div className="wrap">
        <div className="tabs">
          {TABS.map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        <div className="posts">
          {POSTS.filter((p) => tab === "Latest" || p.cat === tab).map((p) => (
            <div className="post" key={p.t} data-cursor="Read" data-label="READ">
              <div className="media"><div className="tag"><b>CAROUSEL → ARTICLE</b>cover · from loathrdotcom</div></div>
              <div className="body"><span className="cat">{p.cat}</span><h3 style={{ marginTop: 10 }}>{p.t}</h3><p>{p.d}</p></div>
            </div>
          ))}
        </div>
      </div></section>
    </>
  );
}
