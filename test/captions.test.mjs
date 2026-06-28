// Unit checks for app/studio/captions.js — the pure Instagram-caption helpers:
// normalize the model's caption object, assemble it into copy-paste text, and
// build a no-model fallback from the deck.
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCaption, captionText, fallbackCaption } from "../app/studio/captions.js";

test("normalizeCaption coerces shape, splits string tags, strips # + lowercases + dedupes", () => {
  const c = normalizeCaption({ hook: " Hook ", body: "B", cta: "C", hashtags: ["#AI", "Tech", " gpu ", "ai"] });
  assert.deepEqual(c, { hook: "Hook", body: "B", cta: "C", hashtags: ["ai", "tech", "gpu"] });
  assert.deepEqual(normalizeCaption({ hashtags: "#ai, tech gpu" }).hashtags, ["ai", "tech", "gpu"]);
  assert.equal(normalizeCaption(null), null);
  assert.equal(normalizeCaption({ hook: "", body: "", cta: "", hashtags: [] }), null);
});

test("captionText assembles hook/body/cta + #tags with blank lines; strings pass through", () => {
  assert.equal(
    captionText({ hook: "H", body: "B", cta: "Follow", hashtags: ["ai", "tech"] }),
    "H\n\nB\n\nFollow\n\n#ai #tech",
  );
  assert.equal(captionText("already assembled"), "already assembled");
  assert.equal(captionText(null), "");
  // no hashtags → no trailing tag line
  assert.equal(captionText({ hook: "H", body: "", cta: "C", hashtags: [] }), "H\n\nC");
});

test("fallbackCaption builds a usable caption from deck content with no model call", () => {
  const slides = [
    { content: { heading: "Cover Hook", subhead: "sub" } },
    { content: { heading: "First Point" } },
    { content: { heading: "Second Point" } },
    { content: { cta: "Follow @loathrdotcom for more" } },
  ];
  const c = fallbackCaption(slides);
  assert.equal(c.hook, "Cover Hook");
  assert.match(c.body, /First Point/);
  assert.match(c.body, /Second Point/);
  assert.equal(c.cta, "Follow @loathrdotcom for more");
  assert.ok(c.hashtags.length >= 1);
  assert.ok(c.hashtags.every((t) => /^[a-z0-9]+$/.test(t))); // clean tags
});
