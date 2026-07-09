// Generation: build an editorial prompt (category voice + a seeded angle/voice
// for variety + today's date) and call the /api/generate proxy WITH web search
// (current, sourced decks), parsing the slides JSON out of the streamed response.
//
// Web search is ON by default — usually ~40-60s but it can spike, so the call is
// CANCELLABLE (opts.signal -> AbortController) and reports coarse progress
// (opts.onPhase: "searching" -> "writing"). Pass opts.webSearch:false for a fast
// no-search "Quick draft" from the model's knowledge.
//
// The model is Claude Opus with ADAPTIVE THINKING — reasoning stays in thinking
// blocks (which we drop). The call STREAMS (the route pipes Anthropic's SSE
// through) so a long call survives Vercel's 60s cap; we read it to accumulate the
// final text, surface progress, and honor an abort.
import { slidesToDoc } from "./templates";
import { getCategory, cautionFor } from "./categories";
import { voicePrompt, tonePrompt, voiceShape } from "./voices";
import { normalizeCaption, captionText, fallbackCaption } from "./captions";
import { getIdToken } from "./firebaseClient";

const MODEL = "claude-opus-4-8";
// Server-side web search — the BASIC variant, deliberately. The dynamic-filtering
// variant (web_search_20260209) runs code execution under the hood to filter
// results, and on a broad topic that spirals to 20+ tool calls over many minutes
// — which blows the serverless function's wall-clock cap, so the deck is never
// written and the client sees "Empty model response". The basic variant just
// searches and writes: bounded, fast, and far cheaper. max_uses is capped low to
// keep the whole turn inside the time budget.
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 4 };

// A fresh lens + a tonal voice, layered on the category's own persona so two
// decks on different topics (or a regenerate with a new seed) don't read the
// same. Picked deterministically from a seed so generation is reproducible.
const ANGLES = [
  "the money trail — who profits, who pays, and how the incentives actually run",
  "the human story — a specific person or moment that makes the stakes concrete",
  "the contrarian read — the widely-held belief this topic quietly overturns",
  "the origin — the overlooked decision or accident that set this in motion",
  "the data — what the numbers say once you look past the headline",
  "the ripple effect — the second-order consequences few are tracking",
  "the power map — who actually decides, and who only appears to",
];
const VOICES = [
  "measured and authoritative, earning trust with specifics over adjectives",
  "wry and incisive, with a dry wit that never undercuts the rigor",
  "urgent and vivid, writing as if the story broke this morning",
  "cool and analytical, letting clean reasoning carry the weight",
  "warm and human, anchoring big ideas in lived detail",
];

// Optional tone overlay from the create screen's Voice & tone control. Empty when
// none is chosen, so the default deck is unchanged.
const TONE_DESC = {
  punchy: "punchy and high-energy — short, declarative, quotable lines",
  analytical: "analytical and measured — precise, reasoned, evidence-first",
  playful: "playful and conversational — light, witty, and human",
  authoritative: "authoritative and definitive — confident, expert, no hedging",
};

