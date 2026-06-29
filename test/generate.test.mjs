// Unit checks for app/studio/generate.js — the pure pieces of the generation
// upgrade (web search + seeded voice/angle + date anchor): the prompt builder,
// the seed hash, the streamed-event fold, cite-stripping, and the slides parse.
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPrompt, hashStr, stripCites, foldStreamEvent, parseSlides, parseCaption,
} from "../app/studio/generate.js";

test("buildPrompt threads voice/date/JSON shape; web-search rule only when enabled", () => {
  const base = { seed: 3, today: "2026-06-26" };
  const p = buildPrompt("the rise of A24 horror", "editorial", base);
  assert.match(p, /writing a premium Instagram carousel/);
  assert.match(p, /Today's date is 2026-06-26/);          // date anchor
  assert.match(p, /Approach this through/);                // seeded angle
  assert.match(p, /Voice:/);                               // seeded voice
  assert.match(p, /"slides": \[/);                         // JSON shape (caption + slides)
  assert.match(p, /THE ORIGIN/);                           // editorial role label
  assert.match(p, /"entity"/);                             // #6 entity capture instruction
  assert.match(p, /"entityType"/);
  // cohesion: a deck spine + arc, a callback closer, and rising-arc role order
  assert.match(p, /decide the SPINE first/);
  assert.match(p, /Callback: the closer pays off the cover/);
  assert.match(p, /rising arc/);
  // caption: an algorithm-aware Instagram caption in the JSON shape
  assert.match(p, /Instagram CAPTION/);
  assert.match(p, /"caption":/);
  assert.match(p, /hashtags/);
  // two-page spill: a dense point may run across two consecutive slides
  assert.match(p, /spill across two consecutive slides/);
  assert.match(p, /CONT'D/);
  // content-driven layout: the model may pick a fit layout, not a forced pattern
  assert.match(p, /MAY set "layout"/);
  assert.match(p, /never to force variety/);
  // quotes must name the quoter — no floating unattributed quotations
  assert.match(p, /Attribute every quote/);
  // headlines specific to content; stakes / human story / evidence must land
  assert.match(p, /Headlines must be SPECIFIC/);
  assert.match(p, /STAKES/);
  assert.match(p, /HUMAN STORY/);
  // segment label (kicker) is model-written, slide-specific, never a recycled role word
  assert.match(p, /"kicker":/);                            // kicker in the JSON shape
  assert.match(p, /section label, specific to THIS slide/); // content-slide kicker instruction
  assert.match(p, /SEGMENT LABEL shown above the headline/); // the rule that bans generic kickers
  // default (no web search): a "from knowledge" grounding line, not a search instruction
  assert.match(p, /Ground every claim/);
  assert.doesNotMatch(p, /use web search/);
  // opt-in research mode swaps in the web-search instruction
  assert.match(buildPrompt("x", "editorial", Object.assign({}, base, { webSearch: true })), /use web search/);
});

test("buildPrompt is deterministic for a fixed seed and varies the angle by seed", () => {
  assert.equal(
    buildPrompt("topic", "news", { seed: 5, today: "2026-06-26" }),
    buildPrompt("topic", "news", { seed: 5, today: "2026-06-26" }),
  );
  // seeds 0 and 1 select different angles → different prompt text
  assert.notEqual(
    buildPrompt("topic", "news", { seed: 0 }),
    buildPrompt("topic", "news", { seed: 1 }),
  );
});

test("buildPrompt omits the date line when no `today` is supplied", () => {
  assert.doesNotMatch(buildPrompt("t", "editorial", { seed: 1 }), /Today's date is/);
});

test("hashStr is stable and non-negative", () => {
  assert.equal(hashStr("abc"), hashStr("abc"));
  assert.notEqual(hashStr("abc"), hashStr("abd"));
  assert.ok(hashStr("anything") >= 0);
});

test("stripCites removes inline <cite> markers, keeps the text", () => {
  assert.equal(stripCites('a <cite index="1-2">b</cite> c'), "a b c");
  assert.equal(stripCites("no cites here"), "no cites here");
});

test("foldStreamEvent accumulates text deltas, ignores thinking, records stop/error", () => {
  let acc = { text: "", stop: null, error: null };
  acc = foldStreamEvent(acc, { type: "content_block_delta", delta: { type: "text_delta", text: "ab" } });
  acc = foldStreamEvent(acc, { type: "content_block_delta", delta: { type: "thinking_delta", thinking: "X" } });
  acc = foldStreamEvent(acc, { type: "content_block_delta", delta: { type: "text_delta", text: "cd" } });
  assert.equal(acc.text, "abcd");        // thinking delta ignored
  acc = foldStreamEvent(acc, { type: "message_delta", delta: { stop_reason: "end_turn" } });
  assert.equal(acc.stop, "end_turn");
  acc = foldStreamEvent(acc, { type: "error", error: { message: "boom" } });
  assert.equal(acc.error, "boom");
});

test("parseSlides tolerates fences, preamble, and trailing commas", () => {
  assert.equal(parseSlides('{"slides":[{"role":"COVER","heading":"H"}]}').length, 1);
  assert.equal(parseSlides('```json\n{"slides":[{"heading":"A"},{"heading":"B"}]}\n```').length, 2);
  assert.equal(parseSlides('{"slides":[{"heading":"A"},]}').length, 1);          // trailing comma
  assert.equal(parseSlides('sure: {"slides":[{"heading":"A"}]} — done').length, 1); // preamble/suffix
});

test("parseSlides throws on empty or shapeless responses", () => {
  assert.throws(() => parseSlides(""));
  assert.throws(() => parseSlides('{"nope":1}'));
});

test("parseCaption pulls the caption out of the deck JSON; slides still parse alongside it", () => {
  const txt = '{"caption":{"hook":"H","body":"B","cta":"C","hashtags":["ai"]},"slides":[{"role":"COVER","heading":"X"}]}';
  const cap = parseCaption(txt);
  assert.equal(cap.hook, "H");
  assert.deepEqual(cap.hashtags, ["ai"]);
  assert.equal(parseSlides(txt).length, 1);            // caption present, slides still found
  assert.equal(parseCaption('{"slides":[]}'), null);   // no caption → null
  assert.equal(parseCaption("not json"), null);        // unparseable → null, never throws
});

test("buildPrompt threads a grounded source seed only when one is provided (R5)", () => {
  const g = buildPrompt("x", "news", { seed: 1, ground: { extract: "27 members voted 320-115", source: "The Guardian" } });
  assert.match(g, /build the deck on these specific facts/i);
  assert.match(g, /27 members voted 320-115/);
  assert.match(g, /The Guardian/);
  // no seed → no grounding line (typed topics behave exactly as before)
  assert.doesNotMatch(buildPrompt("x", "news", { seed: 1 }), /build the deck on these specific facts/i);
});

test("buildPrompt honours the deck length and an optional tone (Create screen)", () => {
  const brief = buildPrompt("x", "editorial", { seed: 1, slides: 5 });
  assert.match(brief, /EXACTLY 5 slides/);
  assert.match(brief, /3 content slides/);          // 5 - cover - closer
  assert.match(buildPrompt("x", "editorial", { seed: 1, slides: 10 }), /EXACTLY 10 slides/);
  assert.match(buildPrompt("x", "editorial", { seed: 1 }), /EXACTLY 8 slides/); // default
  // tone only appears when chosen, and is otherwise absent
  assert.match(buildPrompt("x", "editorial", { seed: 1, tone: "punchy" }), /Tone: write it punchy/);
  assert.doesNotMatch(buildPrompt("x", "editorial", { seed: 1 }), /Tone: write it/);
});
