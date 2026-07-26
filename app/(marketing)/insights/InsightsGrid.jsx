"use client";
import React, { useState } from "react";

// Tabs derive from the categories present, in a fixed canonical order, so an
// empty category never shows a dead tab. "Latest" always leads.
const ORDER = ["Film & TV", "Enterprise", "News Desk", "Culture", "Branding"];

export default function InsightsGrid({ posts }) {
  const [tab, setTab] = useState("Latest");
  const present = ORDER.filter((c) => posts.some((p) => p.cat === c));
  const tabs = ["Latest", ...present];
  const shown = posts.filter((p) => tab === "Latest" || p.cat === tab);

  return (
    <section><div className="wrap">
      <div className="tabs">
        {tabs.map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      <div className="posts">
        {shown.map((p) => (
          <div className="post" key={p.t} data-cursor="Read" data-label="READ">
            <div className="media">
              {p.img ? <img className="cover" src={p.img} alt={p.t} loading="lazy" /> : null}
              {p.engine ? <span className="ebadge">▸ loathrdotcom</span> : null}
              {p.img ? null : <div className="tag"><b>CAROUSEL → ARTICLE</b>cover · from loathrdotcom</div>}
            </div>
            <div className="body"><span className="cat">{p.cat}</span><h3 style={{ marginTop: 10 }}>{p.t}</h3><p>{p.d}</p></div>
          </div>
        ))}
      </div>
    </div></section>
  );
}
