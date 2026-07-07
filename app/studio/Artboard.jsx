"use client";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ARTBOARD_W, ARTBOARD_H, makeElement, cropAnchor, reframeCrop } from "./model";
import { resize as geoResize, rotate as geoRotate, snapMove, snapResize, scaleTextResize, imageCornerResize, wheelZoom, handlePoint, axes } from "./geometry";
import { readImageFile, isImageFile, fitDroppedImage } from "./imageFile";
import ElementView from "./Element";
import { UI } from "./theme";
import { expandGroups, marqueeHits, selectionBox } from "./group";
import { Pencil, Copy, Scissors, ClipboardPaste, CopyPlus, Trash2, Group, Ungroup, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal } from "lucide-react";

const HANDLES = [
  { sx: -1, sy: -1 }, { sx: 0, sy: -1 }, { sx: 1, sy: -1 },
  { sx: -1, sy: 0 }, { sx: 1, sy: 0 },
  { sx: -1, sy: 1 }, { sx: 0, sy: 1 }, { sx: 1, sy: 1 },
];

const clamp01 = (n) => Math.max(0, Math.min(1, n));

export default function Artboard({ slide, selectedId, selectedIds, editingId, croppingId, dispatch, onTextSelect, onEditApi, canPaste, peers, slideIndex, onCursor }) {
  const containerRef = useRef(null);
  const artRef = useRef(null);
  const [scale, setScale] = useState(0.4);
  const [guides, setGuides] = useState([]);
  const [dropping, setDropping] = useState(false); // a file is being dragged over
  const [marquee, setMarquee] = useState(null);    // rubber-band rect (artboard coords) or null
  const drag = useRef(null);
  const multi = (selectedIds || []).length > 1;
  // Latest slide, read by the (once-attached) wheel listener without re-binding.
  const slideRef = useRef(slide);
  slideRef.current = slide;
  const wheelCommit = useRef(null);

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

  // Scroll-to-zoom: when a plain image is selected, the wheel zooms its crop
  // (enlarge/minimize) instead of scrolling the page. Native non-passive listener
  // so preventDefault works; reads the live slide via a ref so it binds once per
  // selection. No-op (normal scroll) when the selection isn't an image.
  useEffect(() => {
    const node = artRef.current;
    if (!node) return undefined;
    const onWheel = (e) => {
      const el = (slideRef.current.elements || []).find((x) => x.id === selectedId);
      if (!el || el.type !== "image" || el.locked) return; // let the page scroll
      e.preventDefault();
      dispatch({ type: "update", id: el.id, patch: { crop: wheelZoom(el, e.deltaY) }, coalesce: true });
      if (wheelCommit.current) clearTimeout(wheelCommit.current);
      wheelCommit.current = setTimeout(() => dispatch({ type: "commit" }), 250);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [selectedId, dispatch]);

  // client px -> artboard units, using the live measured scale (exact).
  const toArtboard = useCallback((clientX, clientY) => {
    const rect = artRef.current.getBoundingClientRect();
    const s = rect.width / ARTBOARD_W;
    return { x: (clientX - rect.left) / s, y: (clientY - rect.top) / s };
  }, []);

  // Report my pointer to the presence layer (artboard units, so peers at any zoom
  // agree). Throttling + writes happen in usePresence; this just forwards.
  const onCanvasPointerMove = useCallback((e) => {
    if (!onCursor || !artRef.current) return;
    const p = toArtboard(e.clientX, e.clientY);
    onCursor({ x: Math.round(p.x), y: Math.round(p.y) });
  }, [onCursor, toArtboard]);

  const onWindowMove = useCallback((e) => {
    const d = drag.current;
    if (!d) return;
    const p = toArtboard(e.clientX, e.clientY);
    // Hold Alt/Option to bypass snapping for fine, unconstrained placement.
    const noSnap = e.altKey;
    if (d.mode === "marquee") {
      // Rubber-band select: draw the rect (screen feedback). Stash it on the drag
      // ref so pointer-up reads the final rect without a stale-closure hazard.
      const rect = { x: d.start.x, y: d.start.y, w: p.x - d.start.x, h: p.y - d.start.y };
      d.rect = rect;
      setMarquee(rect);
      return;
    }
    if (d.mode === "moveMany") {
      // Drag a whole selection/group: dispatch the INCREMENT since the last event so
      // the store's delta-based moveMany accumulates exactly (one coalesced frame).
      const dx = Math.round(p.x - d.start.x), dy = Math.round(p.y - d.start.y);
      const ddx = dx - d.lastDx, ddy = dy - d.lastDy;
      if (ddx || ddy) { dispatch({ type: "moveMany", ids: d.ids, dx: ddx, dy: ddy, coalesce: true }); d.lastDx = dx; d.lastDy = dy; }
      return;
    }
    if (d.mode === "move") {
      const nx = d.startEl.x + (p.x - d.start.x);
      const ny = d.startEl.y + (p.y - d.start.y);
      const box = { x: nx, y: ny, w: d.startEl.w, h: d.startEl.h };
      const snapped = noSnap ? { x: nx, y: ny, guides: [] } : snapMove(box, { w: ARTBOARD_W, h: ARTBOARD_H }, d.siblings, 8);
      setGuides(snapped.guides);
      // "move" (not a plain x/y update) so any element tethered to this one (B6)
      // is dragged along by the same delta.
      dispatch({ type: "move", id: d.id, x: Math.round(snapped.x), y: Math.round(snapped.y), coalesce: true });
    } else if (d.mode === "resize") {
      const box0 = geoResize(d.startEl, d.handle.sx, d.handle.sy, p, { min: 16 });
      const isCorner = d.handle.sx !== 0 && d.handle.sy !== 0;
      if (d.startEl.type === "text" && isCorner && !d.startEl.rotation) {
        // Font-aware: a corner scales the type (+ box + tracking) proportionally;
        // edge handles fall through to the reflow path below.
        setGuides([]);
        dispatch({ type: "update", id: d.id, patch: scaleTextResize(d.startEl, d.handle.sx, d.handle.sy, box0), coalesce: true });
      } else if (d.startEl.type === "image" && !d.startEl.rotation) {
        // Resize the frame; dragging PAST the artboard edge folds the overflow into
        // crop.zoom (enlarge). The separate reframe/crop modes are untouched.
        setGuides([]);
        dispatch({ type: "update", id: d.id, patch: imageCornerResize(d.startEl, d.handle.sx, d.handle.sy, box0, { w: ARTBOARD_W, h: ARTBOARD_H }), coalesce: true });
      } else {
        // Snap the moving edge(s) to artboard/sibling lines — skipped when Alt is
        // held or the element is rotated (guides assume axis-aligned, like snapMove).
        let box = box0;
        if (!noSnap && !d.startEl.rotation) {
          const sn = snapResize(box0, d.handle.sx, d.handle.sy, { w: ARTBOARD_W, h: ARTBOARD_H }, d.siblings, 8, 16);
          setGuides(sn.guides);
          box = sn;
        } else setGuides([]);
        dispatch({ type: "update", id: d.id, patch: roundBox(box), coalesce: true });
      }
    } else if (d.mode === "reframe") {
      // True crop: dragging a crop handle resizes the FRAME while the compensated
      // crop keeps the image pinned on the artboard (see model.reframeCrop) — the
      // window reveals/hides image instead of shrinking it.
      const box = geoResize(d.startEl, d.handle.sx, d.handle.sy, p, { min: 16 });
      const crop = reframeCrop(d.nat, d.anchor, box);
      dispatch({ type: "update", id: d.id, patch: Object.assign(roundBox(box), { crop }), coalesce: true });
    } else if (d.mode === "rotate") {
      const deg = geoRotate(d.startEl, p, 3);
      dispatch({ type: "update", id: d.id, patch: { rotation: Math.round(deg) }, coalesce: true });
    } else if (d.mode === "crop") {
      // Free-form crop: dragging the photo pans its focal point. Moving the photo
      // right reveals its left edge, so focal x DECREASES with a rightward drag.
      // The pan range tracks the overscan (~ box·(z-1)); a floor keeps z≈1 usable.
      const el0 = d.startEl;
      const c0 = el0.crop || { zoom: 1, x: 0.5, y: 0.5 };
      const z = Math.max(1, c0.zoom || 1);
      const nx = clamp01((c0.x == null ? 0.5 : c0.x) - (p.x - d.start.x) / (el0.w * Math.max(z - 1, 0.6)));
      const ny = clamp01((c0.y == null ? 0.5 : c0.y) - (p.y - d.start.y) / (el0.h * Math.max(z - 1, 0.6)));
      dispatch({ type: "update", id: d.id, patch: { crop: { zoom: z, x: nx, y: ny } }, coalesce: true });
    }
  }, [dispatch, toArtboard]);

  const endDrag = useCallback(() => {
    const d = drag.current;
    drag.current = null;
    setGuides([]);
    window.removeEventListener("pointermove", onWindowMove);
    window.removeEventListener("pointerup", endDrag);
    if (d && d.mode === "marquee") {
      // Commit the rubber-band: a real drag selects the hits; a click (no drag)
      // clears the selection. Reads the final rect + live slide via refs.
      const r = d.rect;
      setMarquee(null);
      if (r && (Math.abs(r.w) > 3 || Math.abs(r.h) > 3)) {
        const ids = marqueeHits((slideRef.current.elements || []), r);
        dispatch(ids.length ? { type: "selectMarquee", ids } : { type: "deselect" });
      } else {
        dispatch({ type: "deselect" });
      }
      return;
    }
    // Close the undo step: continuous move/resize/rotate updates coalesced into
    // one frame; the next interaction starts fresh.
    if (d) dispatch({ type: "commit" });
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
    // Reframe needs the image's natural pixel size (read from the mounted <img>) to
    // pin it while the frame changes. If we can't read it, fall back to a plain
    // resize so the handle still does something sane.
    if (mode === "reframe") {
      const node = artRef.current && artRef.current.querySelector('img[data-crop-img="' + id + '"]');
      if (node && node.naturalWidth && node.naturalHeight) {
        const nat = { w: node.naturalWidth, h: node.naturalHeight };
        drag.current.nat = nat;
        drag.current.anchor = cropAnchor(startEl, nat);
      } else {
        drag.current.mode = "resize";
      }
    }
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", endDrag);
  }, [slide, toArtboard, onWindowMove, endDrag]);

  // Drag a whole set of ids as one rigid group (multi-selection / grouped elements),
  // dispatching moveMany deltas. No per-element snapping — the set moves as a block.
  const beginGroupDrag = useCallback((ids, clientX, clientY) => {
    drag.current = { mode: "moveMany", ids: ids.slice(), start: toArtboard(clientX, clientY), lastDx: 0, lastDy: 0 };
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", endDrag);
  }, [toArtboard, onWindowMove, endDrag]);

  // Empty-canvas press starts a rubber-band marquee (not an immediate deselect) so
  // you can lasso several elements; a click with no drag clears the selection.
  const beginMarquee = useCallback((clientX, clientY) => {
    const p = toArtboard(clientX, clientY);
    drag.current = { mode: "marquee", start: p };
    setMarquee({ x: p.x, y: p.y, w: 0, h: 0 });
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", endDrag);
  }, [toArtboard, onWindowMove, endDrag]);

  // element body -> select + move, OR pan the focal point when in crop mode
  const onPointerDownBody = useCallback((e, id) => {
    e.stopPropagation();
    // ⇧-click toggles this element's group in/out of the multi-selection (no drag).
    if (e.shiftKey) { dispatch({ type: "select", id, additive: true }); return; }
    // Decide what moves. Clicking a member of the current multi-selection keeps that
    // selection and drags the whole block; otherwise (re)select this element — which
    // pulls in its group — and drag that.
    const cur = selectedIds || [];
    if (cur.includes(id) && cur.length > 1) { beginGroupDrag(cur, e.clientX, e.clientY); return; }
    dispatch({ type: "select", id });
    const dragIds = expandGroups(slide.elements, [id]);
    if (dragIds.length > 1) beginGroupDrag(dragIds, e.clientX, e.clientY);
    else beginDrag("move", id, e.clientX, e.clientY);
  }, [dispatch, beginDrag, beginGroupDrag, selectedIds, slide]);

  const onStartEdit = useCallback((id) => dispatch({ type: "edit", id }), [dispatch]);
  const onStartCrop = useCallback((id) => dispatch({ type: "crop", id }), [dispatch]);
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

  // Scroll / pinch to zoom the photo being cropped (free-form crop). Native
  // non-passive listener so preventDefault stops the page/canvas from scrolling.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || !croppingId) return undefined;
    const onWheel = (e) => {
      const el = slide.elements.find((x) => x.id === croppingId);
      if (!el) return;
      e.preventDefault();
      const c0 = el.crop || { zoom: 1, x: 0.5, y: 0.5 };
      const z = Math.max(1, Math.min(4, (c0.zoom || 1) - e.deltaY * 0.0015));
      dispatch({ type: "update", id: croppingId, patch: { crop: { zoom: z, x: c0.x == null ? 0.5 : c0.x, y: c0.y == null ? 0.5 : c0.y } }, coalesce: true });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [croppingId, slide, dispatch]);

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
  const cropEl = croppingId ? slide.elements.find((e) => e.id === croppingId) : null;
  const bg = slide.background || {};

  return (
    <div ref={containerRef} style={{ flex: 1, minWidth: 0, minHeight: 0, display: "grid", placeItems: "center", overflow: "hidden", background: UI.bg, position: "relative" }}
      onDragOver={onCanvasDragOver} onDragLeave={onCanvasDragLeave} onDrop={onCanvasDrop}
      onPointerMove={onCanvasPointerMove}
      onPointerDown={(e) => { if (e.target === e.currentTarget) dispatch({ type: "deselect" }); }}>
      <div style={{ position: "relative", width: ARTBOARD_W * scale, height: ARTBOARD_H * scale, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
        {/* scaled artboard in artboard coordinates */}
        <div
          ref={artRef}
          data-artboard
          /* overflow:visible (not hidden) so an element that runs past the board edge
             stays painted AND hit-testable — you can select/drag the part hanging off
             the canvas. The board's crop is re-imposed for export/thumbnails by their
             own renderers; the dim "mat" below reads the off-board area as bleed. */
          style={{ position: "absolute", top: 0, left: 0, width: ARTBOARD_W, height: ARTBOARD_H, transform: "scale(" + scale + ")", transformOrigin: "top left", overflow: "visible", background: bg.color || "#0c0c0c" }}
          onPointerDown={(e) => { if (!croppingId) { e.stopPropagation(); beginMarquee(e.clientX, e.clientY); } }}
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
              isCropping={croppingId === el.id}
              onPointerDownBody={onPointerDownBody}
              onStartEdit={onStartEdit}
              onStartCrop={onStartCrop}
              onCommitText={onCommitText}
              onEndEdit={onEndEdit}
              onTextSelect={onTextSelect}
              onEditApi={onEditApi}
              onStyleApply={onStyleApply}
            />
          ))}

          {/* Remote selections (collab): a coloured outline + name on whatever each
              other editor has selected on THIS slide. Artboard coords, so they scale
              with the elements. pointerEvents:none — purely informational. */}
          {(peers || []).filter((pr) => pr.slide === slideIndex && pr.selection && pr.selection.length).map((pr) => (
            (pr.selection || []).map((sid) => {
              const el = slide.elements.find((e) => e.id === sid);
              if (!el) return null;
              return (
                <div key={pr.id + ":" + sid} style={{
                  position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h,
                  transform: "rotate(" + (el.rotation || 0) + "deg)", transformOrigin: "center center",
                  border: "2px solid " + pr.color, borderRadius: (el.radius || 0), pointerEvents: "none", boxSizing: "border-box",
                }}>
                  <span style={{ position: "absolute", left: -2, top: -22, fontSize: 11, fontWeight: 600, color: "#0a0a0a", background: pr.color, padding: "1px 7px", borderRadius: "4px 4px 4px 0", whiteSpace: "nowrap" }}>{pr.name}</span>
                </div>
              );
            })
          ))}

          {/* rubber-band marquee (artboard coords; normalised for up-left drags) */}
          {marquee && (Math.abs(marquee.w) > 1 || Math.abs(marquee.h) > 1) && (
            <div style={{
              position: "absolute",
              left: Math.min(marquee.x, marquee.x + marquee.w),
              top: Math.min(marquee.y, marquee.y + marquee.h),
              width: Math.abs(marquee.w), height: Math.abs(marquee.h),
              border: "1px solid " + UI.select, background: "rgba(45,140,255,0.12)",
              pointerEvents: "none",
            }} />
          )}

          {/* snapping guides (artboard coords) */}
          {guides.map((g, i) =>
            g.axis === "x" ? (
              <div key={i} style={{ position: "absolute", left: g.pos - 1, top: 0, width: 2, height: ARTBOARD_H, background: "#ff2d9b", pointerEvents: "none" }} />
            ) : (
              <div key={i} style={{ position: "absolute", top: g.pos - 1, left: 0, height: 2, width: ARTBOARD_W, background: "#ff2d9b", pointerEvents: "none" }} />
            )
          )}
        </div>

        {/* Bleed "mat": a board-sized transparent box whose huge spread-shadow dims
            everything OUTSIDE the board (clipped by the container). It sits above the
            off-board element bleed but below the detach button and selection handles
            (DOM order + auto z-index), so the hanging-off part reads as bleed while its
            handles stay bright and grabbable. pointerEvents:none keeps it click-through. */}
        <div style={{ position: "absolute", inset: 0, boxShadow: "0 0 0 9999px rgba(10,10,12,0.55)", pointerEvents: "none" }} />

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
          ><Pencil size={14} /> Edit photo</button>
        )}

        {/* selection overlay in SCREEN space so handles are a constant size.
            (R3: contextual controls now live in the right Inspector, not a
            floating toolbar — the canvas stays unobstructed.) */}
        {selected && !multi && !editingId && !cropEl && (
          <SelectionOverlay el={selected} scale={scale} onHandleDown={beginDrag} />
        )}

        {/* Floating action bar above the selected element — copy / cut / paste /
            duplicate / delete, mirroring ⌘C/⌘X/⌘V/⌘D and the toolbar ⋯ menu. */}
        {selected && !multi && !editingId && !cropEl && (
          <ActionBar el={selected} scale={scale} canPaste={canPaste} dispatch={dispatch} />
        )}

        {/* Multi-selection: a dashed bounding box over the whole set, plus a toolbar
            to group/ungroup, align, and delete them as a block. Individual element
            handles are hidden — the selection moves as one (drag any member). */}
        {multi && !editingId && !cropEl && (() => {
          const gbox = selectionBox(slide.elements, selectedIds);
          if (!gbox) return null;
          const anyGrouped = (slide.elements || []).some((e) => selectedIds.includes(e.id) && e.groupId);
          return (
            <>
              <div style={{
                position: "absolute", left: gbox.x * scale, top: gbox.y * scale,
                width: gbox.w * scale, height: gbox.h * scale,
                border: "1.5px dashed " + UI.select, boxSizing: "border-box", pointerEvents: "none",
              }} />
              <GroupBar box={gbox} scale={scale} count={selectedIds.length} anyGrouped={anyGrouped} dispatch={dispatch} />
            </>
          );
        })()}

        {/* Crop dimming ring (Option B): while cropping, darken the canvas AROUND
            the crop box so the frame is the focus. One element sized to the box with
            a huge spread box-shadow; the container's overflow:hidden clips the shadow
            to the viewport (never the whole page). Non-clicking + below the pan layer,
            so it never blocks a pan/reframe. Live canvas only — export/thumbnails
            never enter crop mode, so they're untouched. */}
        {cropEl && (
          <div
            style={{
              position: "absolute", left: cropEl.x * scale, top: cropEl.y * scale,
              width: cropEl.w * scale, height: cropEl.h * scale,
              transform: "rotate(" + (cropEl.rotation || 0) + "deg)", transformOrigin: "center center",
              borderRadius: (cropEl.radius || 0) * scale,
              boxShadow: "0 0 0 9999px rgba(6,6,8,0.6)",
              pointerEvents: "none", zIndex: 21,
            }}
          />
        )}

        {/* Free-form crop capture: a transparent layer over the cropped image's box
            (above any scrim/text that overlaps it) so a drag anywhere in the box
            pans the photo. The rule-of-thirds guide (Element) shows beneath it. */}
        {cropEl && (
          <div
            onPointerDown={(e) => { e.stopPropagation(); beginDrag("crop", cropEl.id, e.clientX, e.clientY); }}
            style={{
              position: "absolute", left: cropEl.x * scale, top: cropEl.y * scale,
              width: cropEl.w * scale, height: cropEl.h * scale,
              transform: "rotate(" + (cropEl.rotation || 0) + "deg)", transformOrigin: "center center",
              cursor: "grab", zIndex: 22, touchAction: "none",
            }}
          />
        )}
        {/* Crop reframe: resize handles on the crop frame (above the pan layer) so
            you can pull the edges in/out to reframe while the interior pans. */}
        {cropEl && (
          <SelectionOverlay el={cropEl} scale={scale} onHandleDown={beginDrag} cropMode />
        )}

        {/* drop-to-place highlight while an image file is dragged over the canvas
            — a quiet outline, no prompt text (decluttered). */}
        {dropping && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none",
            border: "2px dashed " + UI.select, borderRadius: 4, background: "rgba(45,140,255,0.07)",
          }} />
        )}

        {/* Remote cursors (collab): each other editor's pointer on THIS slide, name-
            tagged in their colour. Screen space (constant size at any zoom) with a
            short transition so they glide between throttled updates. */}
        {(peers || []).filter((pr) => pr.slide === slideIndex && pr.cursor).map((pr) => (
          <div key={pr.id} style={{
            position: "absolute", left: pr.cursor.x * scale, top: pr.cursor.y * scale,
            zIndex: 40, pointerEvents: "none", transition: "left .12s linear, top .12s linear",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: "block", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
              <path d="M2 2 L2 15 L6 11 L9 17 L11 16 L8 10 L14 10 Z" fill={pr.color} stroke="#0a0a0a" strokeWidth="0.6" />
            </svg>
            <span style={{ position: "absolute", left: 14, top: 13, fontSize: 10, fontWeight: 600, color: "#0a0a0a", background: pr.color, padding: "2px 7px", borderRadius: "4px 8px 8px 8px", whiteSpace: "nowrap" }}>{pr.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function roundBox(b) {
  return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) };
}

function SelectionOverlay({ el, scale, onHandleDown, cropMode }) {
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
    // In crop mode the resize handles must sit ABOVE the pan capture layer (z22)
    // so dragging an edge reframes (pull in/out) while the interior still pans.
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: cropMode ? 24 : undefined }}>
      <div style={box} />
      {/* resize handles */}
      {HANDLES.map((h, i) => {
        const p = handlePoint(el, h.sx, h.sy);
        return (
          <div
            key={i}
            onPointerDown={(e) => { e.stopPropagation(); onHandleDown(cropMode ? "reframe" : "resize", el.id, e.clientX, e.clientY, h); }}
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
      {/* rotate handle — hidden in crop mode (reframing only) */}
      {!cropMode && <div
        onPointerDown={(e) => { e.stopPropagation(); onHandleDown("rotate", el.id, e.clientX, e.clientY); }}
        style={{
          position: "absolute",
          left: rot.x * scale - 7,
          top: rot.y * scale - 7,
          width: 14, height: 14, borderRadius: "50%",
          background: "#fff", border: "1.5px solid " + UI.select,
          cursor: "grab", pointerEvents: "auto", boxSizing: "border-box",
        }}
      />}
    </div>
  );
}

// The floating element action bar. Positioned in SCREEN space above the element's
// (un-rotated) bounding box; flips below when there's no room above. pointerEvents
// isolated so a click acts on the button, never the canvas beneath.
function ActionBar({ el, scale, canPaste, dispatch }) {
  const H = 40; // approx bar height incl. gap
  const topAbove = el.y * scale - H;
  const below = topAbove < 4;
  const top = below ? (el.y + el.h) * scale + 8 : el.y * scale - H;
  const left = (el.x + el.w / 2) * scale;
  const act = (type, extra) => (e) => { e.stopPropagation(); dispatch(Object.assign({ type }, extra)); };
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute", left, top, transform: "translateX(-50%)", zIndex: 25,
        display: "inline-flex", gap: 2, padding: "4px 5px",
        background: "rgba(20,20,24,0.94)", border: "1px solid #34343c", borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
      }}
    >
      <AB title="Copy (⌘C)" onClick={act("copyEl", { id: el.id })}><Copy size={15} /></AB>
      <AB title="Cut (⌘X)" onClick={act("cut", { id: el.id })}><Scissors size={15} /></AB>
      <AB title="Paste (⌘V)" onClick={canPaste ? act("paste") : undefined} disabled={!canPaste}><ClipboardPaste size={15} /></AB>
      <AB title="Duplicate (⌘D)" onClick={act("duplicate", { id: el.id })}><CopyPlus size={15} /></AB>
      <AB title="Delete (⌫)" danger onClick={act("delete", { id: el.id })}><Trash2 size={15} /></AB>
    </div>
  );
}
// The multi-selection toolbar: group / ungroup, the six alignments, and delete.
// Positioned above the selection's bounding box (flips below when there's no room).
function GroupBar({ box, scale, count, anyGrouped, dispatch }) {
  const H = 40;
  const topAbove = box.y * scale - H;
  const below = topAbove < 4;
  const top = below ? (box.y + box.h) * scale + 8 : topAbove;
  const left = (box.x + box.w / 2) * scale;
  const act = (type, extra) => (e) => { e.stopPropagation(); dispatch(Object.assign({ type }, extra)); };
  const align = (mode) => (e) => { e.stopPropagation(); dispatch({ type: "align", mode }); };
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute", left, top, transform: "translateX(-50%)", zIndex: 25,
        display: "inline-flex", alignItems: "center", gap: 2, padding: "4px 5px",
        background: "rgba(20,20,24,0.94)", border: "1px solid #34343c", borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 11, color: "#8a8a92", padding: "0 6px", fontFamily: "Helvetica, Arial, sans-serif" }}>{count}</span>
      {anyGrouped
        ? <AB title="Ungroup (⌘⇧G)" onClick={act("ungroup")}><Ungroup size={15} /></AB>
        : <AB title="Group (⌘G)" onClick={act("group")}><Group size={15} /></AB>}
      <span style={sep} />
      <AB title="Align left" onClick={align("left")}><AlignStartVertical size={15} /></AB>
      <AB title="Align center" onClick={align("centerX")}><AlignCenterVertical size={15} /></AB>
      <AB title="Align right" onClick={align("right")}><AlignEndVertical size={15} /></AB>
      <AB title="Align top" onClick={align("top")}><AlignStartHorizontal size={15} /></AB>
      <AB title="Align middle" onClick={align("centerY")}><AlignCenterHorizontal size={15} /></AB>
      <AB title="Align bottom" onClick={align("bottom")}><AlignEndHorizontal size={15} /></AB>
      <span style={sep} />
      <AB title="Delete (⌫)" danger onClick={act("deleteMany")}><Trash2 size={15} /></AB>
    </div>
  );
}
const sep = { width: 1, height: 20, background: "#34343c", margin: "0 3px" };

function AB({ children, onClick, title, danger, disabled }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "transparent", border: "none", borderRadius: 7,
        color: disabled ? "#5a5a62" : danger ? "#ff8a8a" : "#dcdce2",
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#2a2a31"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >{children}</button>
  );
}

function cursorFor(h, rotation) {
  // base cursor by handle direction; good enough without rotation compensation
  if (h.sx === 0) return "ns-resize";
  if (h.sy === 0) return "ew-resize";
  if (h.sx === h.sy) return "nwse-resize";
  return "nesw-resize";
}
