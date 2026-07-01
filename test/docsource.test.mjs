// Unit checks for app/studio/docsource.js — the pure helpers behind the
// document→carousel source (validation, word count, budget cap). The FileReader /
// pdfjs extraction is browser-only and not exercised here.
import test from "node:test";
import assert from "node:assert/strict";
import { MAX_DOC_CHARS, docFileError, wordCount, capText } from "../app/studio/docsource.js";

test("docFileError: accepts txt/md/pdf, rejects others / oversize / missing", () => {
  assert.equal(docFileError({ name: "script.txt", size: 1000 }), null);
  assert.equal(docFileError({ name: "notes.md", size: 1000 }), null);
  assert.equal(docFileError({ name: "deck.pdf", size: 1000 }), null);
  assert.match(docFileError({ name: "photo.png", size: 10 }), /\.txt, \.md or \.pdf/);
  assert.match(docFileError({ name: "huge.pdf", size: 26 * 1024 * 1024 }), /25 MB/);
  assert.equal(docFileError(null), "No file selected.");
});

test("wordCount counts whitespace-separated words", () => {
  assert.equal(wordCount("the quick brown fox"), 4);
  assert.equal(wordCount("  spaced   out \n words "), 3);
  assert.equal(wordCount(""), 0);
  assert.equal(wordCount(null), 0);
});

test("capText keeps short text and truncates long text with a marker", () => {
  assert.equal(capText("short", 100), "short");
  const long = "x".repeat(MAX_DOC_CHARS + 500);
  const out = capText(long);
  assert.ok(out.length < long.length);
  assert.match(out, /truncated to fit/);
  assert.ok(out.startsWith("x".repeat(100)));
});
