"use client";
import React, { useCallback, useState } from "react";

// Photos panel (spec §7). Search box -> grid of results from /api/images. Tap a
// result to set it as the current slide's background (with an automatic
// readability scrim) or to drop it onto the canvas as an image element.
//
// "Pick, never paste" (§3 principle 3): there is deliberately NO image-URL input
// anywhere here — this panel replaces the old window.prompt("Image URL:").
//
// The grid renders each result's small `thumb`, so even 30 results on screen
// stay light; the full-res `url` is only ever mounted once the user picks one.

const wrap = {
  width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
  background: "#1b1b1f", borderRight: "1px solid #2a2a2f", minHeight: 0,
  fontFamily: "Helvetica, Arial, sans-serif",
};
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px" };
const searchRow = { display: "flex", gap: 6, padding: "0 12px 10px" };
const input = {
  flex: 1, height: 32, padding: "0 10px", background: "#26262b", color: "#fff",
  border: "1px solid #36363c", borderRadius: 6, fontSize: 13, minWidth: 0,
};
const goBtn = {
  height: 32, padding: "0 12px", background: "#2d8cff", color: "#fff",
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
};
const xBtn = {
  width: 24, height: 24, lineHeight: "22px", textAlign: "center", background: "transparent",
  color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5,
};
const grid = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
  padding: "0 12px 12px", overflowY: "auto", alignContent: "start", minHeight: 0,
};
const hint = { gridColumn: "1 / -1", color: "#7a7a7a", fontSize: 12, lineHeight: 1.5, padding: "16px 4px", textAlign: "center" };

function PhotoCard({ img, onSetBackground, onAddImage }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 6, overflow: "hidden", background: "#26262b" }}
    >
      <img
        src={img.thumb}
        alt={img.alt || ""}
        loading="lazy"
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => { e.currentTarget.style.opacity = "0.15"; }}
      />
      {hover && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "stretch", justifyContent: "center", gap: 6, padding: 10,
          background: "rgba(10,10,12,0.55)",
        }}>
          <button style={{ ...goBtn, height: 30 }} onClick={() => onSetBackground(img)}>Set background</button>
          <button
            style={{ height: 30, padding: "0 10px", background: "#33333a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
            onClick={() => onAddImage(img)}
          >Add to slide</button>
        </div>
      )}
      {img.credit ? (
        <span style={{
          position: "absolute", left: 0, right: 0, bottom: 0, padding: "8px 6px 4px",
          fontSize: 9, color: "#dcdcdc", lineHeight: 1.2,
          background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", pointerEvents: "none",
        }}>{img.source ? img.source + " · " : ""}{img.credit}</span>
      ) : null}
    </div>
  );
}

export default function PhotosPanel({ onSetBackground, onAddImage, onClose }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    const query = q.trim();
    if (!query || loading) return;
    setLoading(true); setError(""); setSearched(true);
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || ("HTTP " + res.status));
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (e) {
      setError(e && e.message ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [q, loading]);

  return (
    <div style={wrap}>
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>Photos</strong>
        <button style={xBtn} onClick={onClose} title="Close panel">×</button>
      </div>

      <div style={searchRow}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(); }}
          placeholder="Search photos…"
          autoFocus
          style={input}
        />
        <button style={goBtn} onClick={search} disabled={loading}>{loading ? "…" : "Search"}</button>
      </div>

      {error && (
        <div style={{ margin: "0 12px 10px", padding: "8px 10px", background: "#3a1f22", color: "#ff9a9a", fontSize: 12, borderRadius: 6 }}>
          {error}
        </div>
      )}

      <div style={grid}>
        {results.map((img, i) => (
          <PhotoCard key={(img.url || "") + i} img={img} onSetBackground={onSetBackground} onAddImage={onAddImage} />
        ))}

        {loading && results.length === 0 && (
          <div style={hint}>Searching…</div>
        )}
        {!loading && !searched && (
          <div style={hint}>Search a topic to find a photo. Pick one to set it as this slide's background — or drop it on the canvas.</div>
        )}
        {!loading && searched && !error && results.length === 0 && (
          <div style={hint}>No photos found. Try a different search.</div>
        )}
      </div>
    </div>
  );
}