// Tiny stable string hash → non-negative int. Seeds the angle/voice pick so the
// same (topic, category) is reproducible while different topics diverge.
export function hashStr(s) {
  let h = 5381;
  const str = String(s == null ? "" : s);
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

// Strip the inline <cite> markers the web-search answer can wrap around facts —
// they're not part of the JSON and would otherwise break the parse.
export function stripCites(text) {
  return String(text == null ? "" : text).replace(/<\/?cite[^>]*>/g, "");
}

// Source fidelity: how closely a document-built deck follows the source's WORDING,
// from verbatim to a full editorial rewrite. Five ordered stops; "balanced" is the
// default and adds NO directive (the SOURCE DOCUMENT block is already balanced), so
// an unset/balanced value keeps the prompt byte-identical to before. Pure.
export const FIDELITY_LEVELS = ["verbatim", "mostly-verbatim", "balanced", "mostly-reworded", "reworded"];
export function fidelityDirective(level) {
  switch (level) {
    case "verbatim":
      return "SOURCE FIDELITY — VERBATIM: use the document's EXACT wording wherever a sentence can stand as a slide; quote its lines, figures and phrasing directly; do not paraphrase or embellish — only trim to fit the format.";
    case "mostly-verbatim":
      return "SOURCE FIDELITY — MOSTLY VERBATIM: keep the document's own wording and quotes for the key lines; tighten only lightly where the format demands it.";
    case "mostly-reworded":
      return "SOURCE FIDELITY — MOSTLY REWORDED: keep the facts, figures and any standout quotes, but rewrite the prose in a punchy, original editorial voice.";
    case "reworded":
      return "SOURCE FIDELITY — REWORDED: keep only the facts, figures and named quotes; rewrite everything else fully in a bold, original editorial voice — do NOT mirror the document's phrasing.";
    default:
      return ""; // "balanced" / unset → no extra directive
  }
}

// Build the generation prompt. The category supplies the voice (persona +
// brief), the content-slide role labels, and the CTA; `opts.seed` selects the
// angle/voice (defaults to a hash of the topic), and `opts.today` anchors "now".
export function buildPrompt(topic, categoryKey, opts) {
  const o = opts || {};
  const cat = getCategory(categoryKey);
  const roles = cat.roles;
  const seed = o.seed != null ? o.seed >>> 0 : hashStr(topic + "|" + categoryKey);
  const angle = ANGLES[seed % ANGLES.length];
  // Voice: a chosen named persona (voices.js) overrides the seeded default; "auto"
  // or none keeps the seeded voice so existing decks are unchanged.
  const chosenVoice = voicePrompt(o.voice);
  const voice = chosenVoice || VOICES[Math.floor(seed / ANGLES.length) % VOICES.length];
  // Structural exemplar for the chosen persona — steers deck SHAPE (opening move +
  // arc + favoured slide type), only when a named voice is picked. Empty for auto.
  const chosenShape = voiceShape(o.voice);
  const research = o.webSearch
    ? "Research first: use web search to verify the key facts, figures, names, and recent developments before you write — ground every claim in what you find and cite the 1-2 strongest real, current outlets per slide. Never cite a source you did not find."
    : "Ground every claim in well-established, real facts, and name 1-2 credible outlets per slide in sources. Do not fabricate statistics or cite events you are unsure occurred; if a topic needs live data you don't have, pick a more evergreen angle.";
  // R5 grounding: when the topic came from a picked Trending card, its summary +
  // source seed the deck so it's built on the actual story, not just the headline.
  const ground = o.ground && o.ground.extract ? String(o.ground.extract) : "";
  const groundSrc = o.ground && o.ground.source ? String(o.ground.source) : "";
  // Optional ROUTE (TOPIC_ROUTES.md): scopes the deck to a template beat / sector
  // / section the user picked, plus (later tiers) its sourcing. ADDITIVE — when no
  // route is set (the default one-tap path), the prompt is byte-identical to the
  // un-routed deck. The route carries already-resolved framing (kind + label +
  // terms + sourcing), so this builder stays pure and never imports trending.js.
  const route = o.route || null;
  const hasRoute = !!(route && (route.label || route.region || route.country || route.urgency || route.angle || route.emphasis || route.mode));
  const unbranded = !!o.unbranded;
  let routeLine = null;
  if (hasRoute) {
    const parts = [];
    if (route.label) {
      parts.push("Stay within the " + (route.kind || "beat") + " “" + route.label + "” — keep the angle, examples, and sourcing inside it"
        + (route.terms && route.terms.length ? "; anchor on " + route.terms.slice(0, 8).join(", ") : "")
        + ".");
    }
    if (route.sourcing) parts.push("Prefer " + route.sourcing + " as sources.");
    // News-desk secondary route (Tier 2): region scope + urgency framing.
    if (route.region && route.region !== "Global") parts.push("Focus on " + route.region + " — prioritise stories, sources, and examples from that region.");
    if (route.country) parts.push("Zero in on " + route.country + " specifically — centre the reporting, data, and sources there.");
    if (route.urgency === "breaking") parts.push("BREAKING: lead with the single most recent development; open the cover with the news itself, datelined today, and keep it tight and fast.");
    else if (route.urgency === "developing") parts.push("This is a DEVELOPING story — frame it as unfolding now; flag what's confirmed versus still emerging.");
    // Advanced framing (Tier 3): News angle + emphasis, Enterprise mode — already
    // resolved to their prompt strings by the caller.
    if (route.angle) parts.push(route.angle);
    if (route.emphasis) parts.push(route.emphasis);
    if (route.mode) parts.push(route.mode);
    routeLine = parts.join(" ");
  }
  // Deck length (cover + content + closer) from the create screen's Length control.
  const total = Math.max(4, Math.min(12, o.slides || 8));
  const content = total - 2;
  // Tone: the rich named tones (voices.js) are full instructions; fall back to the
  // legacy TONE_DESC ids so older callers still work.
  const toneRich = tonePrompt(o.tone);
  const toneLegacy = !toneRich && o.tone && TONE_DESC[o.tone] ? TONE_DESC[o.tone] : "";
  // Document → carousel: the pasted/extracted source the deck is built FROM.
  const sourceDoc = o.sourceDoc ? String(o.sourceDoc).trim() : "";
  // How faithfully to follow the source's wording (verbatim ↔ reworded). Only
  // meaningful with a document; "balanced" (the default) adds nothing so the
  // existing prompt is byte-identical.
  const fidelityLine = sourceDoc ? fidelityDirective(o.fidelity) : "";
  // White-label: strip every LOATHR mark from the GENERATED copy — no @handle in
  // the caption cta, no "invite the follow" closer, no brand sign-off. Default
  // (unbranded=false) keeps the prompt byte-identical to before.
  const brandingLine = unbranded
    ? "WHITE-LABEL: produce NO brand marks anywhere — never write \"LOATHR\", any @handle, a wordmark, or a \"follow for more\" sign-off in any slide or the caption; the closer is a neutral, brand-free sign-off."
    : null;
  const followClose = unbranded
    ? "- The closer pays off the cover's hook and lands a line worth screenshotting."
    : "- The closer pays off the cover's hook, lands a line worth screenshotting, then invites the follow naturally.";
  const captionCta = unbranded
    ? "- cta: drive SAVES and SHARES (the strongest signals), ask a question to invite comments — do NOT add any @handle, brand name, or \"follow\" sign-off."
    : "- cta: drive SAVES and SHARES (the strongest signals), ask a question to invite comments, then end on the follow (@loathrdotcom).";
  const closerCta = unbranded ? "a clean closing line — no brand, no @handle, no \"follow\"" : cat.cta;
  return [
    "You are " + cat.persona + " writing a premium Instagram carousel.",
    'Topic: "' + topic + '".',
    o.today ? "Today's date is " + o.today + ". Treat the topic as of now — prefer the most recent, verifiable facts and avoid stale or dated framing." : null,
    cat.brief,
    "Approach this through " + angle + ". Voice: " + voice + ".",
    chosenShape ? "Structure — " + chosenShape : null,
    toneRich ? "Tone — " + toneRich : (toneLegacy ? "Tone: write it " + toneLegacy + " — let this colour the whole deck." : null),
    "",
    // Document source (overrides web research): build the whole deck FROM the material.
    sourceDoc
      ? "SOURCE DOCUMENT — build the ENTIRE carousel from the material below. Distill ITS key points into the cover, content slides, and closer; stay faithful to it and do NOT invent facts, figures, names, quotes, or events it does not contain. Do NOT web-search — this document is the source. Where the material is thin for a slide, summarise or reframe what's there rather than fabricate. Preserve the document's own facts and terminology.\n\"\"\"\n" + sourceDoc + "\n\"\"\""
      : research,
    fidelityLine || null,
    routeLine,
    brandingLine,
    ground ? "Grounded source — build the deck on these specific facts, verifying and expanding them with search (correct anything outdated): \"" + ground + "\"" + (groundSrc ? " [" + groundSrc + "]" : "") : null,
    "",
    "Craft standards (this is the quality bar — hold to all of them):",
    '- The cover hooks with a specific promise or tension, never a generic label ("The Future of X", "Everything You Need to Know", "A Deep Dive Into...").',
    "- One idea per slide, made concrete: back each claim with a name, number, date, or place.",
    "- Show, don't summarize — concrete nouns and strong verbs over adjectives. Vary sentence length; if a line reads like a press release, rewrite it.",
    '- Banned as lazy: "in today\'s world", "delve", "moreover", "it\'s important to note", "game-changer", "unlock", "navigate the landscape", "in conclusion".',
    followClose,
    "",
    "Make it ONE carousel, not a stack of cards — decide the SPINE first (the single through-line the whole deck advances), then build the slides on each other:",
    "- Arc: the cover poses the tension, each middle slide escalates it one concrete step (raise the stakes, or deepen the last point), and the closer resolves it.",
    "- Connective tissue: every slide picks up a thread from the one before — a consequence, a complication, a \"but then\", a zoom-in or zoom-out — so swiping reads as one continuous piece, not a list of facts.",
    "- Callback: the closer pays off the cover's exact hook — answer the question it raised or land the turn it promised, so the deck feels whole.",
    "- Earn every slide: never make the same point twice; if two slides could swap order with no loss, the deck isn't building — fix it.",
    "",
    "Also write the Instagram CAPTION (the post text under the carousel), built to perform:",
    "- hook: ONE scroll-stopping line, <= 125 chars (only this part shows before the fold) — carry the cover's tension.",
    "- body: the deck's spine in 2-4 short, skimmable lines (separate them with \\n) — it should read even without swiping.",
    captionCta,
    "- hashtags: 10-15 relevant tags mixing broad and niche; words only, lowercase, no # symbol.",
    "- Weave a few plain topic keywords into the body (Instagram indexes caption text for search).",
    "",
    "Return ONLY a JSON object (no prose, no markdown fences) of this exact shape:",
    '{',
    '  "caption": {"hook":"<= 125 chars, scroll-stopping","body":"2-4 short lines, use \\n between them","cta":"save/share line + a question + the follow","hashtags":["tag","tag"]},',
    '  "slides": [',
    '    {"role":"COVER","kicker":"1-4 word section label, specific to the deck","heading":"the hook, <= 9 words","subhead":"one vivid sentence that makes the swipe irresistible"},',
    '    {"role":"' + roles[0] + '","kicker":"1-4 word section label, specific to THIS slide","heading":"a specific, concrete headline","body":"2-3 tight sentences carrying one proof point","sources":["Outlet"]},',
    "    ... more content slides, same shape ...",
    '    {"role":"CLOSER","heading":"a resonant closing line","cta":"' + closerCta + '"}',
    '  ]',
    '}',
    "",
    "Rules:",
    "- Make EXACTLY " + total + " slides: a cover, " + content + " content slide" + (content === 1 ? "" : "s") + ", and a closer. Hit this count — fill it with substance, never filler.",
    "- Build the content into a rising arc, leading with these role beats as a guide and reusing or extending them only as needed to reach " + content + " content slides: " + roles.join(", ") + ".",
    "- A topic-heavy point MAY spill across two consecutive slides when one slide can't do it justice: set the second slide's role to the same label plus \" · CONT'D\" and continue into a fresh beat (never repeat the first). Only for genuine richness, at most once per deck — never to pad length.",
    "- On a content slide you MAY set \"layout\" to fit its content and the flow — one of: classic (clean text, the default), statement, quote, centered, bottom, numbered, or an image-led feature / featureBottom / featureSplit / split. Use an image-led layout ONLY for a slide with a clear visual subject (an entity/scene); otherwise clean text. Choose by fit, never to force variety or repeat a composition; most slides are classic. (Stat / Versus come from the data fields below, not this.)",
    "- Headlines in Title Case; bodies in full sentences. No hashtags or emoji anywhere.",
    "- Headlines must be SPECIFIC to that slide's own content — name the concrete thing (the person, place, number, decision, or turn) so a reader gets the point from the headline alone. NEVER generic placeholders like 'The Origin', 'Why It Matters', 'The Numbers', 'The Moment Everything Shifted', 'What Comes Next', 'What The Experts Say'. If a headline could sit on any other carousel, rewrite it.",
    "- Each slide's \"kicker\" is the SEGMENT LABEL shown above the headline: 1-4 words drawn from THAT slide's own specifics (a name, place, figure, or turn), UNIQUE to this slide — NEVER a generic or recycled category word ('THE SHIFT', 'THE ORIGIN', 'THE STAKES', 'THE TURNING POINT', 'KEY TAKEAWAY', 'WHY IT MATTERS'). The role beats only steer the arc; they are NOT the visible kicker. If the kicker could sit on any other deck's slide, rewrite it.",
    "- Make each slide LAND, don't state it flat — carry at least one of these, sharply: the STAKES (what's actually at risk / why it matters now, in concrete terms), the HUMAN STORY (a specific named person, scene, or lived consequence — not abstractions), or the EVIDENCE (a hard number, date, or verifiable fact). Cut filler abstractions; prefer the concrete detail every time.",
    "- Attribute every quote: any direct quotation MUST name who said it — the speaker (with their role/title) or the source — right on that slide, never a floating unattributed quote. A 'quote' layout slide must carry its attribution (e.g. in the body or sources).",
    "- Keep each body under ~45 words. Sources: 1-2 real, credible outlets you verified; omit rather than invent.",
    '- On a content slide you MAY add "highlight": one short phrase (2-5 words) copied VERBATIM from that slide\'s own body, to emphasize as a marker. It must be an exact substring of the body — pick the single most striking phrase, and omit it if nothing stands out.',
    '- On any slide built around ONE specific named person, place, organisation, or single work (a film, album, book, product), add "entity" (its exact canonical name) and "entityType" (one of "person", "place", "org", "work") so a real photo of it can be sourced. Use the precise name a reader would search — e.g. "Burna Boy", "Studio Ghibli", "Parasite (2019 film)". Omit both fields when the slide is about a general concept rather than one named thing.',
    "",
    "Optional data slides (use only when the topic genuinely supports them — a clean text deck beats a forced one):",
    '- At most ONE content slide may be a big-number STAT: add "stat" (a short value like "73%", "$2.4B", "10x") and "statLabel" (what it measures) in place of a long body. Use a real, verified figure — never invent one; if unsure, skip it.',
    '- At most ONE content slide may be a head-to-head VERSUS: add "versus":{"left":{"label":"...","value":"..."},"right":{"label":"...","value":"..."}} when there is a natural two-side comparison. Keep each value to a few words.',
    '- Put a STAT or VERSUS on the slide whose role is most data- or evidence-oriented — e.g. "The Numbers", "The Data", "The Evidence", "The Proof", "The Stakes" — not on a narrative or scene-setting slide.',
    "",
    "Output the JSON object as your entire response. Search the web as needed, then return ONLY the JSON — no preamble, no \"I'll research...\", no commentary before or after, no markdown fences.",
  ].filter((line) => line != null).join("\n");
}

// Back-compat alias.
export function buildEditorialPrompt(topic) {
  return buildPrompt(topic, "editorial");
}

function extractText(data) {
  const blocks = (data && data.content) || [];
  return stripCites(
    blocks.filter((b) => b && b.type === "text").map((b) => b.text || "").join(""),
  );
}

// Pull the deck JSON object out of the model's answer — tolerant of fences,
// preamble/suffix, trailing commas, and either field order of caption / slides.
function parseDeckJSON(text) {
  if (!text) throw new Error("Empty model response");
  let cleaned = text.replace(/```json|```/g, "").trim();
  let start = -1;
  for (const probe of ['{"caption"', '{"slides"']) {
    const i = cleaned.indexOf(probe);
    if (i >= 0 && (start < 0 || i < start)) start = i;
  }
  if (start < 0) start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1"); // tolerate trailing commas
  return JSON.parse(cleaned);
}

export function parseSlides(text) {
  const obj = parseDeckJSON(text);
  if (!obj || !Array.isArray(obj.slides)) throw new Error("No slides array in response");
  return obj.slides;
}

// The Instagram caption object from the deck JSON, or null if absent/unparseable.
export function parseCaption(text) {
  try {
    const obj = parseDeckJSON(text);
    return obj && obj.caption ? obj.caption : null;
  } catch (e) {
    return null;
  }
}

// The REVISE ("Polish") pass — a ruthless structural edit of an already-written
// draft deck. `deckJson` is the cleaned draft JSON string; the editor returns the
// SAME shape, keeping the facts/sources/slide-count and only tightening the spine,
// arc, transitions, and prose. Pure (string assembly) → unit-tested.
export function buildRevisePrompt(deckJson) {
  return [
    "You are a ruthless magazine editor doing a final STRUCTURAL pass on a draft Instagram carousel before it ships.",
    "Here is the draft as JSON:",
    deckJson,
    "",
    "Revise it so the deck reads as ONE piece, not a stack of cards. Hold to ALL of these:",
    "- SPINE: there is a single through-line the whole deck advances; if a slide doesn't advance it, rewrite that slide so it does.",
    "- ARC: the cover poses a tension, each middle slide escalates it ONE concrete step (raise the stakes or deepen the last point), the closer resolves it. No plateau in the middle.",
    "- CONNECTIVE TISSUE: every slide picks up a thread from the one before — a consequence, a complication, a \"but then\", a zoom-in or zoom-out — so swiping reads continuous, not a list.",
    "- CALLBACK: the closer pays off the cover's EXACT hook — answer the question it raised or land the turn it promised.",
    "- EARN EVERY SLIDE: never make the same point twice; if two slides could swap order with no loss, fix it (merge, cut, or re-angle one).",
    "- WRITE-UP: concrete nouns + strong verbs over adjectives, vary sentence length, cut filler and the banned lazy phrases (\"in today's world\", \"delve\", \"game-changer\", \"navigate the landscape\", etc.).",
    "",
    "HARD CONSTRAINTS: keep the deck's FACTS, figures, names, quotes, SOURCES, and the SLIDE COUNT and per-slide fields exactly — this is an edit for structure and prose, NOT a rewrite of the reporting. Do not invent facts, drop sources, or change the number of slides.",
    "Return ONLY the revised JSON object in the EXACT same shape as the input (caption + slides with the same fields). No prose, no markdown fences.",
  ].join("\n");
}

// Run the revise pass on a draft deck's text: extract the clean deck JSON, hand it
// to the editor (Opus, HIGH effort, NO web search — it's restructuring existing
// content, not looking anything up), and return the revised text. Validates the
// result parses to slides; the caller keeps the draft on any failure. Cancellable
// + progress via opts.
export async function reviseDeck(draftText, opts) {
  const o = opts || {};
  let deckJson;
  try { deckJson = JSON.stringify(parseDeckJSON(draftText)); } catch (e) { deckJson = String(draftText || ""); }
  const prompt = buildRevisePrompt(deckJson);
  const text = await runPrompt(prompt, {
    model: o.model, webSearch: false, stream: o.stream, effort: o.effort || "high", signal: o.signal, onPhase: o.onPhase,
  });
  parseSlides(text); // throws if the revision is malformed → caller falls back to the draft
  return text;
}

// Fold one parsed Anthropic SSE event into the accumulator. We only keep the
// text deltas (the JSON) and the terminal stop reason; thinking deltas, the
// web-search tool blocks, and everything else are ignored. Pure → unit-tested.
export function foldStreamEvent(acc, evt) {
  if (!evt || !evt.type) return acc;
  if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") {
    return Object.assign({}, acc, { text: acc.text + (evt.delta.text || "") });
  }
  if (evt.type === "message_delta" && evt.delta && evt.delta.stop_reason) {
    return Object.assign({}, acc, { stop: evt.delta.stop_reason });
  }
  if (evt.type === "error") {
    return Object.assign({}, acc, { error: (evt.error && evt.error.message) || "stream error" });
  }
  return acc;
}

