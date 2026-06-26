// Unit checks for app/studio/generate.js — the pure pieces of the generation
// upgrade (web search + seeded voice/angle + date anchor): the prompt builder,
// the seed hash, the streamed-event fold, cite-stripping, and the slides parse.
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPrompt, hashStr, stripCites, foldStreamEvent, parseSlides,
} from "../app/studio/generate.js";

test("buildPrompt threads the category voice, web-search rule, date, and JSON shape", () => {
  const p = buildPrompt("the rise of A24 horror", "editorial", { seed: 3, today: "2026-06-26" });
  assert.match(p, /writing a premium Instagram carousel/);
  assert.match(p, /Today's date is 2026-06-26/);          // date anchor
  assert.match(p, /Approach this through/);                // seeded angle
  assert.match(p, /Voice:/);                               // seeded voice
  assert.match(p, /use web search to verify/);             // sourcing instruction
  assert.match(p, /\{"slides":\[/);                        // exact JSON shape
  assert.match(p, /THE ORIGIN/);                           // editorial role label
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
