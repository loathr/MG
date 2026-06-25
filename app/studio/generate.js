// Generation: build an editorial prompt, call the existing /api/generate proxy,
// parse the slides JSON, and instantiate the canvas document. Content-quality
// tuning lives here (Phase 4) — for now a focused editorial brief.
import { slidesToDoc } from "./templates";
import { getCategory, cautionFor } from "./categories";

// Build the generation prompt for a topic in a given content category. The
// category supplies the voice (persona + brief), the content-slide role labels,
// and the closing CTA; the JSON shape is constant so parsing stays stable.
export function buildPrompt(topic, categoryKey) {
  const cat = getCategory(categoryKey);
  const roles = cat.roles;
  return [
    "You are " + cat.persona + " writing a premium Instagram carousel.",
    'Topic: "' + topic + '".',
    cat.brief,
    "",
    "Craft standards (this is the quality bar — hold to all of them):",
    '- The cover hooks with a specific promise or tension, never a generic label ("The Future of X", "Everything You Need to Know", "A Deep Dive Into...").',
    "- One idea per slide, made concrete: back each claim with a name, number, date, or place.",
    "- Show, don't summarize — concrete nouns and strong verbs over adjectives. Vary sentence length; if a line reads like a press release, rewrite it.",
    '- Banned as lazy: "in today\'s world", "delve", "moreover", "it\'s important to note", "game-changer", "unlock", "navigate the landscape", "in conclusion".',
    '- Don\'t fabricate precise statistics. If you don\'t know the exact figure, give the magnitude instead ("roughly half", "in the millions").',
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
    "- Keep each body under ~45 words. Sources: 1-2 real, credible outlets; omit rather than invent.",
    '- On a content slide you MAY add "highlight": one short phrase (2-5 words) copied VERBATIM from that slide\'s own body, to emphasize as a marker. It must be an exact substring of the body — pick the single most striking phrase, and omit it if nothing stands out.',
    "",
    "Optional data slides (use only when the topic genuinely supports them — a clean text deck beats a forced one):",
    '- At most ONE content slide may be a big-number STAT: add "stat" (a short value like "73%", "$2.4B", "10×") and "statLabel" (what it measures) in place of a long body. Use a real, defensible figure — never invent one; if unsure, skip it.',
    '- At most ONE content slide may be a head-to-head VERSUS: add "versus":{"left":{"label":"…","value":"…"},"right":{"label":"…","value":"…"}} when there is a natural two-side comparison. Keep each value to a few words.',
  ].join("\n");
}

// Back-compat alias.
export function buildEditorialPrompt(topic) {
  return buildPrompt(topic, "editorial");
}

function extractText(data) {
  const blocks = (data && data.content) || [];
  return blocks
    .filter((b) => b && b.type === "text")
    .map((b) => (b.text || "").replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""))
    .join("");
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

// After the text is written, fetch one photo per slide from the existing
// /api/images carousel pipeline (returns { imgMap: { slideIndex: {url,thumb,…} } }).
// Best-effort: any failure (no keys, network, timeout) just yields {} and the
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

export async function generateCarousel(topic, opts) {
  const prompt = buildPrompt(topic, opts && opts.category);
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: (opts && opts.model) || "claude-opus-4-7",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error((data && (data.error.message || data.error)) || ("HTTP " + res.status));
  }
  const slides = parseSlides(extractText(data));
  const wantPhotos = !opts || opts.photos !== false;
  const imgMap = wantPhotos ? await fetchSlideImages(slides, topic) : {};
  // Seed the closing caution from the category (business/news carry one).
  const category = (opts && opts.category) || null;
  const cau = category ? cautionFor(category) : null;
  return slidesToDoc(slides, opts && opts.style, imgMap, { category, caution: cau ? cau.default : "" });
}
