// Unit checks for app/studio/trending.js — the pure half of the live Trending
// panel: beat config + tie-back voice, the most-read URL, RSS + most-read parsing,
// keyword bucketing, and the rank/dedupe.
import test from "node:test";
import assert from "node:assert/strict";
import {
  BEATS, getBeat, beatVoice, beatsForDesk, defaultBeat, mostReadUrl, cleanTitle, parseRss, parseMostRead,
  filterByTerms, rankItems, selectTrending,
} from "../app/studio/trending.js";

test("BEATS includes the thin segments backed by most-read (no rss)", () => {
  const keys = BEATS.map((b) => b.key);
  for (const k of ["film", "news_world", "news_business", "ent_tech", "photo", "nightlife", "trivia", "tea"]) assert.ok(keys.includes(k), "has beat " + k);
  // thin beats have no rss feeds → they resolve via Wikipedia most-read
  assert.deepEqual(getBeat("nightlife").rss, []);
  assert.deepEqual(getBeat("trivia").terms, []); // general curiosities
  assert.equal(getBeat("film").rss.length >= 1, true);
  // The Tea is celebrity gossip, TMZ-style — it now has real gossip feeds.
  assert.ok(getBeat("tea").rss.length >= 1, "The Tea pulls gossip feeds");
  assert.match(getBeat("tea").rss.join(" "), /tmz/i);
});

test("beatVoice maps a beat to its writing voice (tie-back)", () => {
  assert.equal(beatVoice("film"), "editorial");
  assert.equal(beatVoice("ent_tech"), "business");
  assert.equal(beatVoice("news_world"), "news");
  assert.equal(beatVoice("tea"), "story");
  assert.equal(beatVoice("nope"), "editorial"); // unknown → first beat
});

test("beats route per desk: Editorial 9, Enterprise 13, News Desk 10", () => {
  assert.equal(beatsForDesk("editorial").length, 9);
  assert.equal(beatsForDesk("enterprise").length, 13);
  assert.equal(beatsForDesk("newsdesk").length, 10);
  // every beat is tagged with exactly one of the three desks
  for (const b of BEATS) assert.ok(["editorial", "enterprise", "newsdesk"].includes(b.desk), b.key + " has a desk");
  // defaultBeat is the desk's first beat and resolves back to that desk
  assert.equal(defaultBeat("enterprise"), beatsForDesk("enterprise")[0].key);
  assert.equal(getBeat(defaultBeat("newsdesk")).desk, "newsdesk");
});

test("mostReadUrl zero-pads the date into the featured-feed path", () => {
  assert.equal(mostReadUrl(2026, 6, 9), "https://en.wikipedia.org/api/rest_v1/feed/featured/2026/06/09");
});

test("cleanTitle decodes entities and strips a trailing site suffix", () => {
  assert.equal(cleanTitle("Dune: Part Two review &amp; reaction | The Guardian"), "Dune: Part Two review & reaction");
  assert.equal(cleanTitle("<![CDATA[Burna Boy at the O2]]>"), "Burna Boy at the O2");
});

test("parseRss picks the LARGEST media:content and decodes the URL (&amp; -> &)", () => {
  const xml = `<rss><channel>
    <item><title><![CDATA[Glastonbury the Movie review]]></title><pubDate>Mon, 09 Jun 2026 10:00:00 GMT</pubDate>
      <media:content width="140" url="https://i.guim.co.uk/x/master/140.jpg?width=140&amp;quality=85"><media:credit>Photograph: x</media:credit></media:content>
      <media:content width="460" url="https://i.guim.co.uk/x/master/460.jpg?width=460&amp;quality=85"></media:content>
    </item>
    <item><title>No image story</title></item>
  </channel></rss>`;
  const items = parseRss(xml);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Glastonbury the Movie review");
  // largest (460) chosen, and &amp; decoded so the CSS url() actually loads
  assert.equal(items[0].thumb, "https://i.guim.co.uk/x/master/460.jpg?width=460&quality=85");
  assert.equal(items[1].thumb, null);
  assert.equal(parseRss("", 5).length, 0);
});

test("parseRss captures the description as the item extract (R5 grounding)", () => {
  const xml = `<rss><channel>
    <item><title>Landmark Vote</title><description><![CDATA[Lawmakers approved the bill <b>320-115</b>, with sweeping new rules.]]></description></item>
  </channel></rss>`;
  const items = parseRss(xml, 5);
  assert.equal(items[0].title, "Landmark Vote");
  assert.match(items[0].extract, /approved the bill 320-115/); // tags stripped, kept as a seed
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

test("selectTrending keeps section feeds on-topic; general most-read only for trivia", () => {
  const wiki = parseMostRead(FEATURED); // Dune, Christopher Nolan, Federal Reserve (general)
  const rss = [
    { title: "Bitcoin surges to a record", thumb: "t1", extract: "crypto rally as token prices climb" },
    { title: "High street sales slump", thumb: "t2", extract: "retail" },
    { title: "Carmaker cuts jobs", thumb: "t3", extract: "" },
    { title: "Bank raises rates", thumb: "t4", extract: "finance" },
  ];
  const isGeneral = (i) => /Dune|Nolan|Federal Reserve/.test(i.title);
  // focused term surfaces the on-topic feed item first
  assert.ok(/Bitcoin/.test(selectTrending(rss, wiki, ["crypto", "bitcoin"], 6)[0].title), "on-topic lead");
  // a no-match term broadens to the FEED, never general most-read (no World-Cup-under-Music)
  const none = selectTrending(rss, wiki, ["zzznope"], 6);
  assert.ok(none.length >= 3 && none.every((i) => !isGeneral(i)), "broadens to the feed, no general leak");
  // a no-terms section beat is the pure feed (still no general most-read)
  assert.ok(selectTrending(rss, wiki, [], 6).every((i) => !isGeneral(i)));
  // a FEED-LESS beat with no terms (Did You Know?) DOES use general curiosities
  assert.ok(selectTrending([], wiki, [], 6).some(isGeneral), "trivia uses general most-read");
  // a feed-less beat WITH terms stays on-topic (or empty) — never general
  assert.ok(selectTrending([], wiki, ["zzznope"], 6).every((i) => !isGeneral(i)));
});

test("rankItems dedupes by title and floats thumbnail-bearing items first", () => {
  const rss = [{ title: "Dune: Part Two", thumb: null, source: "feed" }];
  const wiki = parseMostRead(FEATURED); // Dune has a thumb here
  const ranked = rankItems(rss, wiki, 6);
  // Dune appears once (deduped), and the thumbnail-bearing items lead
  assert.equal(ranked.filter((r) => /Dune/.test(r.title)).length, 1);
  assert.ok(ranked[0].thumb, "first item carries a photo");
  assert.ok(ranked.length <= 6);
  // R5: the extract carries through so generation can ground on it
  assert.match(ranked.find((r) => /Dune/.test(r.title)).extract, /Villeneuve/);
});
