// Unit checks for app/studio/entity.js — the pure half of #6 entity-photo
// resolution: URL builders, the Commons thumbnail upsizer, and the Wikipedia /
// Wikidata response parsers, exercised with realistic mock payloads.
import test from "node:test";
import assert from "node:assert/strict";
import {
  summaryUrl, wikidataSearchUrl, wikidataClaimsUrl, upsizeWikiThumb,
  commonsFilePathUrl, imageFromSummary, wikidataId, imageFromClaims, slideEntity,
  commonsCategoryFromClaims, commonsCategoryMembersUrl, parseCommonsCategoryMembers,
  sourceKind, looksLikeProperNoun,
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

test("commonsCategoryFromClaims reads P373; commonsCategoryMembersUrl builds a keyless list URL", () => {
  const claims = { claims: { P373: [{ mainsnak: { datavalue: { value: "Serena Williams" } } }] } };
  assert.equal(commonsCategoryFromClaims(claims), "Serena Williams");
  assert.equal(commonsCategoryFromClaims({ claims: {} }), null);
  const u = commonsCategoryMembersUrl("Serena Williams", 24);
  assert.match(u, /generator=categorymembers/);
  assert.match(u, /gcmtitle=Category%3ASerena%20Williams/);
  assert.match(u, /gcmlimit=24/);
  assert.match(u, /iiurlwidth=400/);
  // tolerates a leading "Category:" and defaults the limit
  assert.match(commonsCategoryMembersUrl("Category:Fela Kuti"), /gcmtitle=Category%3AFela%20Kuti/);
});

test("parseCommonsCategoryMembers keeps real photos, drops SVG/PDF, upsizes the picked url", () => {
  const json = { query: { pages: {
    "1": { title: "File:Serena 2019.jpg", imageinfo: [{ thumburl: "https://upload.wikimedia.org/commons/thumb/a/serena/400px-Serena_2019.jpg", extmetadata: { Artist: { value: "<a>Jane</a>" } } }] },
    "2": { title: "File:Logo.svg", imageinfo: [{ thumburl: "https://upload.wikimedia.org/commons/thumb/x/400px-Logo.svg.png" }] }, // svg source but png thumb — kept (real raster)
    "3": { title: "File:Doc.pdf", imageinfo: [{ thumburl: "https://upload.wikimedia.org/commons/Doc.pdf" }] }, // not a raster → dropped
    "4": { title: "File:NoThumb.jpg", imageinfo: [{}] }, // no thumburl → dropped
  } } };
  const out = parseCommonsCategoryMembers(json, 18);
  assert.equal(out.length, 2);
  assert.ok(out.every((x) => x.source === "Commons"));
  assert.equal(out[0].url, "https://upload.wikimedia.org/commons/thumb/a/serena/1280px-Serena_2019.jpg"); // upsized 400→1280
  assert.equal(out[0].thumb, "https://upload.wikimedia.org/commons/thumb/a/serena/400px-Serena_2019.jpg");
  assert.equal(out[0].credit, "Jane"); // HTML stripped
});

test("sourceKind: Wikipedia/Wikidata=wiki, Commons=commons, stock providers=stock", () => {
  assert.equal(sourceKind("Wikipedia"), "wiki");
  assert.equal(sourceKind("Wikidata"), "wiki");
  assert.equal(sourceKind("Commons"), "commons");
  assert.equal(sourceKind("Pexels"), "stock");
  assert.equal(sourceKind("Unsplash"), "stock");
  assert.equal(sourceKind(undefined), "stock");
});

test("looksLikeProperNoun: capitalised names trigger entity search; lowercase scenes don't", () => {
  assert.equal(looksLikeProperNoun("Serena Williams"), true);
  assert.equal(looksLikeProperNoun("New York"), true);
  assert.equal(looksLikeProperNoun("Serena"), true);
  assert.equal(looksLikeProperNoun("sunset"), false);
  assert.equal(looksLikeProperNoun("city skyline at night"), false);
  assert.equal(looksLikeProperNoun(""), false);
  assert.equal(looksLikeProperNoun("this is a very long lowercase phrase that is clearly not a name"), false);
});

test("slideEntity normalizes entity/person + entityType, drops blanks and bad types", () => {
  assert.deepEqual(slideEntity({ entity: "Burna Boy", entityType: "Person" }), { name: "Burna Boy", type: "person" });
  assert.deepEqual(slideEntity({ person: "Fela Kuti" }), { name: "Fela Kuti", type: "" }); // legacy field, no type
  assert.deepEqual(slideEntity({ entity: "Lagos", entityType: "city" }), { name: "Lagos", type: "" }); // unknown type dropped
  assert.equal(slideEntity({ heading: "no entity here" }), null);
  assert.equal(slideEntity({ entity: "   " }), null);
});
