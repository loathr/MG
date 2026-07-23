// richedit.js — the browser bits per-run styling needs: mapping a text selection
// inside a contentEditable to {start, end} CHARACTER offsets, and (for B1's live
// preview) serializing runs → styled HTML and reading the edited DOM back into
// {text, runs}. The pure run logic lives in model.js. Newlines are real "\n"
// characters (the editor uses white-space: pre-wrap); <br> is one char.

import { runSegments, overlayToRunsPublic } from "./model";
import { hlCss } from "./hlstyles";

// Serialise a React-style object (camelCase) to an inline CSS string (kebab-case),
// so the contentEditable preview uses the EXACT same highlight CSS as RichText.
function cssObjToStr(obj) {
  return Object.keys(obj).map((k) => {
    const prop = k.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/^Webkit/, "-webkit").toLowerCase();
    return prop + ":" + obj[k];
  }).join(";");
}

// (container, offset) from a DOM Range endpoint → flat character index in root.
function pointToIndex(root, container, offset) {
  // Fast path: a plain single-text-node editor (the common case).
  if (container.nodeType === 3 && container.parentNode === root && root.childNodes.length === 1) {
    return Math.min(offset, (container.nodeValue || "").length);
  }
  let idx = 0, found = -1;
  const visit = (node) => {
    if (found >= 0) return;
    for (let k = 0; k < node.childNodes.length; k++) {
      if (found >= 0) return;
      if (node === container && k === offset) { found = idx; return; }
      const ch = node.childNodes[k];
      if (ch === container && ch.nodeType === 3) { found = idx + offset; return; }
      if (ch.nodeType === 3) { idx += (ch.nodeValue || "").length; }
      else if (ch.nodeType === 1) {
        if (ch.tagName === "BR") { if (ch === container) { found = idx; return; } idx += 1; }
        else { visit(ch); }
      }
    }
    if (node === container && offset >= node.childNodes.length && found < 0) found = idx;
  };
  visit(root);
  return found < 0 ? idx : found;
}

// The current selection within `root` as ordered {start, end} character offsets,
// or null when there is no selection inside root. A collapsed caret returns
// start === end (callers treat that as "no span").
export function selectionOffsets(root) {
  if (typeof window === "undefined" || !root) return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
  let a = pointToIndex(root, r.startContainer, r.startOffset);
  let b = pointToIndex(root, r.endContainer, r.endOffset);
  if (a > b) { const t = a; a = b; b = t; }
  return { start: a, end: b };
}

// ---------------------------------------------------------------------------
// B1 · live styling preview — serialize runs ↔ contentEditable HTML
// ---------------------------------------------------------------------------

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(s) {
  return escHtml(s).replace(/"/g, "&quot;");
}

// One run-override → inline CSS declarations. The editable already carries the
// element's base style (colour/size/etc), so a span only paints its OVERRIDES —
// this MUST mirror RichText.spanStyle so the preview equals the rendered slide.
export function cssForOverride(s) {
  const d = [];
  if (!s) return "";
  if (s.color != null) d.push("color:" + s.color);
  if (s.bold != null) d.push("font-weight:" + (s.bold ? 700 : 400));
  if (s.italic != null) d.push("font-style:" + (s.italic ? "italic" : "normal"));
  if (s.size != null) d.push("font-size:" + s.size + "px");
  if (s.strike || s.underline) {
    d.push("text-decoration-line:" + [s.underline ? "underline" : "", s.strike ? "line-through" : ""].filter(Boolean).join(" "));
    d.push("text-decoration-color:" + (s.strikeColor || s.color || "currentColor"));
    d.push("text-decoration-thickness:" + ((s.underline && !s.strike) ? "0.055em" : "0.09em"));
    if (s.underline) { d.push("text-underline-offset:0.14em"); d.push("text-decoration-skip-ink:none"); }
  }
  if (s.bg != null) d.push(cssObjToStr(hlCss(s.bg, s.bgStyle, s.color)));
  if (s.stroke != null && s.strokeWidth) {
    d.push("-webkit-text-stroke-width:" + s.strokeWidth + "px");
    d.push("-webkit-text-stroke-color:" + s.stroke);
    d.push("paint-order:stroke fill");
  }
  return d.join(";");
}

// content + runs → HTML for the contentEditable. Plain segments are bare text
// (newlines preserved for pre-wrap); styled segments are <span data-run='{json}'>
// so reading the DOM back recovers the exact override. Pure (no DOM).
export function runsToHtml(content, runs) {
  const segs = runSegments(content, runs);
  let html = "";
  for (const seg of segs) {
    const t = escHtml(seg.text);
    if (!seg.style || !Object.keys(seg.style).length) { html += t; continue; }
    const css = cssForOverride(seg.style);
    html += "<span data-run=\"" + escAttr(JSON.stringify(seg.style)) + "\""
      + (css ? " style=\"" + escAttr(css) + "\"" : "") + ">" + t + "</span>";
  }
  return html;
}

// Read an edited contentEditable back into {text, runs}. Walks the DOM counting
// UTF-16 code units (matching selectionOffsets), pulling each styled span's
// override from its data-run attr; <br> and block boundaries become "\n". New
// text typed inside a styled span inherits that span's override. Defensive: the
// caller wraps this and falls back to plain innerText if anything is unexpected.
export function domToContentRuns(root) {
  let text = "";
  const ov = [];
  const push = (str, style) => {
    for (let i = 0; i < str.length; i++) { text += str[i]; ov.push(style ? Object.assign({}, style) : null); }
  };
  const visit = (node, inherited) => {
    for (let k = 0; k < node.childNodes.length; k++) {
      const child = node.childNodes[k];
      if (child.nodeType === 3) { push(child.nodeValue || "", inherited); continue; }
      if (child.nodeType !== 1) continue;
      const tag = child.tagName;
      if (tag === "BR") { text += "\n"; ov.push(inherited ? Object.assign({}, inherited) : null); continue; }
      let style = inherited;
      const raw = child.getAttribute && child.getAttribute("data-run");
      if (raw) { try { style = Object.assign({}, inherited, JSON.parse(raw)); } catch (e) { /* keep inherited */ } }
      // A browser-inserted block (DIV/P) starts a new visual line.
      if ((tag === "DIV" || tag === "P") && text.length && text[text.length - 1] !== "\n") { text += "\n"; ov.push(null); }
      visit(child, style);
    }
  };
  visit(root, null);
  return { text, runs: overlayToRunsPublic(ov) };
}

// char index → {node, offset} inside root (clamped to the end).
function locate(root, target) {
  let idx = 0, result = null;
  const visit = (node) => {
    for (let k = 0; k < node.childNodes.length && !result; k++) {
      const child = node.childNodes[k];
      if (child.nodeType === 3) {
        const len = (child.nodeValue || "").length;
        if (target <= idx + len) { result = { node: child, offset: target - idx }; return; }
        idx += len;
      } else if (child.nodeType === 1) {
        if (child.tagName === "BR") {
          if (target <= idx) { result = { node, offset: k }; return; }
          idx += 1;
        } else visit(child);
      }
    }
  };
  visit(root);
  return result || { node: root, offset: root.childNodes.length };
}

// Restore a selection by character offsets (collapsed when end == null/start).
export function setCaret(root, start, end) {
  if (typeof window === "undefined" || !root) return;
  const a = locate(root, start);
  const b = (end == null || end === start) ? a : locate(root, end);
  const r = document.createRange();
  try { r.setStart(a.node, a.offset); r.setEnd(b.node, b.offset); } catch (e) { return; }
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}
