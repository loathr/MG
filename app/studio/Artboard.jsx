"use client";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ARTBOARD_W, ARTBOARD_H } from "./model";
import { resize as geoResize, rotate as geoRotate, snapMove, handlePoint, axes } from "./geometry";
import ElementView from "./Element";
import Toolbar from "./Toolbar";

const HANDLES = [
  { sx: -1, sy: -1 }, { sx: 0, sy: -1 }, { sx: 1, sy: -1 },
  { sx: -1, sy: 0 }, { sx: 1, sy: 0 },
  { sx: -1, sy: 1 }, { sx: 0, sy: 1 }, { sx: 1, sy: 1 },
];

export default function Artboard({ slide, selectedId, editingId, dispatch }) {
  const containerRef = useRef(null);
  const artRef = useRef(null);
  const [scale, setScale] = useState(0.4);
  const [guides, setGuides] = useState([]);
  const drag = useRef(null);

  // Fit the artboard into the available space.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fit = () => {
      const pad = 48;
      const cw = el.clientWidth - pad;
      const ch = el.clientHeight - pad;
      const s = Math.max(0.05, Math.min(cw / ARTBOARD_W, ch / ARTBOARD_H));
      setScale(s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // client px -> artboard units, using the live measured scale (exact).
  const toArtboard = useCallback((clientX, clientY) => {
    const rect = artRef.current.getBoundingClientRect();
    const s = rect.width / ARTBOARD_W;
    return { x: (clientX - rect.left) / s, y: (clientY - rect.top) / s };
  }, []);

  const onWindowMove = useCallback((e) => {
    const d = drag.current;
    if (!d) return;
    const p = toArtboard(e.clientX, e.clientY);
    if (d.mode === "move") {
      const nx = d.startEl.x + (p.x - d.start.x);
      const ny = d.startEl.y + (p.y - d.start.y);
      const box = { x: nx, y: ny, w: d.startEl.w, h: d.startEl.h };
      const snapped = snapMove(box, { w: ARTBOARD_W, h: ARTBOARD_H }, d.siblings, 8);
      setGuides(snapped.guides);
      dispatch({ type: "update", id: d.id, patch: { x: Math.round(snapped.x), y: Math.round(snapped.y) } });
    } else if (d.mode === "resize") {
      const patch = geoResize(d.startEl, d.handle.sx, d.handle.sy, p, { min: 16 });
      dispatch({ type: "update", id: d.id, patch: roundBox(patch) });
    } else if (d.mode === "rotate") {
      const deg = geoRotate(d.startEl, p, 3);
      dispatch({ type: "update", id: d.id, patch: { rotation: Math.round(deg) } });
    }
  }, [dispatch, toArtboard]);

  const endDrag = useCallback(() => {
    drag.current = null;
    setGuides([]);
    window.removeEventListener("pointermove", onWindowMove);
    window.removeEventListener("pointerup", endDrag);
  }, [onWindowMove]);

  const beginDrag = useCallback((mode, id, clientX, clientY, handle) => {
    const startEl = slide.elements.find((e) => e.id === id);
    if (!startEl) return;
    drag.current = {
      mode, id, handle,
      start: toArtboard(clientX, clientY),
      startEl: Object.assign({}, startEl),
      siblings: slide.elements.filter((e) => e.id !== id).map((e) => ({ x: e.x, y: e.y, w: e.w, h: e.h })),
    };
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", endDrag);
  }, [slide, toArtboard, onWindowMove, endDrag]);

  // element body -> select + move
  const onPointerDownBody = useCallback((e, id) => {
    e.stopPropagation();
    dispatch({ type: "select", id });
    beginDrag("move", id, e.clientX, e.clientY);
  }, [dispatch, beginDrag]);

  const onStartEdit = useCallback((id) => dispatch({ type: "edit", id }), [dispatch]);
  const onCommitText = useCallback((id, text) => {
    dispatch({ type: "update", id, patch: { content: text } });
    dispatch({ type: "endEdit" });
  }, [dispatch]);

  useEffect(() => () => endDrag(), [endDrag]);

  const selected = selectedId ? slide.elements.find((e) => e.id === selectedId) : null;
  const bg = slide.background || {};

  return (
    <div ref={containerRef} style={{ flex: 1, minWidth: 0, minHeight: 0, display: "grid", placeItems: "center", overflow: "hidden", background: "#1c1c1f", position: "relative" }}>
      <div style={{ position: "relative", width: ARTBOARD_W * scale, height: ARTBOARD_H * scale, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
        {/* scaled artboard in artboard coordinates */}
        <div
          ref={artRef}
          style={{ position: "absolute", top: 0, left: 0, width: ARTBOARD_W, height: ARTBOARD_H, transform: "scale(" + scale + ")", transformOrigin: "top left", overflow: "hidden", background: bg.color || "#0c0c0c" }}
          onPointerDown={() => dispatch({ type: "deselect" })}
        >
          {bg.type === "image" && bg.src && (
            <img src={bg.src} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {bg.type === "image" && bg.scrim ? (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0," + bg.scrim + ")" }} />
          ) : null}

          {slide.elements.map((el) => (
            <ElementView
              key={el.id}
              element={el}
              isEditing={editingId === el.id}
              onPointerDownBody={onPointerDownBody}
              onStartEdit={onStartEdit}
              onCommitText={onCommitText}
            />
          ))}

          {/* snapping guides (artboard coords) */}
          {guides.map((g, i) =>
            g.axis === "x" ? (
              <div key={i} style={{ position: "absolute", left: g.pos - 1, top: 0, width: 2, height: ARTBOARD_H, background: "#ff2d9b", pointerEvents: "none" }} />
            ) : (
              <div key={i} style={{ position: "absolute", top: g.pos - 1, left: 0, height: 2, width: ARTBOARD_W, background: "#ff2d9b", pointerEvents: "none" }} />
            )
          )}
        </div>

        {/* selection overlay in SCREEN space so handles are a constant size */}
        {selected && !editingId && (
          <SelectionOverlay el={selected} scale={scale} onHandleDown={beginDrag} />
        )}

        {/* floating contextual toolbar, anchored above (or below) the selection */}
        {selected && !editingId && (() => {
          const topY = selected.y * scale;
          const below = topY < 56;
          return (
            <div style={{
              position: "absolute",
              left: (selected.x + selected.w / 2) * scale,
              top: below ? (selected.y + selected.h) * scale + 10 : topY - 10,
              transform: below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
              pointerEvents: "auto", zIndex: 20,
            }}>
              <Toolbar el={selected} dispatch={dispatch} />
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function roundBox(b) {
  return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) };
}

function SelectionOverlay({ el, scale, onHandleDown }) {
  const HS = 11; // handle screen size px
  const box = {
    position: "absolute",
    left: el.x * scale,
    top: el.y * scale,
    width: el.w * scale,
    height: el.h * scale,
    transform: "rotate(" + (el.rotation || 0) + "deg)",
    transformOrigin: "center center",
    border: "1.5px solid #2d8cff",
    pointerEvents: "none",
    boxSizing: "border-box",
  };
  // rotate handle sits above the top edge along the element's (rotated) top
  // normal, a constant ~26px on screen regardless of zoom.
  const topCenter = handlePoint(el, 0, -1);
  const uy = axes(el.rotation).uy; // top edge outward normal is -uy
  const off = 26 / scale; // artboard units that render to ~26px
  const rot = { x: topCenter.x - uy.x * off, y: topCenter.y - uy.y * off };
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={box} />
      {/* resize handles */}
      {HANDLES.map((h, i) => {
        const p = handlePoint(el, h.sx, h.sy);
        return (
          <div
            key={i}
            onPointerDown={(e) => { e.stopPropagation(); onHandleDown("resize", el.id, e.clientX, e.clientY, h); }}
            style={{
              position: "absolute",
              left: p.x * scale - HS / 2,
              top: p.y * scale - HS / 2,
              width: HS, height: HS,
              background: "#fff", border: "1.5px solid #2d8cff", borderRadius: 2,
              cursor: cursorFor(h, el.rotation), pointerEvents: "auto", boxSizing: "border-box",
            }}
          />
        );
      })}
      {/* rotate handle */}
      <div
        onPointerDown={(e) => { e.stopPropagation(); onHandleDown("rotate", el.id, e.clientX, e.clientY); }}
        style={{
          position: "absolute",
          left: rot.x * scale - 7,
          top: rot.y * scale - 7,
          width: 14, height: 14, borderRadius: "50%",
          background: "#fff", border: "1.5px solid #2d8cff",
          cursor: "grab", pointerEvents: "auto", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function cursorFor(h, rotation) {
  // base cursor by handle direction; good enough without rotation compensation
  if (h.sx === 0) return "ns-resize";
  if (h.sy === 0) return "ew-resize";
  if (h.sx === h.sy) return "nwse-resize";
  return "nesw-resize";
}