// Read the route's SSE passthrough to its end, accumulating the final answer
// text. Defensive: a malformed event line is skipped, not fatal. `onPhase` (if
// given) is called with "searching" when a web-search tool block opens and
// "writing" when the model starts emitting the answer text — coarse progress for
// the UI, fired only on change. The reader's read() rejects if the underlying
// fetch is aborted, which propagates out as the AbortError the caller swallows.
async function readSSEText(body, onPhase) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let acc = { text: "", stop: null, error: null };
  let phase = null;
  const setPhase = (p) => { if (p !== phase) { phase = p; if (onPhase) try { onPhase(p); } catch (e) {} } };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, nl);
      buf = buf.slice(nl + 2);
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      let evt;
      try { evt = JSON.parse(dataLine.slice(5).trim()); } catch (e) { continue; }
      if (evt.type === "content_block_start" && evt.content_block && evt.content_block.type === "server_tool_use") setPhase("searching");
      else if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") setPhase("writing");
      acc = foldStreamEvent(acc, evt);
    }
  }
  if (acc.error) throw new Error(acc.error);
  if (acc.stop === "pause_turn") throw new Error("The web search hit its step limit before the deck was written — please try again, or switch on “Quick draft” to skip the search.");
  if (acc.stop === "max_tokens") throw new Error("The response was cut off before finishing — please try again.");
  const out = stripCites(acc.text);
  // Empty/whitespace output means the stream ended before any deck JSON was
  // written — almost always the serverless function hitting its wall-clock cap
  // mid-search on a broad topic. Surface that plainly with a way forward, rather
  // than letting parseSlides throw a cryptic "Empty model response".
  if (!out.trim()) {
    throw new Error("The response was cut off before any slides were written — the web search likely ran past the time limit. Try again, narrow the topic, or switch on “Quick draft” to skip the search.");
  }
  return out;
}

