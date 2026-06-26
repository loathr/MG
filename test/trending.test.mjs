// Unit checks for app/studio/trending.js — the pure half of the live Trending
// panel: beat config + tie-back voice, the most-read URL, RSS + most-read parsing,
// keyword bucketing, and the rank/dedupe.
import test from "node:test";
import assert from "node:assert/strict";
import {
  BEATS, getBeat, beatVoice, mostReadUrl, cleanTitle, parseRss, parseMostRead,
  filterByTerms, rankItems,
} from "../app/studio/trending.js";

test("BEATS includes the thin segments backed by most-read (no rss)", () => {
  const keys = BEATS.map((b) => b.key);
  for (const k of ["film", "business", "news", "photo", "nightlife", "trivia", "tea"]) assert.ok(keys.includes(k), "has beat " + k);
  // thin beats have no rss feeds → they resolve via Wikipedia most-read
  assert.deepEqual(getBeat("nightlife").rss, []);
  assert.deepEqual(getBeat("trivia").terms, []); // general curiosities
  assert.equal(getBeat("film").rss.length >= 1, true);
});

test("beatVoice maps a beat to its writing voice (tie-back)", () => {
  assert.equal(beatVoice("film"), "editorial");
  assert.equal(beatVoice("tech"), "business");
  assert.equal(beatVoice("news"), "news");
  assert.equal(beatVoice("tea"), "story");
  assert.equal(beatVoice("nope"), "editorial"); // unknown → first beat
});

test("mostReadUrl zero-pads the date into the featured-feed path", () => {
  assert.equal(mostReadUrl(2026, 6, 9), "https://en.wikipedia.org/api/rest_v1/feed/featured/2026/06/09");
});

test("cleanTitle decodes entities and strips a trailing site suffix", () => {
  assert.equal(cleanTitle("Dune: Part Two review &amp; reaction | The Guardian"), "Dune: Part Two review & reaction");
  assert.equal(cleanTitle("<![CDATA[Burna Boy at the O2]]>"), "Burna Boy at the O2");
});

test("parseRss pulls title + thumbnail from item/media:content blocks", () => {
  const xml = `<rss><channel>
    <item><title><![CDATA[A24's next era]]></title><pubDate>Mon, 09 Jun 2026 10:00:00 GMT</pubDate>
      <media:content url="https://img.example/a24.jpg" type="image/jpeg"/></item>
    <item><title>No image story</title></item>
  </channel></rss>`;
  const items = parseRss(xml);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "A24's next era");
  assert.equal(items[0].thumb, "https://img.example/a24.jpg");
  assert.equal(items[1].thumb, null);
  assert.equal(parseRss("", 5).length, 0);
});

const FEATURED = {
  mostread: { articles: [
    { titles: { normalized: "Main Page" }, views: 9000000 },
    { titles: { normalized: "Dune: Part Two" }, views: 210000, extract: "2024 film directed by Denis Villeneuve", thumbnail: { source: "https://upload.wikimedia.org/wikipedia/en/thumb/x/Dune.jpg/240px-Dune.jpg" } },
    { titles: { normalized: "Christopher Nolan" }, views: 120000, extract: "British-American film director" },
    { titles: { normalized: "Federal Reserve" }, views: 90000, extract: "central banking system of the United States", thumbnail: { source: "https://upload.wikimedia.org/wikipedia/commons/thumb/y/Fed.jpg/200px-Fed.jpg" } },
  ] },
};

test("parseMostRead drops Main Page, keeps titled articles, upsizes thumbs", () => {
  const items = parseMostRead(FEATURED);
  assert.equal(items.length, 3); // Main Page dropped
  assert.equal(items[0].title, "Dune: Part Two");
  assert.match(items[0].thumb, /480px-Dune\.jpg$/); // thumbnail upsized
  assert.equal(items[1].thumb, null);               // no thumbnail on Nolan
});

test("filterByTerms buckets most-read into a beat; empty terms keep all", () => {
  const items = parseMostRead(FEATURED);
  const film = filterByTerms(items, getBeat("film").terms);
  assert.ok(film.some((i) => i.title === "Dune: Part Two"));
  assert.ok(!film.some((i) => i.title === "Federal Reserve")); // not film
  assert.equal(filterByTerms(items, []).length, items.length); // trivia beat keeps all
});

test("rankItems dedupes by title and floats thumbnail-bearing items first", () => {
  const rss = [{ title: "Dune: Part Two", thumb: null, source: "feed" }];
  const wiki = parseMostRead(FEATURED); // Dune has a thumb here
  const ranked = rankItems(rss, wiki, 6);
  // Dune appears once (deduped), and the thumbnail-bearing items lead
  assert.equal(ranked.filter((r) => /Dune/.test(r.title)).length, 1);
  assert.ok(ranked[0].thumb, "first item carries a photo");
  assert.ok(ranked.length <= 6);
});
