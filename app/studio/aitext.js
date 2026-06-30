// Inline AI text — "write this for me" on ONE selected text box. Builds an
// element-scoped prompt (one short string out — no JSON, no web search) and runs
// it through the shared cheap-utility path (Haiku, reasoning off, no search), the
// same lane the caption regenerator uses. The prompt builder + output cleaner are
// pure (unit-tested in test/aitext.test.mjs); the runner reuses generate.js so
// auth/token-gating and the /api/generate proxy are shared, not duplicated.
import { runPrompt } from "./generate";

// Fast, cheap, reasoning-off — this only writes a few words of copy that's already
// scoped on screen, so it never needs the big model, thinking, or the web.
const WRITE_MODEL = "claude-haiku-4-5";

// The preset chips. Each maps a one-tap intent to the copy SPEC the model writes
// to. `transform: true` kinds (Shorten / Rewrite) act on the box's current text;
// the others write fresh copy (optionally steered by the free-text instruction).
export const WRITE_KINDS = {
  heading: { label: "Headline", spec: "a punchy carousel HEADLINE in Title Case, 9 words or fewer — specific and concrete, never a generic placeholder label" },
  subheading: { label: "Subheading", spec: "one vivid SUBHEADING sentence that makes the reader want to swipe" },
  body: { label: "Body", spec: "2-3 tight BODY sentences carrying a single concrete point, under about 45 words" },
  caption: { label: "Caption", spec: "one scroll-stopping line of 125 characters or fewer" },
  shorten: { label: "Shorten", transform: true, spec: "the SAME message made shorter and punchier — keep the meaning, cut every wasted word" },
  rewrite: { label: "Rewrite", transform: true, spec: "a fresh rewrite of the SAME message — same meaning, sharper and more concrete wording" },
};
export const WRITE_KIND_ORDER = ["heading", "subheading", "body", "caption", "shorten", "rewrite"];

function str(v) { return String(v == null ? "" : v).trim(); }

// Build the one-shot prompt to write/replace a single text box. Pure. `kind` is a
// WRITE_KINDS key (or null for a free-form write driven only by `instruction`);
// `current` is the box's existing text; `context` = { topic, tone, unbranded }.
// With no kind and no instruction it still produces a usable prompt (writes a
// fitting line from the deck's topic) so the caller's guard is the only gate.
export function buildWritePrompt(args) {
  const a = args || {};
  const k = WRITE_KINDS[a.kind] || null;
  const current = str(a.current);
  const instruction = str(a.instruction);
  const ctx = a.context || {};
  const topic = str(ctx.topic);
  const tone = str(ctx.tone);
  const target = k ? k.spec : "the text the user describes below";
  return [
    "You are writing the copy for ONE text box on an Instagram carousel slide.",
    topic ? 'The carousel is about "' + topic + '".' : null,
    tone ? "Match this tone: " + tone + "." : null,
    current ? 'The text box currently reads: "' + current + '".' : null,
    (k && k.transform && !current) ? "There is no existing text yet, so write a fresh, fitting line instead." : null,
    instruction ? "What the user wants: " + instruction + "." : null,
    "Write " + target + ".",
    ctx.unbranded ? "Do not include any brand name, @handle, hashtags, or a \"follow\" sign-off." : null,
    "Return ONLY the finished text that goes in the box — no quotation marks, no markdown, no labels, no alternatives, and no explanation. Just the words.",
  ].filter((line) => line != null).join("\n");
}

// Tidy the model's reply into drop-in text: strip code fences, one layer of
// wrapping quotes (straight or curly), and surrounding whitespace. Pure.
export function cleanWritten(text) {
  let t = str(text);
  if (!t) return "";
  t = t.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/i, "").trim();
  const m = t.match(/^(["'“‘])([\s\S]*)(["'”’])$/);
  if (m) t = m[2].trim();
  return t;
}

// Generate copy for one text box and return the cleaned string. Cheap utility
// lane (Haiku, no search, reasoning off, small token cap). Throws on a failed
// call (the caller surfaces it); returns "" only if the model truly says nothing.
export async function writeElementText(args, opts) {
  const o = opts || {};
  const prompt = buildWritePrompt(args || {});
  const text = await runPrompt(prompt, {
    model: o.model || WRITE_MODEL,
    webSearch: false,
    stream: false,
    thinking: false,
    maxTokens: o.maxTokens || 500,
    signal: o.signal,
  });
  return cleanWritten(text);
}
