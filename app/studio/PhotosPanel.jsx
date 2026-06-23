"use client";
import React, { useCallback, useState } from "react";
import { Search, ImagePlus, Plus } from "lucide-react";
import { makeElement, ARTBOARD_W, ARTBOARD_H } from "./model";

// Photos panel (§7): search box -> grid of results from /api/images (already
// capped to <=1280x1600). Tap a result to set it as the selected slide's single
// background image WITH an automatic readability scrim, or to place it as an
// image element. There is deliberately NO image-URL input anywhere — "pick,
// never paste" (§2, §12).
const DEFAULT_SCRIM = 0.42;

export default function PhotosPanel({ dispatch }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [error, setError] = useState("");

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setStatus("loading"); setError("");
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || ("HTTP " + res.status));
      setResults(Array.isArray(data.results) ? data.results : []);
      setStatus("done");
    } catch (e) {
      setError(e && e.message ? e.message : "Search failed");
      setStatus("error");
    }
  }, [query]);

  const setAsBackground = useCallback((img) => {
    dispatch({
      type: "setBg",
      patch: { type: "image", src: img.url, thumb: img.thumb || img.url, scrim: DEFAULT_SCRIM, color: "#0c0c0c" },
    });
  }, [dispatch]);

  const placeAsElement = useCallback((img) => {
    const w = 520, h = 650;
    dispatch({ type: "add", element: makeElement("image", {
      x: Math.round((ARTBOARD_W - w) / 2), y: Math.round((ARTBOARD_H - h) / 2), w, h, src: img.url,
    }) });
  }, [dispatch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 6, padding: "12px 12px 8px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 9, top: 9, color: "#888", pointerEvents: "none" }} />
          <input
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            placeholder="Search photos…"
            style={{ width: "100%", height: 32, padding: "0 10px 0 28px", background: "#1d1d21", color: "#fff", border: "1px solid #36363c", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
          />
        </div>
        <button onClick={search} disabled={status === "loading" || !query.trim()}
          style={{ height: 32, padding: "0 12px", background: "#2d8cff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, opacity: status === "loading" || !query.trim() ? 0.6 : 1 }}>
          {status === "loading" ? "…" : "Go"}
        </button>
      </div>

      <div style={{ padding: "0 12px 4px", fontSize: 10.5, color: "#777", lineHeight: 1.4 }}>
        Tap a photo to set it as this slide&rsquo;s background. Use <Plus size={10} style={{ verticalAlign: "-1px" }} /> to place it as a movable image.
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 12px 14px" }}>
        {status === "error" && (
          <div style={{ fontSize: 12, color: "#ff9a9a", padding: "8px 0" }}>{error}</div>
        )}
        {status === "done" && results.length === 0 && (
          <div style={{ fontSize: 12, color: "#888", padding: "8px 0" }}>No photos found. Try a different search.</div>
        )}
        {status === "idle" && (
          <div style={{ fontSize: 12, color: "#888", padding: "8px 0" }}>Search for a subject to fill this slide&rsquo;s background.</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {results.map((img, i) => (
            <PhotoTile key={(img.url || "") + i} img={img} onSetBg={setAsBackground} onPlace={placeAsElement} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PhotoTile({ img, onSetBg, onPlace }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onSetBg(img)}
      title={img.alt || "Set as background"}
      style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 6, overflow: "hidden", cursor: "pointer", background: "#222", border: "1px solid #2f2f35" }}
    >
      <img src={img.thumb || img.url} alt={img.alt || ""} draggable={false} loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {hover && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onPlace(img); }}
            title="Place as image element"
            style={{ alignSelf: "flex-end", width: 24, height: 24, display: "grid", placeItems: "center", background: "rgba(20,20,22,0.9)", color: "#fff", border: "1px solid #444", borderRadius: 5, cursor: "pointer" }}>
            <Plus size={14} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
            <ImagePlus size={12} /> Set background
          </div>
        </div>
      )}
      {img.credit ? (
        <div style={{ position: "absolute", left: 0, bottom: 0, maxWidth: "100%", padding: "2px 5px", fontSize: 8.5, color: "#ddd", background: "rgba(0,0,0,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {img.source ? img.source + " · " : ""}{img.credit}
        </div>
      ) : null}
    </div>
  );
}
