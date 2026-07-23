import test from "node:test";
import assert from "node:assert/strict";
import { runsToHtml, editableHtml, domToContentRuns, cssForOverride } from "../app/studio/richedit";

// --- tiny fake-DOM helpers (no jsdom in this project) -----------------------
const textNode = (v) => ({ nodeType: 3, nodeValue: v, childNodes: [] });
const elNode = (tag, attrs, kids) => ({
  nodeType: 1, tagName: tag, childNodes: kids || [],
  getAttribute: (k) => (k in (attrs || {}) ? attrs[k] : null),
});
const root = (kids) => elNode("DIV", {}, kids);

// Parse runsToHtml's own (flat) output back into a fake DOM tree so we can prove
// the full serialize→DOM→read-back round trip without a browser.
function parseEditorHtml(html) {
  const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
  const kids = [];
  let i = 0;
  while (i < html.length) {
    if (html.startsWith("<span", i)) {
      const open = html.indexOf(">", i);
      const m = html.slice(i, open + 1).match(/data-run="([^"]*)"/);
      const close = html.indexOf("</span>", open);
      const inner = html.slice(open + 1, close);
      kids.push(elNode("SPAN", { "data-run": m ? unesc(m[1]) : null }, [textNode(unesc(inner))]));
      i = close + 7;
    } else {
      let next = html.indexOf("<", i);
      if (next < 0) next = html.length;
      if (next > i) kids.push(textNode(unesc(html.slice(i, next))));
      i = next;
    }
  }
  return root(kids);
}

const roundTrip = (content, runs) => domToContentRuns(parseEditorHtml(runsToHtml(content, runs)));

test("runsToHtml: uniform plain text is bare (no spans)", () => {
  assert.equal(runsToHtml("Hello world", []), "Hello world");
});

test("runsToHtml: a styled segment carries data-run JSON + inline css", () => {
  const html = runsToHtml("Hello", [{ start: 0, end: 2, color: "#2ecf8f" }]);
  assert.match(html, /^<span data-run="[^"]*" style="color:#2ecf8f">He<\/span>llo$/);
  assert.match(html, /data-run="\{&quot;color&quot;:&quot;#2ecf8f&quot;\}"/);
});

test("runsToHtml: newlines are preserved as literal characters (pre-wrap)", () => {
  assert.equal(runsToHtml("a\nb", []), "a\nb");
});

test("cssForOverride mirrors the renderer for each key", () => {
  assert.equal(cssForOverride({ color: "#fff" }), "color:#fff");
  assert.equal(cssForOverride({ bold: true }), "font-weight:700");
  assert.equal(cssForOverride({ bold: false }), "font-weight:400");
  assert.equal(cssForOverride({ italic: true }), "font-style:italic");
  assert.equal(cssForOverride({ size: 90 }), "font-size:90px");
  assert.match(cssForOverride({ stroke: "#fff", strokeWidth: 4 }), /-webkit-text-stroke-width:4px/);
  assert.equal(cssForOverride(null), "");
});

test("round-trip: plain text recovers content with no runs", () => {
  const { text, runs } = roundTrip("Hello world", []);
  assert.equal(text, "Hello world");
  assert.deepEqual(runs, []);
});

test("round-trip: a single colour run survives", () => {
  const { text, runs } = roundTrip("Hello", [{ start: 0, end: 2, color: "#2ecf8f" }]);
  assert.equal(text, "Hello");
  assert.deepEqual(runs, [{ start: 0, end: 2, color: "#2ecf8f" }]);
});

test("round-trip: bold+italic mid-string survives", () => {
  const { text, runs } = roundTrip("abcdef", [{ start: 2, end: 4, bold: true, italic: true }]);
  assert.equal(text, "abcdef");
  assert.deepEqual(runs, [{ start: 2, end: 4, bold: true, italic: true }]);
});

