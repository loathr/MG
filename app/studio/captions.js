// ============================================================================
// Instagram caption — pure helpers (no DOM, unit-tested). The caption is the
// post text under the carousel, built to perform on the algorithm: a
// scroll-stopping hook, skimmable value, a save/share CTA, and hashtags.
//
// The model returns a { hook, body, cta, hashtags[] } object (folded into the
// deck generation, or via the cheap Haiku regenerate). normalizeCaption coerces
// that defensively; captionText assembles it into the single string a user
// copies into Instagram; fallbackCaption builds one from the deck with NO model
// call, so a caption always exists.
// ============================================================================

// Coerce a raw model caption into { hook, body, cta, hashtags[] } — or null when
// there's nothing usable. Tolerates missing fields, non-strings, hashtags given
// as a string, and stray '#' / casing on tags.
export function normalizeCaption(raw) {
  if (!raw || typeof raw !== "object") return null;
  const str = (v) => (typeof v === "string" ? v.trim() : "");
  const hook = str(raw.hook);
  const body = str(raw.body);
  const cta = str(raw.cta);
  let tags = [];
  if (Array.isArray(raw.hashtags)) tags = raw.hashtags;
  else if (typeof raw.hashtags === "string") tags = raw.hashtags.split(/[\s,]+/);
  const seen = {};
  tags = tags
    .map((t) => String(t).replace(/^#+/, "").trim().toLowerCase())
    .filter((t) => t && !seen[t] && (seen[t] = 1));
  if (!hook && !body && !cta && !tags.length) return null;
  return { hook, body, cta, hashtags: tags };
}

// Assemble a caption object into the single copy-paste string: hook / body / cta
// separated by blank lines, then the hashtags as a #-prefixed line. A string is
// passed through untouched (the stored caption is already assembled text).
export function captionText(cap) {
  if (typeof cap === "string") return cap;
  const c = normalizeCaption(cap);
  if (!c) return "";
  const parts = [c.hook, c.body, c.cta].map((s) => (s || "").trim()).filter(Boolean);
  if (c.hashtags.length) parts.push(c.hashtags.map((t) => "#" + t).join(" "));
  return parts.join("\n\n");
}

const STOP = {
  the: 1, and: 1, for: 1, with: 1, that: 1, this: 1, from: 1, into: 1, your: 1,
  what: 1, how: 1, why: 1, when: 1, who: 1, are: 1, was: 1, has: 1, its: 1,
  their: 1, they: 1, will: 1, more: 1, than: 1, over: 1, into: 1, about: 1,
};

// Build a usable caption from the deck itself, with NO model call — the cover
// hook, the middle headlines as bullets, the closer's CTA, and crude hashtags
// from the deck's notable words. The safety net when the model's caption is
// missing or unparseable.
export function fallbackCaption(slides) {
  const arr = Array.isArray(slides) ? slides : [];
  const contentOf = (s) => (s && s.content) || {};
  const first = contentOf(arr[0]);
  const last = contentOf(arr[arr.length - 1]);
  const hook = (first.heading || first.title || "").trim();
  const mids = arr.slice(1, -1).map((s) => (contentOf(s).heading || "").trim()).filter(Boolean).slice(0, 3);
  const body = mids.length ? mids.map((m) => "→ " + m).join("\n") : (first.subhead || "").trim();
  const cta = (last.cta || "Follow @loathrdotcom for more").trim();
  const words = (hook + " " + mids.join(" ")).toLowerCase().match(/[a-z][a-z0-9]{3,}/g) || [];
  const seen = {};
  const hashtags = [];
  for (const w of words) {
    if (STOP[w] || seen[w]) continue;
    seen[w] = 1;
    hashtags.push(w);
    if (hashtags.length >= 8) break;
  }
  return normalizeCaption({ hook, body, cta, hashtags });
}
