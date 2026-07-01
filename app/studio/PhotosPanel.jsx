"use client";
import React, { useCallback, useRef, useState } from "react";
import { UI } from "./theme";
import { uploadResult } from "./model";
import { Upload } from "lucide-react";

// Photos panel (spec §7). Search box -> masonry of results from /api/images, PLUS
// "upload from device". Tap a result (searched or uploaded) to set it as the
// current slide's background (with an automatic readability scrim) or to drop it
// onto the canvas as an image element.
//
// "Pick, never paste" (§3 principle 3): there is still NO image-URL input — the
// only ways in are search and file upload. Uploads are downscaled on the client
// (readUploadFile) to a single capped image + a small thumb, so they obey the
// same FLAT-LAYERS budget a searched photo does.
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
  height: 32, padding: "0 12px", background: UI.brand, color: UI.onBrand,
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
};
const xBtn = {
  width: 24, height: 24, lineHeight: "22px", textAlign: "center", background: "transparent",
  color: "#999", border: "none", cursor: "pointer", fontSize: 18, borderRadius: 5,
};
const drop = {
  margin: "0 12px 12px", border: "1.5px dashed #45454c", borderRadius: 8, background: "#202024",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#cfcfcf", cursor: "pointer",
};
const dropBig = { flexDirection: "column", height: 116, gap: 5 };
const dropSm = { flexDirection: "row", height: 54 };
const dropHi = { borderColor: UI.brand, background: "#1c2530" };
const grid = {
  // A real 2-column grid (row by row, top-to-bottom). Every tile is a uniform
  // square (PhotoCard sets aspectRatio + object-fit:cover), so the results read as
  // an even gallery — no ragged masonry, no grey dead-space under short tiles.
  // alignItems:start (NOT the grid default `stretch`) keeps a tile from being
  // stretched to its row — otherwise a portrait thumbnail's intrinsic height
  // overrode the square aspect-ratio and the columns desynced ("stacking").
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignContent: "start", alignItems: "start",
  padding: "0 12px 12px", overflowY: "auto", minHeight: 0,
};
const hint = { gridColumn: "1 / -1", color: "#7a7a7a", fontSize: 12, lineHeight: 1.5, padding: "16px 4px", textAlign: "center" };

// Read an uploaded image file -> a §3-safe { url, thumb } via canvas downscale:
// the full image capped to <=1600px (the same ceiling /api/images enforces) plus
// a ~400px thumb for the strip, both JPEG dataURLs to stay light. dataURLs are
// same-origin, so the PNG export canvas stays untainted. Browser-only; mirrors
// BrandPanel.readLogoFile. A non-image or undecodable file resolves to null.
const MAX_SRC = 1600, MAX_THUMB = 400;
function scaleCanvas(img, max) {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const cw = Math.max(1, Math.round(img.width * scale));
  const ch = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
  return canvas;
}
function readUploadFile(file, cb) {
  if (!file || !/^image\//.test(file.type || "")) { cb(null); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      let url, thumb;
      try { url = scaleCanvas(img, MAX_SRC).toDataURL("image/jpeg", 0.85); }
      catch (e) { url = String(reader.result); }
      try { thumb = scaleCanvas(img, MAX_THUMB).toDataURL("image/jpeg", 0.8); }
      catch (e) { thumb = url; }
      cb(uploadResult(url, thumb, file.name));
    };
    img.onerror = () => cb(null);
    img.src = String(reader.result);
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}

function PhotoCard({ img, onSetBackground, onAddImage }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", borderRadius: 6, overflow: "hidden", background: "#26262b", aspectRatio: "1 / 1" }}
    >
      <img
        src={img.thumb}
        alt={img.alt || ""}
        loading="lazy"
        draggable={false}
        // Uniform square tiles (object-fit:cover) — every result is the SAME size
        // regardless of its native aspect ratio. ABSOLUTELY positioned so the image
        // fills the square WITHOUT contributing to the container's height: a portrait
        // thumbnail's intrinsic height would otherwise win over the 1:1 aspect-ratio
        // and desync the two columns ("stacking" at higher result counts).
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => { e.currentTarget.style.opacity = "0.15"; }}
      />
      {img.uploaded ? (
        <span style={{
          position: "absolute", top: 6, left: 6, background: UI.brand, color: UI.onBrand,
          fontSize: 9, fontWeight: 700, letterSpacing: 0.4, padding: "2px 6px", borderRadius: 4, pointerEvents: "none",
        }}>UPLOADED</span>
      ) : null}
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
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [dragHi, setDragHi] = useState(false);
  const fileRef = useRef(null);

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

  // Upload: read each image file off the device, downscale, prepend (newest
  // first) so it sits ahead of any web results. Non-image files are ignored.
  const handleFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter((f) => /^image\//.test(f.type || ""));
    files.forEach((f) => readUploadFile(f, (img) => { if (img) setUploads((u) => [img, ...u]); }));
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragHi(false);
    if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const items = uploads.concat(results);
  const hasItems = items.length > 0;

  return (
    <div style={wrap}
      onDragOver={(e) => { e.preventDefault(); if (!dragHi) setDragHi(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragHi(false); }}
      onDrop={onDrop}
    >
      <div style={head}>
        <strong style={{ fontSize: 12, letterSpacing: 0.5 }}>Photos{hasItems ? " · " + items.length : ""}</strong>
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

      <div
        style={{ ...drop, ...(hasItems ? dropSm : dropBig), ...(dragHi ? dropHi : null) }}
        onClick={() => fileRef.current && fileRef.current.click()}
        title="Upload an image from your device"
      >
        <Upload size={hasItems ? 15 : 20} style={{ color: "#8a8a92" }} />
        <span style={{ fontSize: hasItems ? 12 : 13, color: "#dcdcdc" }}>Upload from device</span>
        {!hasItems && <span style={{ fontSize: 10.5, color: "#80808a" }}>Drag &amp; drop, or click · JPG · PNG · WEBP</span>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />

      {error && (
        <div style={{ margin: "0 12px 10px", padding: "8px 10px", background: "#3a1f22", color: "#ff9a9a", fontSize: 12, borderRadius: 6 }}>
          {error}
        </div>
      )}

      <div style={grid}>
        {items.map((img, i) => (
          <PhotoCard key={(img.url || "") + i} img={img} onSetBackground={onSetBackground} onAddImage={onAddImage} />
        ))}

        {loading && results.length === 0 && (
          <div style={hint}>Searching…</div>
        )}
        {!loading && !searched && uploads.length === 0 && (
          <div style={hint}>Search a topic to find a photo — or upload your own. Pick one to set it as this slide's background, or drop it on the canvas.</div>
        )}
        {!loading && searched && !error && results.length === 0 && uploads.length === 0 && (
          <div style={hint}>No photos found. Try a different search — or upload your own.</div>
        )}
      </div>
    </div>
  );
}
