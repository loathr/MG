// Generation: build an editorial prompt, call the existing /api/generate proxy,
// parse the slides JSON, and instantiate the canvas document. Content-quality
// tuning lives here (Phase 4) — for now a focused editorial brief.
import { slidesToDoc } from "./templates";
import { getCategory } from "./categories";

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
    "Return ONLY a JSON object (no prose, no markdown fences) of this exact shape:",
    '{"slides":[',
    '  {"role":"COVER","kicker":"SHORT SECTION LABEL","heading":"punchy headline, <= 9 words","subhead":"one vivid sentence that sets up the story"},',
    '  {"role":"' + roles[0] + '","heading":"slide headline","body":"2-3 tight, specific sentences","sources":["Source A","Source B"]},',
    "  ... 4 to 6 content slides, each with a DIFFERENT role drawn from: " + roles.join(", ") + " ...",
    '  {"role":"CLOSER","heading":"a resonant closing line","cta":"' + cat.cta + '"}',
    "]}",
    "",
    "Rules:",
    "- 7 to 9 slides total (cover + 5-7 content + closer).",
    "- Be factual and specific; use real names, numbers, places where appropriate.",
    "- Headlines in Title Case. No hashtags or emoji in body text.",
    "- Keep bodies tight (max ~45 words). Sources: 1-2 short, credible outlet names.",
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
  return slidesToDoc(slides, opts && opts.style, imgMap);
}
