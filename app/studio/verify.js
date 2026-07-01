// Fact-check: take a generated deck's claims, run them through Claude WITH web
// search (the same /api/generate proxy generation uses), and get back a
// structured verdict — an overall 0-10 accuracy score plus a per-claim list
// flagging anything unsupported, misleading, or unverifiable.
//
// buildVerifyPrompt / parseVerdict / deckClaims are pure (unit-tested);
// verifyDeck does the network call via the shared runPrompt.
import { runPrompt, stripCites } from "./generate";

// Pull the checkable text off each slide: prefer the generation `content`
// (heading/body/stat/sources), so we check what the deck actually claims.
export function deckClaims(doc) {
  return ((doc && doc.slides) || []).map((s, i) => {
    const c = (s && s.content) || {};
    return {
      slide: i,
      role: c.role || (s && s.layout) || "",
      heading: c.heading || "",
      body: c.body || c.subhead || c.cta || "",
      stat: c.stat != null && c.stat !== "" ? String(c.stat) + (c.statLabel ? " " + c.statLabel : "") : "",
      sources: Array.isArray(c.sources) ? c.sources : (c.sources ? [c.sources] : []),
    };
  });
}

export function buildVerifyPrompt(doc, opts) {
  const o = opts || {};
  const claims = deckClaims(doc);
  return [
    "You are a rigorous, skeptical fact-checker reviewing an Instagram carousel before it ships.",
    o.today ? "Today's date is " + o.today + "." : null,
    "Here are the slides as JSON (slide index, role, and text):",
    JSON.stringify(claims),
    "",
    "Use web search to check every factual, checkable claim — names, numbers, dates, events, quotes. Verify against credible current sources.",
    "",
    "Return ONLY a JSON object (no prose, no markdown fences) of this exact shape:",
    '{"score": <integer 0-10 overall factual accuracy, 10 = fully correct and well-sourced>,',
    ' "summary": "one sentence on the deck\'s overall accuracy",',
    ' "claims": [',
    '   {"slide": <index>, "claim": "the specific claim, a few words", "verdict": "supported|unsupported|misleading|unverifiable", "wrong": "the exact incorrect phrase copied VERBATIM from the slide text — omit when nothing needs changing", "correction": "the corrected phrase to replace it with — omit when you cannot verify a specific correct value", "note": "what you found, one sentence", "source": "outlet or URL if any"}',
    " ]}",
    "",
    "Rules:",
    "- Judge only checkable facts. Skip opinions, hooks, CTAs, and subjective phrasing.",
    '- verdict: "supported" (confirmed by a credible source), "unsupported" (contradicted or no basis), "misleading" (technically true but distorts), "unverifiable" (could not confirm either way).',
    "- Be skeptical: if you cannot find a credible source, it is unverifiable, not supported.",
    "- CORRECTIONS: when a claim is unsupported or misleading AND you can verify the correct value, set `wrong` to the exact text to replace — copied CHARACTER-FOR-CHARACTER from the slide so it can be found — and `correction` to the corrected text. If you cannot verify a specific correct value, OMIT both; never guess a correction. Keep both short (the changed phrase only, e.g. a number or name), not a whole sentence.",
    "- List the problems first; you may also include a few key supported facts. Keep it to the claims that matter.",
  ].filter((l) => l != null).join("\n");
}

const VERDICTS = { supported: 1, unsupported: 1, misleading: 1, unverifiable: 1 };

export function parseVerdict(text) {
  if (!text) throw new Error("Empty fact-check response");
  let cleaned = stripCites(text).replace(/```json|```/g, "").trim();
  let start = cleaned.indexOf('{"score"');
  if (start < 0) start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1"); // tolerate trailing commas
  const obj = JSON.parse(cleaned);
  const claims = (Array.isArray(obj.claims) ? obj.claims : [])
    .filter((c) => c && typeof c === "object")
    .map((c) => ({
      slide: Number.isInteger(c.slide) ? c.slide : null,
      claim: String(c.claim || ""),
      verdict: VERDICTS[c.verdict] ? c.verdict : "unverifiable",
      wrong: String(c.wrong || ""),
      correction: String(c.correction || ""),
      note: String(c.note || ""),
      source: String(c.source || ""),
    }));
  const score = typeof obj.score === "number" ? Math.max(0, Math.min(10, obj.score)) : null;
  return { score, summary: String(obj.summary || ""), claims };
}

// A claim is APPLIABLE only when it's an actual problem, carries a credible
// source, and has both the exact `wrong` phrase and a `correction` — the gate the
// panel uses to offer a one-tap fix (unverifiable/unsourced stay advisory). The
// exact-substring-in-the-deck check is done separately (correctionSite) since it
// needs the doc. Pure.
export function correctionReady(claim) {
  if (!claim) return false;
  const problem = claim.verdict === "unsupported" || claim.verdict === "misleading";
  return !!(problem && claim.source && claim.wrong && claim.correction && claim.wrong !== claim.correction);
}

function todayISO() {
  try { return new Date().toISOString().slice(0, 10); } catch (e) { return ""; }
}

export async function verifyDeck(doc, opts) {
  const o = opts || {};
  const prompt = buildVerifyPrompt(doc, { today: o.today != null ? o.today : todayISO() });
  // Fact-check always searches; like generation it's cancellable (o.signal) and
  // reports progress (o.onPhase: "searching" -> "writing").
  const text = await runPrompt(prompt, { stream: o.stream, webSearch: o.webSearch, signal: o.signal, onPhase: o.onPhase });
  return parseVerdict(text);
}