// After the text is written, fetch one photo per slide from the existing
// /api/images carousel pipeline. Best-effort: any failure yields {} and the
// deck renders on solid backgrounds — generation never fails for lack of photos.
async function fetchSlideImages(slides, topic) {
  try {
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides, topic, wantMosaic: false }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return (data && data.imgMap) || {};
  } catch (e) {
    return {};
  }
}

function todayISO() {
  try { return new Date().toISOString().slice(0, 10); } catch (e) { return ""; }
}

// Run one prompt through the /api/generate proxy and return the final answer
// text. Streams (a web-search + Opus call can exceed Vercel's 60s cap) and drops
// the thinking + search-tool blocks. Shared by carousel generation and the
// fact-check pass (verify.js).
export async function runPrompt(prompt, opts) {
  const o = opts || {};
  const stream = o.stream !== false;
  const payload = {
    model: o.model || MODEL,
    // Headroom for adaptive thinking + a multi-step web search + the full deck
    // JSON. At 8000 the JSON was getting truncated after the search narration.
    max_tokens: o.maxTokens || 16000,
    messages: [{ role: "user", content: prompt }],
  };
  // Adaptive thinking + medium effort by default — editorial quality without the
  // high-effort token cost. A cheap utility call (the Haiku caption rewrite)
  // passes thinking:false to skip reasoning entirely: faster and lighter.
  if (o.thinking !== false) {
    payload.thinking = { type: "adaptive" };
    payload.output_config = { effort: o.effort || "medium" };
  }
  if (o.webSearch !== false) payload.tools = [WEB_SEARCH_TOOL];
  if (stream) payload.stream = true;

  // Attach the Firebase ID token when signed in, so the gated route accepts the
  // call. null (cloud disabled / signed out) → no header, route stays open.
  const headers = { "Content-Type": "application/json" };
  const token = await getIdToken();
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch("/api/generate", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: o.signal,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    let msg = (data && (data.error && (data.error.message || data.error))) || ("HTTP " + res.status);
    // Surface the auth gate's reason ("no token" / "invalid token: …") so a
    // signed-in user hitting a 401 sees WHY (token not sent vs verification failed,
    // e.g. a service-account/web-config project mismatch) instead of a bare prompt.
    if (data && data.reason) msg += " (" + data.reason + ")";
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (stream && res.body && ct.includes("text/event-stream")) return readSSEText(res.body, o.onPhase);
  return extractText(await res.json());
}

export async function generateCarousel(topic, opts) {
  const o = opts || {};
  // Web search ON by default — decks come out current and sourced. It's the slow
  // path (usually ~40-60s, occasionally minutes), so the call is cancellable
  // (o.signal) and reports progress (o.onPhase). Pass webSearch:false for a fast
  // "Quick draft" from the model's knowledge (still anchored to today's date).
  // A document source is the material — never web-search over it (the doc is the
  // truth), regardless of the quick-draft toggle.
  const sourceDoc = o.sourceDoc ? String(o.sourceDoc) : "";
  const webSearch = sourceDoc ? false : (o.webSearch !== false);
  const prompt = buildPrompt(topic, o.category, { seed: o.seed, today: o.today != null ? o.today : todayISO(), webSearch, ground: o.ground, slides: o.slides, tone: o.tone, voice: o.voice, sourceDoc, route: o.route, unbranded: o.unbranded, fidelity: o.fidelity });
  let text = await runPrompt(prompt, { model: o.model, webSearch, stream: o.stream, signal: o.signal, onPhase: o.onPhase });
  // Polish pass (opt-in): a second editor pass tightens the spine, arc, and
  // transitions. Best-effort — any failure keeps the draft, so a flaky revise
  // never fails the whole generation. Reports a "polishing" phase for the UI.
  if (o.polish) {
    try {
      if (o.onPhase) o.onPhase("polishing");
      text = await reviseDeck(text, { model: o.model, stream: o.stream, signal: o.signal });
    } catch (e) { /* keep the draft */ }
  }
  const slides = parseSlides(text);
  const wantPhotos = o.photos !== false;
  const imgMap = wantPhotos ? await fetchSlideImages(slides, topic) : {};
  // Seed the closing caution from the category (business/news carry one).
  const category = o.category || null;
  const cau = category ? cautionFor(category) : null;
  const doc = slidesToDoc(slides, o.style, imgMap, { category, caution: cau ? cau.default : "" });
  // Fold in the Instagram caption the same Opus call already wrote; if it's
  // missing/unparseable, assemble a usable one from the deck (no extra call).
  const cap = normalizeCaption(parseCaption(text)) || fallbackCaption(slides);
  doc.caption = captionText(cap);
  return doc;
}

// Regenerate ONLY the caption from an existing deck — a cheap, no-search call on
// a small, fast model (Haiku), with reasoning off. Returns the assembled caption
// string, or "" on failure (the caller keeps the current caption). The model
// here only rewrites content already on screen, so it never needs the web.
const CAPTION_MODEL = "claude-haiku-4-5";
function deckBeats(doc) {
  return ((doc && doc.slides) || []).map((s, i) => {
    const c = (s && s.content) || {};
    const head = c.heading || c.title || "";
    const sub = c.subhead || c.body || c.cta || "";
    const line = [head, sub].filter(Boolean).join(" — ");
    return line ? (i + 1) + ". " + line : "";
  }).filter(Boolean).join("\n");
}
export async function regenerateCaption(doc, opts) {
  const o = opts || {};
  const beats = deckBeats(doc);
  if (!beats) return "";
  const prompt = [
    "Write a high-performing Instagram caption for this carousel. Take a fresh angle on the hook.",
    "",
    "Carousel beats:",
    beats,
    "",
    'Build it to perform: hook <= 125 chars (scroll-stopping); body 2-4 short skimmable lines separated by \\n; cta drives saves and shares, asks a question, then ends on the follow (@loathrdotcom); weave in plain keywords.',
    'Return ONLY this JSON, no prose, no fences: {"caption":{"hook":"...","body":"...","cta":"...","hashtags":["tag","tag"]}}. hashtags: words only, lowercase, no # symbol, 10-15 of them.',
  ].join("\n");
  const text = await runPrompt(prompt, {
    model: o.model || CAPTION_MODEL, webSearch: false, stream: false, thinking: false, maxTokens: 1200, signal: o.signal,
  });
  const cap = normalizeCaption(parseCaption(text));
  return cap ? captionText(cap) : "";
}
