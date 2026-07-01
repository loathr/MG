// Coherence check: judge a deck's STRUCTURE — spine, arc, connective tissue,
// callback, and flow — and return a 0-10 score, the detected through-line, and a
// per-slide list of what weakens the narrative. Structure-only, so NO web search
// (unlike the fact-check). Same runPrompt → Opus path as generation/verify.
//
// buildCoherencePrompt / parseCoherence / deckOutline are pure (unit-tested);
// checkCoherence does the network call.
import { runPrompt, stripCites } from "./generate";

// The ordered outline the checker reasons over: each slide's role + heading + body.
export function deckOutline(doc) {
  return ((doc && doc.slides) || []).map((s, i) => {
    const c = (s && s.content) || {};
    return {
      slide: i,
      role: c.role || (s && s.layout) || "",
      heading: c.heading || "",
      body: c.body || c.subhead || c.cta || "",
    };
  });
}

export function buildCoherencePrompt(doc) {
  const outline = deckOutline(doc);
  return [
    "You are a sharp editor reviewing whether an Instagram carousel reads as ONE coherent piece or a stack of disconnected cards.",
    "Here are the slides in order (index, role, heading, body):",
    JSON.stringify(outline),
    "",
    "Judge the NARRATIVE STRUCTURE — not the facts. Assess:",
    "- SPINE: is there a single through-line the whole deck advances?",
    "- ARC: cover poses a tension, each middle slide escalates one concrete step, closer resolves it (no plateau).",
    "- CONNECTIVE TISSUE: does each slide pick up a thread from the one before, so swiping reads continuous?",
    "- CALLBACK: does the closer pay off the cover's exact hook?",
    "- CORRELATION: are any two slides making the same point, or could any swap order with no loss?",
    "",
    "Return ONLY a JSON object (no prose, no markdown fences) of this exact shape:",
    '{"score": <integer 0-10 overall structural coherence, 10 = one seamless argument>,',
    ' "spine": "the deck\'s through-line in one sentence, as you actually read it",',
    ' "summary": "one sentence on how well it holds together",',
    ' "issues": [',
    '   {"slide": <index or null>, "kind": "spine|transition|callback|repeat|arc|strength", "note": "the specific problem (or, for kind=strength, what works), one sentence"}',
    " ]}",
    "",
    "Rules:",
    '- kind: "transition" (a slide doesn\'t connect to the previous), "callback" (closer misses the cover), "repeat" (two slides make the same point), "arc" (the escalation plateaus or dips), "spine" (a slide drifts off the through-line), "strength" (something that genuinely works).',
    "- List the PROBLEMS first, most damaging first; you may add one or two strengths at the end.",
    "- Be specific and actionable — name the slide and what to do (merge, cut, re-angle, re-thread).",
  ].join("\n");
}

const KINDS = { spine: 1, transition: 1, callback: 1, repeat: 1, arc: 1, strength: 1 };

export function parseCoherence(text) {
  if (!text) throw new Error("Empty coherence response");
  let cleaned = stripCites(text).replace(/```json|```/g, "").trim();
  let start = cleaned.indexOf('{"score"');
  if (start < 0) start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  const obj = JSON.parse(cleaned);
  const issues = (Array.isArray(obj.issues) ? obj.issues : [])
    .filter((c) => c && typeof c === "object")
    .map((c) => ({
      slide: Number.isInteger(c.slide) ? c.slide : null,
      kind: KINDS[c.kind] ? c.kind : "spine",
      note: String(c.note || ""),
    }));
  const score = typeof obj.score === "number" ? Math.max(0, Math.min(10, obj.score)) : null;
  return { score, spine: String(obj.spine || ""), summary: String(obj.summary || ""), issues };
}

export async function checkCoherence(doc, opts) {
  const o = opts || {};
  const prompt = buildCoherencePrompt(doc);
  // Structure-only → no web search; HIGH effort for real editorial judgement.
  const text = await runPrompt(prompt, { stream: o.stream, webSearch: false, effort: o.effort || "high", signal: o.signal, onPhase: o.onPhase });
  return parseCoherence(text);
}
