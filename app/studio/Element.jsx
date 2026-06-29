"use client";
import React, { useCallback, useEffect, useRef } from "react";
import RichText from "./RichText";
import ShapeBacking from "./ShapeBacking";
import { shapePad } from "./shapes";
import { styledRuns, applyRunStyle, clearRunStyle, remapRuns } from "./model";
import { selectionOffsets } from "./richedit";

// The resolved style span covering character `idx` (for the format bar / Inspector
// active states), or null.
function spanStyleAt(el, idx) {
  const spans = styledRuns(el);
  let acc = 0;
  for (const sp of spans) { if (idx < acc + sp.text.length) return sp; acc += sp.text.length; }
  return spans.length ? spans[spans.length - 1] : null;
}

// One element. Wrapped in React.memo so it re-renders only when its own object
// (or its editing flag) changes — the key to Canva-like drag performance.
function ElementView({ element: el, isEditing, onPointerDownBody, onStartEdit, onCommitText, onEndEdit, onTextSelect, onEditApi, onStyleApply }) {
  const editRef = useRef(null);
  const pendingRef = useRef(null); // latest typed text, tracked without re-rendering
  const cancelledRef = useRef(false); // Escape reverts the edit instead of committing
  const elRef = useRef(el);
  elRef.current = el; // always read the latest element from the imperative handlers

  // Report the current text selection (offsets + screen rect + effective style)
  // up to the Studio so the format bar / Inspector can style just that span.
  // Collapsed selections (a plain caret) are ignored; typing clears via onInput.
  const reportSel = useCallback(() => {
    const node = editRef.current;
    if (!node || !onTextSelect) return;
    const off = selectionOffsets(node);
    if (!off || off.end <= off.start) return;
    let rect = null;
    try { rect = window.getSelection().getRangeAt(0).getBoundingClientRect(); } catch (e) { /* ignore */ }
    const cur = elRef.current;
    const content = pendingRef.current != null ? pendingRef.current : cur.content;
    onTextSelect({
      id: cur.id, start: off.start, end: off.end,
      text: String(content).slice(off.start, off.end),
      rect: rect && rect.width ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null,
      style: spanStyleAt(cur, off.start),
    });
  }, [onTextSelect]);

  // Apply (or clear) a style patch over the current selection. Reads the live DOM
  // text + selection (the format controls keep focus via onMouseDown→preventDefault)
  // and dispatches ONE atomic content+runs update, so there is no commit/apply
  // race and the run lands on exactly the selected characters.
  const applyRun = useCallback((patch, clear) => {
    const node = editRef.current;
    if (!node) return;
    const off = selectionOffsets(node);
    if (!off || off.end <= off.start) return;
    const text = node.innerText;
    const cur = elRef.current;
    const base = remapRuns(cur.runs || [], cur.content, text);
    const runs = clear
      ? clearRunStyle(text, base, off.start, off.end)
      : applyRunStyle(text, base, off.start, off.end, patch);
    pendingRef.current = text;
    if (onStyleApply) onStyleApply(cur.id, text, runs);
  }, [onStyleApply]);

  useEffect(() => {
    if (!isEditing || !editRef.current) return;
    const node = editRef.current;
    pendingRef.current = el.content; // baseline at edit start
    cancelledRef.current = false;
    node.focus();
    // place caret at the end
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    // Expose the style API + listen for selection changes while editing.
    if (onEditApi) onEditApi({ applyStyle: (p) => applyRun(p, false), clearStyle: () => applyRun(null, true) });
    document.addEventListener("selectionchange", reportSel);
    // Commit when editing ends by ANY path — blur, clicking the canvas
    // (deselect), selecting another element, a slide change, or unmount. The old
    // code committed only in the contentEditable's onBlur, but clicking outside
    // unmounts this node before its blur fires, so the typed text was dropped and
    // the element snapped back to its original — the "edit reverts" bug. The
    // effect cleanup always runs on isEditing -> false, so we commit here instead.
    return () => {
      document.removeEventListener("selectionchange", reportSel);
      if (onEditApi) onEditApi(null);
      if (onTextSelect) onTextSelect(null);
      if (cancelledRef.current) return; // Escape — discard, keep the original
      const text = pendingRef.current;
      if (text != null && text !== el.content) onCommitText(el.id, text);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const frame = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    transform: "rotate(" + (el.rotation || 0) + "deg)",
    transformOrigin: "center center",
    opacity: el.opacity == null ? 1 : el.opacity,
    cursor: isEditing ? "text" : "move",
    userSelect: isEditing ? "text" : "none",
    touchAction: "none",
  };
  // Locked elements (e.g. the deck frame bars) are pure chrome: non-interactive,
  // so a full-bleed-edge frame never intercepts a click meant for the content
  // beneath it. Removed/changed via its own control (Brand → Look), not the canvas.
  if (el.locked) { frame.pointerEvents = "none"; frame.cursor = "default"; }

  let inner = null;
  if (el.type === "text") {
    // A text element may wear a SHAPE backing (shapes.js): the shape renders
    // behind the copy and the text sits in a padded, centered layer on top —
    // staying a fully-editable text box. Plain text keeps the top-aligned fill.
    const shaped = !!el.shape;
    const textStyle = {
      width: "100%",
      height: shaped ? "auto" : "100%",
      fontFamily: el.fontFamily,
      fontSize: el.fontSize,
      fontWeight: el.fontWeight,
      fontStyle: el.italic ? "italic" : "normal",
      color: el.color,
      textAlign: el.align,
      lineHeight: el.lineHeight,
      letterSpacing: (el.letterSpacing || 0) + "px",
      textDecorationLine: el.strike ? "line-through" : "none",
      textDecorationColor: el.strikeColor || el.color,
      textDecorationThickness: el.strike ? "0.11em" : undefined,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      outline: "none",
      overflow: shaped ? "visible" : "hidden",
    };
    const textNode = isEditing ? (
      <div
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        style={textStyle}
        onInput={(e) => { pendingRef.current = e.currentTarget.innerText; if (onTextSelect) onTextSelect(null); }}
        onBlur={() => onEndEdit()}
        onKeyDown={(e) => {
          // Enter commits; Shift+Enter inserts a line break; Escape cancels.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancelledRef.current = true;
            e.currentTarget.blur();
          }
          e.stopPropagation();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {el.content}
      </div>
    ) : (
      <div style={textStyle}><RichText el={el} /></div>
    );
    if (shaped) {
      const pad = shapePad(el);
      inner = (
        <>
          <ShapeBacking el={el} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", boxSizing: "border-box",
            justifyContent: el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
            paddingTop: pad.top, paddingRight: pad.right, paddingBottom: pad.bottom, paddingLeft: pad.left,
          }}>
            {textNode}
          </div>
        </>
      );
    } else {
      inner = textNode;
    }
  } else if (el.type === "image") {
    inner = el.src ? (
      <img
        src={el.src}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: el.fit || "cover", borderRadius: el.radius || 0, display: "block" }}
        onError={(e) => { e.currentTarget.style.opacity = "0"; }}
      />
    ) : (
      <div style={{ width: "100%", height: "100%", background: "#222", borderRadius: el.radius || 0 }} />
    );
  } else if (el.type === "rect") {
    inner = (
      <div style={{
        width: "100%", height: "100%",
        background: el.fill,
        borderRadius: el.radius || 0,
        border: el.stroke && el.stroke !== "none" ? (el.strokeWidth || 1) + "px solid " + el.stroke : "none",
      }} />
    );
  } else if (el.type === "line") {
    inner = <div style={{ width: "100%", height: "100%", background: el.fill }} />;
  }

  return (
    <div
      style={frame}
      onPointerDown={(e) => { if (!isEditing && !el.locked) onPointerDownBody(e, el.id); }}
      onDoubleClick={(e) => { if (el.type === "text") { e.stopPropagation(); onStartEdit(el.id); } }}
    >
      {inner}
    </div>
  );
}

export default React.memo(ElementView);
