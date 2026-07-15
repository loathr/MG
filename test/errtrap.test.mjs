// Unit checks for app/studio/errtrap.js — the pure normalisation of a caught
// browser error into a display record. Headless (no window), so `fromErrorEvent`'s
// resource-load branch keys on `target` being a non-window object with a URL.
import test from "node:test";
import assert from "node:assert/strict";
import { fromErrorEvent, fromRejection, recordKey, formatForCopy, kindLabel } from "../app/studio/errtrap.js";

test("fromErrorEvent: a thrown Error carries message, source, and stack", () => {
  const err = new Error("boom");
  err.stack = "Error: boom\n    at Studio.jsx:28:1";
  const r = fromErrorEvent({ message: "boom", filename: "Studio.jsx", lineno: 28, colno: 1, error: err });
  assert.equal(r.kind, "error");
  assert.equal(r.message, "boom");
  assert.equal(r.source, "Studio.jsx:28:1");
  assert.match(r.stack, /at Studio\.jsx:28:1/);
});

test("fromErrorEvent: a resource-load failure surfaces the failing URL as a module-load error", () => {
  const r = fromErrorEvent({ target: { src: "https://app/_next/static/chunk.js" } });
  assert.equal(r.kind, "load");
  assert.equal(r.source, "https://app/_next/static/chunk.js");
  assert.match(r.message, /Failed to load resource/);
});

test("fromErrorEvent: a <link> load failure uses href", () => {
  const r = fromErrorEvent({ target: { href: "https://app/styles.css" } });
  assert.equal(r.kind, "load");
  assert.equal(r.source, "https://app/styles.css");
});

test("fromErrorEvent: missing fields degrade to a labelled record, never throw", () => {
  const r = fromErrorEvent({});
  assert.equal(r.kind, "error");
  assert.equal(r.message, "Uncaught error");
  assert.equal(r.source, "");
  assert.equal(r.stack, "");
});

test("fromRejection: an Error reason keeps its message + stack", () => {
  const err = new Error("Missing or insufficient permissions.");
  err.stack = "FirebaseError: ...\n    at step (useSharedLive.js:79:19)";
  const r = fromRejection({ reason: err });
  assert.equal(r.kind, "rejection");
  assert.equal(r.message, "Missing or insufficient permissions.");
  assert.match(r.stack, /useSharedLive\.js:79/);
});

test("fromRejection: a string reason is used verbatim", () => {
  const r = fromRejection({ reason: "nope" });
  assert.equal(r.message, "nope");
  assert.equal(r.stack, "");
});

test("fromRejection: an empty rejection still yields a message", () => {
  assert.equal(fromRejection({}).message, "Unhandled promise rejection");
  assert.equal(fromRejection({ reason: {} }).message, "Unhandled promise rejection");
});

test("recordKey: identical errors collapse; differing source/message do not", () => {
  const a = { kind: "error", message: "x", source: "a.js:1:1" };
  const b = { kind: "error", message: "x", source: "a.js:1:1" };
  const c = { kind: "error", message: "x", source: "a.js:2:1" };
  assert.equal(recordKey(a), recordKey(b));
  assert.notEqual(recordKey(a), recordKey(c));
});

test("formatForCopy: numbers, labels, and includes source + stack", () => {
  const out = formatForCopy([
    { kind: "load", message: "Failed to load resource: /chunk.js", source: "/chunk.js", stack: "" },
    { kind: "rejection", message: "boom", source: "", stack: "at a.js:1" },
  ]);
  assert.match(out, /#1 \[load\] Failed to load resource/);
  assert.match(out, /at \/chunk\.js/);
  assert.match(out, /#2 \[rejection\] boom/);
  assert.match(out, /at a\.js:1/);
});

test("formatForCopy: empty input is a safe empty string", () => {
  assert.equal(formatForCopy([]), "");
  assert.equal(formatForCopy(undefined), "");
});

test("kindLabel: maps each kind to its badge text", () => {
  assert.equal(kindLabel("load"), "Module load");
  assert.equal(kindLabel("rejection"), "Unhandled rejection");
  assert.equal(kindLabel("error"), "Uncaught error");
  assert.equal(kindLabel(undefined), "Uncaught error");
});
