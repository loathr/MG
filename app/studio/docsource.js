"use client";
// Document → carousel source. Reads a .txt/.md file, a pasted string, or a PDF
// (text extracted client-side via pdfjs-dist, lazy-loaded) into the source text
// the generator builds the deck FROM. The pure helpers (validation, word count,
// budget cap) are unit-tested; the FileReader / pdfjs paths are browser-only.

// Cap the source to a sane model budget (~4k tokens). Keeps the head and flags the
// cut so the model knows it's partial.
export const MAX_DOC_CHARS = 16000;
const TXT_EXT = /\.(txt|md|markdown|text)$/i;
const PDF_EXT = /\.pdf$/i;

export function docFileError(file) {
  if (!file) return "No file selected.";
  const n = file.name || "";
  if (!TXT_EXT.test(n) && !PDF_EXT.test(n)) return "Use a .txt, .md or .pdf — or paste the text instead.";
  if (file.size > 25 * 1024 * 1024) return "That file is over 25 MB — try a smaller doc or paste the text.";
  return null;
}

export function wordCount(text) {
  const t = String(text || "").trim();
  return t ? t.split(/\s+/).length : 0;
}

// Trim the source to the budget, keeping the start and marking the truncation. Pure.
export function capText(text, max) {
  const t = String(text || "");
  const m = max || MAX_DOC_CHARS;
  return t.length <= m ? t : t.slice(0, m).trimEnd() + "\n\n[…document truncated to fit the model's budget…]";
}

// --- browser-only --------------------------------------------------------
function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsText(file);
  });
}

// Extract text from a PDF via pdfjs (lazy import; worker resolved as an asset URL).
async function extractPdf(file) {
  const pdfjs = await import("pdfjs-dist");
  try { pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href; } catch (e) { /* fall back to inline */ }
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const parts = [];
  const n = Math.min(pdf.numPages, 100);
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => (it && it.str) || "").join(" "));
    if (parts.join(" ").length > MAX_DOC_CHARS * 1.3) break; // enough for the budget
  }
  return parts.join("\n\n");
}

// Read any supported document → { name, text (capped), words }, or throw a friendly
// error. Used by the "From a document" create mode.
export async function readDocFile(file) {
  const err = docFileError(file);
  if (err) throw new Error(err);
  let text = PDF_EXT.test(file.name || "") ? await extractPdf(file) : await readTextFile(file);
  text = String(text || "").replace(/\s+\n/g, "\n").trim();
  if (!text) throw new Error("Couldn't find any readable text in that file — try pasting the text.");
  return { name: file.name, text: capText(text), words: wordCount(text) };
}
