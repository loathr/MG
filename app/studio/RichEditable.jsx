"use client";
import React, { useEffect, useRef } from "react";
import { styledRuns, applyRunStyle, clearRunStyle } from "./model";
import { selectionOffsets, runsToHtml, domToContentRuns, setCaret } from "./richedit";

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
// renders plain until commit). It is wrapped in React.memo(() => true) below so
// it NEVER re-renders — React stays out of its children and a store update can
// never clobber the caret. We repaint only on an explicit style-apply (and
// restore the caret by offset); plain typing is left fully native (no repaint
// under the caret), which keeps the risky path off the hot keystroke path.
function RichEditable({ el, textStyle, onCommitText, onEndEdit, onTextSelect, onEditApi, onStyleApply }) {
  const editRef = useRef(null);
  const elRef = useRef(el);                 // element snapshot at edit start
  const pendingTextRef = useRef(el.content); // latest text/runs, tracked w/o re-render
  const pendingRunsRef = useRef(Array.isArray(el.runs) ? el.runs : []);
  const cancelledRef = useRef(false);

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
    node.innerHTML = runsToHtml(text, next);
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
    node.innerHTML = runsToHtml(el.content, el.runs) || "";
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

// Never re-render: props are captured at mount, the DOM is managed imperatively.
export default React.memo(RichEditable, () => true);
