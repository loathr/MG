// Unit checks for app/studio/aitext.js — the pure prompt builder + output cleaner
// behind the ✨ inline-AI "write this for me" text action. The network runner
// (writeElementText) reuses generate.js runPrompt and isn't exercised here.
import test from "node:test";
import assert from "node:assert/strict";
import { buildWritePrompt, cleanWritten, WRITE_KINDS, WRITE_KIND_ORDER } from "../app/studio/aitext.js";

test("WRITE_KIND_ORDER and WRITE_KINDS stay in lockstep", () => {
  for (const k of WRITE_KIND_ORDER) assert.ok(WRITE_KINDS[k] && WRITE_KINDS[k].label && WRITE_KINDS[k].spec, k);
  assert.equal(WRITE_KIND_ORDER.length, Object.keys(WRITE_KINDS).length);
});

test("buildWritePrompt: a kind injects its spec and the topic context", () => {
  const p = buildWritePrompt({ kind: "heading", context: { topic: "Q3 earnings" } });
  assert.match(p, /HEADLINE/);
  assert.match(p, /Q3 earnings/);
  assert.match(p, /Return ONLY the finished text/);
});

test("buildWritePrompt: free-text instruction with no kind still produces a usable prompt", () => {
  const p = buildWritePrompt({ instruction: "a six-word teaser" });
  assert.match(p, /a six-word teaser/);
  assert.match(p, /the text the user describes/);
});

test("buildWritePrompt: transform kinds reference the current text", () => {
  const p = buildWritePrompt({ kind: "shorten", current: "This sentence is far too long and wordy." });
  assert.match(p, /currently reads/);
  assert.match(p, /far too long/);
  assert.match(p, /shorter and punchier/);
});

test("buildWritePrompt: a transform kind with no current text falls back to a fresh write", () => {
  const p = buildWritePrompt({ kind: "rewrite" });
  assert.match(p, /no existing text/);
  assert.doesNotMatch(p, /currently reads/);
});

test("buildWritePrompt: unbranded adds the no-brand guard, default omits it", () => {
  assert.match(buildWritePrompt({ kind: "body", context: { unbranded: true } }), /Do not include any brand name/);
  assert.doesNotMatch(buildWritePrompt({ kind: "body" }), /Do not include any brand name/);
});

test("buildWritePrompt: tone steers the voice when given", () => {
  assert.match(buildWritePrompt({ kind: "body", context: { tone: "wry and dry" } }), /Match this tone: wry and dry/);
});

test("buildWritePrompt: no topic/tone lines when absent (no empty 'about \"\"')", () => {
  const p = buildWritePrompt({ kind: "caption" });
  assert.doesNotMatch(p, /carousel is about/);
  assert.doesNotMatch(p, /Match this tone/);
});

test("cleanWritten: strips wrapping straight and curly quotes", () => {
  assert.equal(cleanWritten('"Hello world"'), "Hello world");
  assert.equal(cleanWritten("“Hello world”"), "Hello world");
  assert.equal(cleanWritten("'single'"), "single");
});

test("cleanWritten: strips code fences and trims", () => {
  assert.equal(cleanWritten("```\nThe Headline\n```"), "The Headline");
  assert.equal(cleanWritten("  spaced out  "), "spaced out");
});

test("cleanWritten: leaves an inner apostrophe alone", () => {
  assert.equal(cleanWritten("It's a wrap"), "It's a wrap");
});

test("cleanWritten: empty/nullish input yields empty string", () => {
  assert.equal(cleanWritten(""), "");
  assert.equal(cleanWritten(null), "");
  assert.equal(cleanWritten(undefined), "");
});
