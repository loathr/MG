// Unit checks for app/studio/entity.js — the pure half of #6 entity-photo
// resolution: URL builders, the Commons thumbnail upsizer, and the Wikipedia /
// Wikidata response parsers, exercised with realistic mock payloads.
import test from "node:test";
import assert from "node:assert/strict";
import {
  summaryUrl, wikidataSearchUrl, wikidataClaimsUrl, upsizeWikiThumb,
  commonsFilePathUrl, imageFromSummary, wikidataId, imageFromClaims, slideEntity,
} from "../app/studio/entity.js";

test("summaryUrl encodes the title", () => {
  assert.equal(summaryUrl("Burna Boy"), "https://en.wikipedia.org/api/rest_v1/page/summary/Burna%20Boy");
  assert.match(summaryUrl("Bong Joon-ho"), /Bong%20Joon-ho$/);
});

test("upsizeWikiThumb rewrites the embedded px width; null for non-thumb URLs", () => {
  const t = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Burna_Boy.jpg/320px-Burna_Boy.jpg";
  assert.equal(upsizeWikiThumb(t, 1280), "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Burna_Boy.jpg/1280px-Burna_Boy.jpg");
  // a direct (non-thumb) original has no /NNNpx- segment
  assert.equal(upsizeWikiThumb("https://upload.wikimedia.org/wikipedia/commons/a/ab/Burna_Boy.jpg", 1280), null);
});

test("commonsFilePathUrl strips File:, spaces -> _, and caps width", () => {
  assert.equal(
    commonsFilePathUrl("File:Fela Kuti.jpg", 1280),
    "https://commons.wikimedia.org/wiki/Special:FilePath/Fela_Kuti.jpg?width=1280",
  );
  assert.equal(commonsFilePathUrl("", 1280), null);
  assert.equal(commonsFilePathUrl(null, 1280), null);
});

test("imageFromSummary prefers an upsized thumbnail", () => {
  const json = {
    type: "standard", title: "Burna Boy",
    thumbnail: { source: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/BB.jpg/250px-BB.jpg", width: 250, height: 320 },
    originalimage: { source: "https://upload.wikimedia.org/wikipedia/commons/a/ab/BB.jpg", width: 2000, height: 2560 },
  };
  assert.equal(imageFromSummary(json), "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/BB.jpg/1280px-BB.jpg");
});

test("imageFromSummary falls back to a FilePath thumb of the original when there's no thumbnail", () => {
  const json = { type: "standard", title: "X", originalimage: { source: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Studio_Ghibli.png" } };
  assert.equal(imageFromSummary(json), "https://commons.wikimedia.org/wiki/Special:FilePath/Studio_Ghibli.png?width=1280");
});

test("imageFromSummary returns null for disambiguation or imageless pages", () => {
  assert.equal(imageFromSummary({ type: "disambiguation", title: "Mercury" }), null);
  assert.equal(imageFromSummary({ type: "standard", title: "Concept" }), null);
  assert.equal(imageFromSummary(null), null);
});

test("wikidataId reads the top hit; imageFromClaims reads P18 -> Commons URL", () => {
  assert.equal(wikidataId({ search: [{ id: "Q123", label: "Bong Joon-ho" }] }), "Q123");
  assert.equal(wikidataId({ search: [] }), null);
  const claims = { claims: { P18: [{ mainsnak: { datavalue: { value: "Bong Joon-ho 2019.jpg" } } }] } };
  assert.equal(imageFromClaims(claims), "https://commons.wikimedia.org/wiki/Special:FilePath/Bong_Joon-ho_2019.jpg?width=1280");
  assert.equal(imageFromClaims({ claims: {} }), null);
  assert.match(wikidataClaimsUrl("Q123"), /entity=Q123&property=P18/);
  assert.match(wikidataSearchUrl("Fela Kuti"), /search=Fela%20Kuti/);
});

test("slideEntity normalizes entity/person + entityType, drops blanks and bad types", () => {
  assert.deepEqual(slideEntity({ entity: "Burna Boy", entityType: "Person" }), { name: "Burna Boy", type: "person" });
  assert.deepEqual(slideEntity({ person: "Fela Kuti" }), { name: "Fela Kuti", type: "" }); // legacy field, no type
  assert.deepEqual(slideEntity({ entity: "Lagos", entityType: "city" }), { name: "Lagos", type: "" }); // unknown type dropped
  assert.equal(slideEntity({ heading: "no entity here" }), null);
  assert.equal(slideEntity({ entity: "   " }), null);
});