test("round-trip: adjacent runs with different styles stay distinct", () => {
  const { runs } = roundTrip("abcd", [
    { start: 0, end: 2, color: "#ffffff" },
    { start: 2, end: 4, color: "#000000" },
  ]);
  assert.deepEqual(runs, [
    { start: 0, end: 2, color: "#ffffff" },
    { start: 2, end: 4, color: "#000000" },
  ]);
});

test("round-trip: a styled run spanning a newline keeps offsets", () => {
  const { text, runs } = roundTrip("a\nb", [{ start: 0, end: 3, bold: true }]);
  assert.equal(text, "a\nb");
  assert.deepEqual(runs, [{ start: 0, end: 3, bold: true }]);
});

test("round-trip: html-special characters are escaped + recovered exactly", () => {
  const content = 'x < y & "z"';
  const { text } = roundTrip(content, [{ start: 0, end: 1, color: "#fff" }]);
  assert.equal(text, content);
});

test("round-trip: per-run size survives", () => {
  const { runs } = roundTrip("big", [{ start: 0, end: 3, size: 120 }]);
  assert.deepEqual(runs, [{ start: 0, end: 3, size: 120 }]);
});

test("round-trip: an emoji survives intact with its run boundary beside it (D4)", () => {
  const content = "Big win 🎉";                         // 🎉 = code units 8,9
  const { text, runs } = roundTrip(content, [{ start: 0, end: 8, bold: true }]);
  assert.equal(text, content, "emoji not split into a lone surrogate");
  assert.deepEqual(runs, [{ start: 0, end: 8, bold: true }]);
});

// --- domToContentRuns against browser-shaped markup -------------------------

test("domToContentRuns: <br> reads back as one newline char", () => {
  const tree = root([textNode("a"), elNode("BR", {}, []), textNode("b")]);
  const { text, runs } = domToContentRuns(tree);
  assert.equal(text, "a\nb");
  assert.deepEqual(runs, []);
});

test("domToContentRuns: text typed inside a styled span inherits its override", () => {
  // user typed "X" into the middle of a coloured "abc" → span now holds "abXc"
  const tree = root([elNode("SPAN", { "data-run": '{"color":"#f00"}' }, [textNode("abXc")])]);
  const { text, runs } = domToContentRuns(tree);
  assert.equal(text, "abXc");
  assert.deepEqual(runs, [{ start: 0, end: 4, color: "#f00" }]);
});

test("domToContentRuns: a browser DIV block becomes a newline boundary", () => {
  const tree = root([textNode("a"), elNode("DIV", {}, [textNode("b")])]);
  const { text } = domToContentRuns(tree);
  assert.equal(text, "a\nb");
});

test("domToContentRuns: unparseable data-run is ignored, text still recovered", () => {
  const tree = root([elNode("SPAN", { "data-run": "not json" }, [textNode("hi")])]);
  const { text, runs } = domToContentRuns(tree);
  assert.equal(text, "hi");
  assert.deepEqual(runs, []);
});

// --- editableHtml: the whole-box highlight wrapper (live-preview while editing) ---

test("editableHtml: no base highlight is byte-identical to runsToHtml", () => {
  assert.equal(editableHtml("Hi", [], null), runsToHtml("Hi", []));
  assert.equal(editableHtml("Hi", [], { bg: null }), runsToHtml("Hi", []));
});

test("editableHtml: a box-wide highlight wraps content in a data-basehl span, never a run", () => {
  const html = editableHtml("Hi", [], { bg: "#ffd34e", bgStyle: "pill", color: "#111" });
  assert.match(html, /^<span data-basehl style="[^"]*">Hi<\/span>$/);
  assert.doesNotMatch(html, /data-run/); // element-level highlight is not a per-run override
});

test("editableHtml: the base-highlight wrapper does NOT leak into runs on read-back", () => {
  const html = editableHtml("Hello", [], { bg: "#e2473e", bgStyle: "band", color: "#fff" });
  const { text, runs } = domToContentRuns(parseEditorHtml(html));
  assert.equal(text, "Hello");
  assert.equal(runs.length, 0); // the wrapper carries no data-run, so it's invisible to the model
});
