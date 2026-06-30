"use client";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ARTBOARD_W, ARTBOARD_H, makeElement } from "./model";
import { resize as geoResize, rotate as geoRotate, snapMove, handlePoint, axes } from "./geometry";
import { readImageFile, isImageFile, fitDroppedImage } from "./imageFile";
import ElementView from "./Element";
import { UI } from "./theme";

const HANDLES = [
  { sx: -1, sy: -1 }, { sx: 0, sy: -1 }, { sx: 1, sy: -1 },
  { sx: -1, sy: 0 }, { sx: 1, sy: 0 },
  { sx: -1, sy: 1 }, { sx: 0, sy: 1 }, { sx: 1, sy: 1 },
];

export default function Artboard({ slide, selectedId, editingId, dispatch, onTextSelect, onEditApi }) {
  const containerRef = useRef(null);
  const artRef = useRef(null);
  const [scale, setScale] = useState(0.4);
  const [guides, setGuides] = useState([]);
  const [dropping, setDropping] = useState(false); // a file is being dragged over
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
    const wasDragging = !!drag.current;
    drag.current = null;
    setGuides([]);
    window.removeEventListener("pointermove", onWindowMove);
    window.removeEventListener("pointerup", endDrag);
    // Close the undo step: continuous move/resize/rotate updates coalesced into
    // one frame; the next interaction starts fresh.
    if (wasDragging) dispatch({ type: "commit" });
  }, [onWindowMove, dispatch]);

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
  const onCommitText = useCallback((id, text, runs) => {
    // B1 commits content AND the live runs read back from the editable; older
    // callers pass text only (runs stay whatever the store already holds).
    const patch = runs !== undefined ? { content: text, runs } : { content: text };
    dispatch({ type: "update", id, patch });
    dispatch({ type: "endEdit" });
  }, [dispatch]);
  // A per-span style apply: an atomic content+runs update that does NOT end the
  // edit, so styling can be stacked on the selection (see Element.applyRun).
  const onStyleApply = useCallback((id, content, runs) => {
    dispatch({ type: "update", id, patch: { content, runs } });
  }, [dispatch]);
  // End editing without a content change (blur with no edit) — the actual text
  // commit happens in Element's effect cleanup so it survives an unmount race.
  const onEndEdit = useCallback(() => dispatch({ type: "endEdit" }), [dispatch]);

  useEffect(() => () => endDrag(), [endDrag]);

  // Drag an image file straight onto the canvas → place it as a movable, resizable
  // element at the drop point. PNG alpha is preserved (readImageFile), large files
  // are downscaled, and the box fits within half the board centred on the drop.
  const dragHasImage = (e) => {
    const dt = e.dataTransfer;
    if (!dt) return false;
    if (dt.items && dt.items.length) return Array.from(dt.items).some((it) => it.kind === "file" && /^image\//.test(it.type || ""));
    return Array.from(dt.types || []).includes("Files");
  };
  const onCanvasDragOver = useCallback((e) => {
    if (!dragHasImage(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropping(true);
  }, []);
  const onCanvasDragLeave = useCallback((e) => {
    if (e.currentTarget === e.target) setDropping(false);
  }, []);
  const onCanvasDrop = useCallback((e) => {
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    e.preventDefault();
    setDropping(false);
    const file = Array.from(e.dataTransfer.files).find(isImageFile);
    if (!file) return;
    const p = toArtboard(e.clientX, e.clientY);
    readImageFile(file, (img) => {
      if (!img) return;
      const box = fitDroppedImage(img.w, img.h, p.x, p.y, ARTBOARD_W, ARTBOARD_H);
      dispatch({ type: "add", element: makeElement("image", {
        x: box.x, y: box.y, w: box.w, h: box.h, src: img.src, thumb: img.thumb, fit: "contain",
      }) });
    });
  }, [toArtboard, dispatch]);

  const selected = selectedId ? slide.elements.find((e) => e.id === selectedId) : null;
  const bg = slide.background || {};

  return (
    <div ref={containerRef} style={{ flex: 1, minWidth: 0, minHeight: 0, display: "grid", placeItems: "center", overflow: "hidden", background: UI.bg, position: "relative" }}
      onDragOver={onCanvasDragOver} onDragLeave={onCanvasDragLeave} onDrop={onCanvasDrop}>
      <div style={{ position: "relative", width: ARTBOARD_W * scale, height: ARTBOARD_H * scale, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
        {/* scaled artboard in artboard coordinates */}
        <div
          ref={artRef}
          data-artboard
          style={{ position: "absolute", top: 0, left: 0, width: ARTBOARD_W, height: ARTBOARD_H, transform: "scale(" + scale + ")", transformOrigin: "top left", overflow: "hidden", background: bg.color || "#0c0c0c" }}
          onPointerDown={() => dispatch({ type: "deselect" })}
        >
          {/* The ONE heavy decode: the active slide's full-res background. Off-
              screen slides never mount this (they render bg.thumb in SlideThumb),
              so a 9-slide photo deck only ever holds one full-res image in native
              memory at a time — the FLAT-LAYERS §3 invariant. data-role makes that
              assertable from the browser. */}
          {bg.type === "image" && bg.src && (
            <img data-role="artboard-bg" src={bg.src} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
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
              onEndEdit={onEndEdit}
              onTextSelect={onTextSelect}
              onEditApi={onEditApi}
              onStyleApply={onStyleApply}
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

        {/* F1: detach the background photo into an editable layer. Shown only when
            the slide's background is a photo and nothing is selected — feature
            layouts (photo already an element) never show it. */}
        {bg.type === "image" && bg.src && !selected && !editingId && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => dispatch({ type: "detachPhoto" })}
            title="Detach the photo to a movable, resizable layer"
            style={{
              position: "absolute", left: 10, top: 10, zIndex: 20,
              display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px",
              background: "rgba(20,20,24,0.82)", color: "#fff", border: "1px solid #ffffff33",
              borderRadius: 16, cursor: "pointer", fontSize: 12.5, fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >✎ Edit photo</button>
        )}

        {/* selection overlay in SCREEN space so handles are a constant size.
            (R3: contextual controls now live in the right Inspector, not a
            floating toolbar — the canvas stays unobstructed.) */}
        {selected && !editingId && (
          <SelectionOverlay el={selected} scale={scale} onHandleDown={beginDrag} />
        )}

        {/* drop-to-place highlight while an image file is dragged over the canvas */}
        {dropping && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none",
            border: "2px dashed " + UI.select, borderRadius: 4, background: "rgba(45,140,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ background: "rgba(20,20,24,0.85)", color: "#cfe2ff", fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 16, fontFamily: "Helvetica, Arial, sans-serif" }}>
              Drop image to place · PNG transparency kept
            </span>
          </div>
        )}
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
    border: "1.5px solid " + UI.select,
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
              background: "#fff", border: "1.5px solid " + UI.select, borderRadius: 2,
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
          background: "#fff", border: "1.5px solid " + UI.select,
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
