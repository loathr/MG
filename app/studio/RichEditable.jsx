"use client";
import React, { useEffect, useRef } from "react";
import { styledRuns, applyRunStyle, clearRunStyle } from "./model";
import { selectionOffsets, editableHtml, domToContentRuns, setCaret } from "./richedit";

// The resolved style span covering character `idx` (drives the format bar /
// Inspector active states), computed from the LIVE edited content+runs.
function spanStyleAt(el, idx) {
  const spans = styledRuns(el);
  let acc = 0;
  for (const sp of spans) { if (idx < acc + sp.text.length) return sp; acc += sp.text.length; }
  return spans.length ? spans[spans.length - 1] : null;
}

// B1 · the live-preview editing surface. A rich contentEditable seeded from the
// element's runs at edit start so existing styling shows WHILE editing (today it
// renders plain until commit). Its children (the styled spans) are managed
// imperatively — React never owns them — so a store update can't clobber the caret.
// The memo below (see bottom) lets it re-render ONLY when the element-level style
// changes, so a WHOLE-BOX effect (colour/weight/italic/underline/strike/tracking/
// shadow) lands on the container's style attribute LIVE while you keep editing;
// React only patches that attribute and leaves the imperatively-set innerHTML and
// caret untouched. Per-run styling still repaints via an explicit style-apply (and
// restores the caret by offset); plain typing stays fully native.
function RichEditable({ el, textStyle, onCommitText, onEndEdit, onTextSelect, onEditApi, onStyleApply }) {
  const editRef = useRef(null);
  const elRef = useRef(el);                 // element snapshot at edit start
  const pendingTextRef = useRef(el.content); // latest text/runs, tracked w/o re-render
  const pendingRunsRef = useRef(Array.isArray(el.runs) ? el.runs : []);
  const cancelledRef = useRef(false);
  // The element-level (whole-box) highlight, refreshed every render so the wrapper
  // it seeds into the editable stays live. Container-level looks (colour/weight/…)
  // ride on `textStyle`; only the box highlight needs this wrapper (see editableHtml).
  const baseRef = useRef(null);
  baseRef.current = { bg: el.textBg || null, bgStyle: el.textBgStyle || null, color: el.color };

  // Read the edited DOM back to {text, runs}; fall back to plain text if the
  // markup is something the parser doesn't expect (never throws to the UI).
  const readDom = (node) => {
    try { return domToContentRuns(node); } catch (e) { return { text: node.innerText, runs: [] }; }
  };

  const reportSel = () => {
    const node = editRef.current;
    if (!node || !onTextSelect) return;
    const off = selectionOffsets(node);
    if (!off || off.end <= off.start) return; // collapsed caret → leave the bar as-is
    let rect = null;
    try { rect = window.getSelection().getRangeAt(0).getBoundingClientRect(); } catch (e) { /* ignore */ }
    const live = Object.assign({}, elRef.current, { content: pendingTextRef.current, runs: pendingRunsRef.current });
    onTextSelect({
      id: elRef.current.id, start: off.start, end: off.end,
      text: String(pendingTextRef.current).slice(off.start, off.end),
      rect: rect && rect.width ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null,
      style: spanStyleAt(live, off.start),
    });
  };

  // Apply (or clear) a style over [start,end]: recompute runs, repaint the
  // editable, restore the selection, and push the atomic content+runs to the
  // store. The repaint is what makes styling preview live without a commit.
  const applyAt = (start, end, patch, clear) => {
    const node = editRef.current;
    if (!node || end <= start) return;
    const { text, runs } = readDom(node);
    const next = clear ? clearRunStyle(text, runs, start, end) : applyRunStyle(text, runs, start, end, patch);
    pendingTextRef.current = text;
    pendingRunsRef.current = next;
    node.innerHTML = editableHtml(text, next, baseRef.current);
    setCaret(node, start, end);
    if (onStyleApply) onStyleApply(elRef.current.id, text, next);
    reportSel();
  };
  const liveOffsets = () => selectionOffsets(editRef.current);

  useEffect(() => {
    const node = editRef.current;
    if (!node) return;
    cancelledRef.current = false;
    // Seed the editable from the element's runs, then focus + caret to the end.
    node.innerHTML = editableHtml(el.content, el.runs, baseRef.current) || "";
    node.focus();
    const sel = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(node);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
    if (onEditApi) onEditApi({
      applyStyle: (p) => { const o = liveOffsets(); if (o) applyAt(o.start, o.end, p, false); },
      clearStyle: () => { const o = liveOffsets(); if (o) applyAt(o.start, o.end, null, true); },
      applyStyleAt: (s, e, p) => applyAt(s, e, p, false),
      clearStyleAt: (s, e) => applyAt(s, e, null, true),
    });
    document.addEventListener("selectionchange", reportSel);
    return () => {
      document.removeEventListener("selectionchange", reportSel);
      if (onEditApi) onEditApi(null);
      if (onTextSelect) onTextSelect(null);
      if (cancelledRef.current) return; // Escape — discard, keep the original
      const text = pendingTextRef.current;
      const runs = pendingRunsRef.current;
      if (text != null && (text !== el.content || runs !== el.runs)) onCommitText(elRef.current.id, text, runs);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A WHOLE-BOX highlight (or its colour) changed while editing: the container's
  // style can't paint a per-line highlight, so re-lay the wrapper. Re-seed from the
  // LIVE typed text (pending refs) — never el.content, which lags unsaved keystrokes
  // — and restore the caret by offset. Skips the initial run (mount already seeded).
  const firstBaseSync = useRef(true);
  useEffect(() => {
    if (firstBaseSync.current) { firstBaseSync.current = false; return; }
    const node = editRef.current;
    if (!node) return;
    const off = selectionOffsets(node);
    const { text, runs } = readDom(node);
    pendingTextRef.current = text;
    pendingRunsRef.current = runs;
    node.innerHTML = editableHtml(text, runs, baseRef.current);
    if (off) setCaret(node, off.start, off.end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el.textBg, el.textBgStyle, el.color]);

  return (
    <div
      ref={editRef}
      contentEditable
      suppressContentEditableWarning
      style={textStyle}
      onInput={() => {
        const { text, runs } = readDom(editRef.current);
        pendingTextRef.current = text;
        pendingRunsRef.current = runs;
        if (onTextSelect) onTextSelect(null); // hide the format bar while typing
      }}
      onBlur={(e) => {
        const to = e.relatedTarget;
        if (to && to.closest && to.closest("[data-formatbar]")) return; // keep editing for the popover
        onEndEdit();
      }}
      onKeyDown={(e) => {
        // Enter now inserts a line break (newlines render via white-space:pre-wrap
        // and the run parser); commit with Cmd/Ctrl+Enter or by clicking away.
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
        else if (e.key === "Escape") { e.preventDefault(); cancelledRef.current = true; e.currentTarget.blur(); }
        e.stopPropagation();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}

// Re-render ONLY when the element (and thus its container `textStyle`) changes, so
// a whole-box style effect previews live. When `el` is unchanged — the hot path of
// plain typing and per-run repaints — we skip the render entirely, keeping React
// out of the imperatively-managed children and off the caret. (el identity carries
// textStyle: Element recomputes it only when it itself re-renders on an el change.)
export default React.memo(RichEditable, (a, b) => a.el === b.el);
