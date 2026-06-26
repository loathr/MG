// Generation: build an editorial prompt (category voice + a seeded angle/voice
// for variety + today's date), call the /api/generate proxy WITH web search so
// the copy is current and sourced, parse the slides JSON out of the streamed
// response, and instantiate the canvas document.
//
// The model is Claude Opus with ADAPTIVE THINKING — its reasoning stays in
// thinking blocks (which we drop), so the visible text is just the JSON. The
// call STREAMS: a long Opus + web-search generation can run well past Vercel's
// 60s function cap, and a streamed response keeps the function alive (the route
// pipes Anthropic's SSE straight through). We only read it to accumulate the
// final text — nothing is rendered token-by-token.
import { slidesToDoc } from "./templates";
import { getCategory, cautionFor } from "./categories";

const MODEL = "claude-opus-4-8";
// Server-side web search (dynamic-filtering variant — Opus 4.8). One tool entry;
// the model runs the searches and we read the final text it writes.
const WEB_SEARCH_TOOL = { type: "web_search_20260209", name: "web_search", max_uses: 5 };

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

// Build the generation prompt. The category supplies the voice (persona +
// brief), the content-slide role labels, and the CTA; `opts.seed` selects the
// angle/voice (defaults to a hash of the topic), and `opts.today` anchors "now".
export function buildPrompt(topic, categoryKey, opts) {
  const o = opts || {};
  const cat = getCategory(categoryKey);
  const roles = cat.roles;
  const seed = o.seed != null ? o.seed >>> 0 : hashStr(topic + "|" + categoryKey);
  const angle = ANGLES[seed % ANGLES.length];
  const voice = VOICES[Math.floor(seed / ANGLES.length) % VOICES.length];
  return [
    "You are " + cat.persona + " writing a premium Instagram carousel.",
    'Topic: "' + topic + '".',
    o.today ? "Today's date is " + o.today + ". Treat the topic as of now — prefer the most recent, verifiable facts and avoid stale or dated framing." : null,
    cat.brief,
    "Approach this through " + angle + ". Voice: " + voice + ".",
    "",
    "Research first: use web search to verify the key facts, figures, names, and any recent developments before you write. Ground every claim in what you actually find, and cite the 1-2 strongest real, current outlets per slide. Never cite a source you did not find, and never invent a statistic.",
    "",
    "Craft standards (this is the quality bar — hold to all of them):",
    '- The cover hooks with a specific promise or tension, never a generic label ("The Future of X", "Everything You Need to Know", "A Deep Dive Into...").',
    "- One idea per slide, made concrete: back each claim with a name, number, date, or place.",
    "- Show, don't summarize — concrete nouns and strong verbs over adjectives. Vary sentence length; if a line reads like a press release, rewrite it.",
    '- Banned as lazy: "in today\'s world", "delve", "moreover", "it\'s important to note", "game-changer", "unlock", "navigate the landscape", "in conclusion".',
    "- The closer lands a line worth screenshotting, then invites the follow naturally.",
    "",
    "Return ONLY a JSON object (no prose, no markdown fences) of this exact shape:",
    '{"slides":[',
    '  {"role":"COVER","kicker":"SHORT SECTION LABEL","heading":"the hook, <= 9 words","subhead":"one vivid sentence that makes the swipe irresistible"},',
    '  {"role":"' + roles[0] + '","heading":"a specific, concrete headline","body":"2-3 tight sentences carrying one proof point","sources":["Outlet"]},',
    "  ... more content slides, same shape ...",
    '  {"role":"CLOSER","heading":"a resonant closing line","cta":"' + cat.cta + '"}',
    "]}",
    "",
    "Rules:",
    "- 7 to 9 slides total: cover + 5-7 content + closer.",
    "- Build the content slides from these roles, in a logical order; use each at most once and pick the ones that tell the strongest story: " + roles.join(", ") + ". (A topic that only needs 5 makes a tight 7-slide deck — that's good.)",
    "- Headlines in Title Case; bodies in full sentences. No hashtags or emoji anywhere.",
    "- Keep each body under ~45 words. Sources: 1-2 real, credible outlets you verified; omit rather than invent.",
    '- On a content slide you MAY add "highlight": one short phrase (2-5 words) copied VERBATIM from that slide\'s own body, to emphasize as a marker. It must be an exact substring of the body — pick the single most striking phrase, and omit it if nothing stands out.',
    "",
    "Optional data slides (use only when the topic genuinely supports them — a clean text deck beats a forced one):",
    '- At most ONE content slide may be a big-number STAT: add "stat" (a short value like "73%", "$2.4B", "10x") and "statLabel" (what it measures) in place of a long body. Use a real, verified figure — never invent one; if unsure, skip it.',
    '- At most ONE content slide may be a head-to-head VERSUS: add "versus":{"left":{"label":"...","value":"..."},"right":{"label":"...","value":"..."}} when there is a natural two-side comparison. Keep each value to a few words.',
    '- Put a STAT or VERSUS on the slide whose role is most data- or evidence-oriented — e.g. "The Numbers", "The Data", "The Evidence", "The Proof", "The Stakes" — not on a narrative or scene-setting slide.',
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

export function parseSlides(text) {
  if (!text) throw new Error("Empty model response");
  let cleaned = text.replace(/```json|```/g, "").trim();
  let start = cleaned.indexOf('{"slides"');
  if (start < 0) start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1"); // tolerate trailing commas
  const obj = JSON.parse(cleaned);
  if (!obj || !Array.isArray(obj.slides)) throw new Error("No slides array in response");
  return obj.slides;
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
// text. Defensive: a malformed event line is skipped, not fatal.
async function readSSEText(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let acc = { text: "", stop: null, error: null };
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
      try { acc = foldStreamEvent(acc, JSON.parse(dataLine.slice(5).trim())); } catch (e) { /* skip */ }
    }
  }
  if (acc.error) throw new Error(acc.error);
  if (acc.stop === "pause_turn") throw new Error("Generation paused before finishing — please try again.");
  return stripCites(acc.text);
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

export async function generateCarousel(topic, opts) {
  const o = opts || {};
  const prompt = buildPrompt(topic, o.category, { seed: o.seed, today: o.today != null ? o.today : todayISO() });
  const webSearch = o.webSearch !== false;
  const stream = o.stream !== false;
  const payload = {
    model: o.model || MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  };
  if (webSearch) payload.tools = [WEB_SEARCH_TOOL];
  if (stream) payload.stream = true;

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data && (data.error && (data.error.message || data.error))) || ("HTTP " + res.status));
  }

  let text;
  const ct = res.headers.get("content-type") || "";
  if (stream && res.body && ct.includes("text/event-stream")) {
    text = await readSSEText(res.body);
  } else {
    text = extractText(await res.json());
  }

  const slides = parseSlides(text);
  const wantPhotos = o.photos !== false;
  const imgMap = wantPhotos ? await fetchSlideImages(slides, topic) : {};
  // Seed the closing caution from the category (business/news carry one).
  const category = o.category || null;
  const cau = category ? cautionFor(category) : null;
  return slidesToDoc(slides, o.style, imgMap, { category, caution: cau ? cau.default : "" });
}
