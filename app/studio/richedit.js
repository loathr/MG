// richedit.js — the one browser bit per-run styling needs: mapping a text
// selection inside a contentEditable to {start, end} CHARACTER offsets within the
// element's plain content. The pure run logic lives in model.js; styling is
// applied through the store (offset-based), so editing itself stays plain-text
// and the user's words are never at risk. Newlines are real "\n" characters
// (the editor uses white-space: pre-wrap); <br> is tolerated as one char.

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
