"use client";
import React, { useState } from "react";

// Canonical filter order — the buttons shown are this list intersected with the
// categories actually present, so an empty category never renders a dead filter.
const ORDER = ["fashion", "portraits", "photography", "events", "weddings", "film", "music", "postcards", "publishing", "graphics"];
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function WorkGrid({ cards }) {
  const [f, setF] = useState("all");
  const present = ORDER.filter((cat) => cards.some((c) => c.c === cat));
  const filters = ["all", ...present];
  const shown = cards.filter((c) => f === "all" || c.c === f);

  return (
    <section><div className="wrap">
      <div className="filters">
        {filters.map((x) => (
          <button key={x} className={f === x ? "on" : ""} onClick={() => setF(x)}>{x === "all" ? "All" : cap(x)}</button>
        ))}
      </div>
      <div className="work">
        {shown.map((c) => (
          <div className="wcard" key={c.n + c.t} data-cursor="Open" data-label="OPEN">
            <div className={`media${c.play ? " play" : ""}`}>
              {c.img ? <img className="cover" src={c.img} alt={c.t || c.n} loading="lazy" /> : null}
              {c.play ? <span className="pi">▶</span> : null}
              {c.img ? null : <div className="tag"><b>{(c.c || "").toUpperCase()}</b>media · R2</div>}
            </div>
            <div className="body"><div className="meta"><span>{c.n}</span><span>{c.s}</span></div><h3>{c.t}</h3><p>{c.d}</p><span className="go">View project →</span></div>
          </div>
        ))}
      </div>
    </div></section>
  );
}
