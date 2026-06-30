// Unit checks for app/studio/trending.js — the pure half of the live Trending
// panel: beat config + tie-back voice, the most-read URL, RSS + most-read parsing,
// keyword bucketing, and the rank/dedupe.
import test from "node:test";
import assert from "node:assert/strict";
import {
  BEATS, getBeat, beatVoice, beatsForDesk, defaultBeat, groupsForDesk, routeFraming, mostReadUrl, cleanTitle, parseRss, parseMostRead,
  filterByTerms, rankItems, selectTrending, backfillSeeds, filterByRegion, filterByCountry, countriesForRegion, filterByRecency,
} from "../app/studio/trending.js";

test("BEATS feed config: dedicated vs shared/sub-topic vs the lone feed-less beat", () => {
  const keys = BEATS.map((b) => b.key);
  for (const k of ["film", "news_politics", "news_business", "ent_finance", "photo", "nightlife", "trivia", "tea"]) assert.ok(keys.includes(k), "has beat " + k);
  // trivia is the ONLY truly feed-less beat (general curiosities via most-read).
  assert.deepEqual(getBeat("trivia").rss, []);
  assert.deepEqual(getBeat("trivia").terms, []);
  // photo & nightlife now ride a filtered parent feed (art / music) so they're
  // never an empty rail like a feed-less narrow-term beat was.
  assert.ok(getBeat("nightlife").rss.length >= 1 && getBeat("nightlife").filterFeed, "nightlife rides a filtered feed");
  assert.ok(getBeat("photo").rss.length >= 1 && getBeat("photo").filterFeed, "photo rides a filtered feed");
  // dedicated section feeds use the WHOLE feed; Enterprise sectors term-filter
  // their shared feed.
  assert.equal(getBeat("film").rss.length >= 1, true);
  assert.ok(!getBeat("film").filterFeed, "a dedicated section feed isn't term-filtered");
  assert.ok(getBeat("ent_finance").filterFeed && getBeat("ent_energy").filterFeed, "enterprise sectors filter their shared feed");
  // The Tea is celebrity gossip, TMZ-style — real gossip feeds, used whole.
  assert.ok(getBeat("tea").rss.length >= 1, "The Tea pulls gossip feeds");
  assert.match(getBeat("tea").rss.join(" "), /tmz/i);
  assert.ok(!getBeat("tea").filterFeed, "gossip feed is dedicated (not term-filtered)");
});

test("beatVoice maps a beat to its writing voice (tie-back)", () => {
  assert.equal(beatVoice("film"), "editorial");
  assert.equal(beatVoice("ent_finance"), "business");
  assert.equal(beatVoice("news_politics"), "news");
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

test("parseRss strips entity-encoded HTML tags from the extract (Guardian &lt;p&gt;)", () => {
  // Guardian descriptions encode their HTML, so the tags only appear after the
  // entity decode — the extract must still come out as clean prose, no "<p>".
  const xml = `<rss><channel>
    <item><title>Album of the Week</title><description>&lt;p&gt;The Devon band are preposterous yet nuanced.&lt;/p&gt;&lt;p&gt;A choir appears within three minutes.&lt;/p&gt;</description></item>
  </channel></rss>`;
  const ex = parseRss(xml, 5)[0].extract;
  assert.doesNotMatch(ex, /<\/?p>/, "no surviving <p> tags in the grounding seed");
  assert.match(ex, /Devon band are preposterous/);
});

test("parseRss strips Hacker News boilerplate from the extract", () => {
  // hnrss descriptions are scaffolding, not a summary — must not become a seed.
  const xml = `<rss><channel>
    <item><title>Some AI post</title><description>Article URL: https://x.example/a Comments URL: https://news.ycombinator.com/item?id=1 Points: 1 # Comments: 0</description></item>
  </channel></rss>`;
  const ex = parseRss(xml, 5)[0].extract;
  assert.doesNotMatch(ex, /Article URL|Comments URL|Points:|# Comments/, "HN boilerplate stripped");
});

test("pickThumb falls back to the first <img> in content (gossip feeds)", () => {
  const block = `<item><title>Star spotted</title><content:encoded><![CDATA[<p>x</p><img src="https://pagesix.com/x/photo.jpg" />]]></content:encoded></item>`;
  const items = parseRss(`<rss><channel>${block}</channel></rss>`, 5);
  assert.equal(items[0].thumb, "https://pagesix.com/x/photo.jpg");
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

test("filterByTerms matches whole words, not prefixes — no tour→tournament (World Cup) leak", () => {
  const items = [
    { title: "2026 FIFA World Cup knockout stage", extract: "a single-elimination tournament of 32 matches" },
    { title: "Best albums of 2026", extract: "" },                 // plural of a term
    { title: "Taylor Swift announces a world tour", extract: "" }, // the literal term
  ];
  const music = filterByTerms(items, getBeat("music").terms); // terms include "tour" and "album"
  assert.ok(music.some((i) => /albums of 2026/.test(i.title)), "plural 'albums' still matches 'album'");
  assert.ok(music.some((i) => /world tour/.test(i.title)), "the literal word 'tour' still matches");
  assert.ok(!music.some((i) => /World Cup/.test(i.title)), "'tour' must NOT prefix-match 'tournament'");
  // a short term like "AI" must not prefix-match "air"/"aid" (whole-word guard)
  const aiTerms = ["AI", "artificial intelligence", "OpenAI"];
  assert.equal(filterByTerms([{ title: "Air quality alert hits the city", extract: "" }], aiTerms).length, 0, "'AI' must not match 'air'");
  assert.equal(filterByTerms([{ title: "OpenAI ships a new model", extract: "" }], aiTerms).length, 1, "real AI terms still match");
});

test("Tier 2b region filter: keeps in-region items, broadens rather than gutting the rail", () => {
  const items = [
    { title: "France passes new law", extract: "" },
    { title: "Germany and Spain agree deal", extract: "" },
    { title: "Italy budget vote", extract: "" },
    { title: "Brazil election result", extract: "" },
  ];
  const eu = filterByRegion(items, "europe");
  assert.equal(eu.length, 3);                                   // FR, DE/ES, IT
  assert.ok(!eu.some((i) => /Brazil/.test(i.title)), "off-region item dropped");
  assert.equal(filterByRegion(items, "global").length, items.length); // global → all
  // only a ZERO-match region broadens to the original (never an empty rail)
  assert.equal(filterByRegion(items, "oceania").length, items.length);
});

test("Tier 2b recency filter: drops stale feed items, keeps recent + date-less", () => {
  const now = Date.parse("2026-06-29T12:00:00Z");
  const items = [
    { title: "today", when: "2026-06-29T08:00:00Z" },
    { title: "yesterday", when: "2026-06-28T08:00:00Z" },
    { title: "last month", when: "2026-05-20T08:00:00Z" },
    { title: "no date (most-read)", when: "" },
    { title: "also recent", when: "2026-06-28T20:00:00Z" },
  ];
  const breaking = filterByRecency(items, 2, now); // within 2 days
  assert.ok(breaking.some((i) => i.title === "today") && breaking.some((i) => i.title === "no date (most-read)"));
  assert.ok(!breaking.some((i) => i.title === "last month"), "stale feed item dropped");
  assert.equal(filterByRecency(items, 0, now).length, items.length); // no window → all
});

test("taxonomy: every beat carries a group; Enterprise sectors carry seeds; helpers resolve", () => {
  for (const b of BEATS) assert.ok(b.group, b.key + " has a dropdown group");
  for (const b of beatsForDesk("enterprise")) assert.ok(b.seeds && b.seeds.length >= 3, b.key + " carries seed hints");
  // groupsForDesk clusters in first-seen order and preserves every beat exactly once
  const groups = groupsForDesk("enterprise");
  assert.ok(groups.length >= 2 && groups.length < beatsForDesk("enterprise").length);
  assert.equal(groups.reduce((n, g) => n + g.beats.length, 0), beatsForDesk("enterprise").length);
  // routeFraming gives generate.js a desk-adaptive kind + label + term anchors
  assert.deepEqual(
    { kind: routeFraming("ent_finance").kind, label: routeFraming("ent_finance").label },
    { kind: "Sector", label: "Finance & Banking" },
  );
  assert.equal(routeFraming("news_politics").kind, "Section");
  assert.equal(routeFraming("film").kind, "Beat");
  assert.ok(routeFraming("ent_finance").terms.includes("bank"));
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

  // hasFeeds: a SECTION beat whose feed FAILED on the server (empty rss) must
  // NEVER leak unfiltered general most-read — the real "FIFA under Music" cause.
  // A no-terms section beat with a dead feed returns empty (honest), not the
  // viral most-read list.
  assert.deepEqual(selectTrending([], wiki, [], 6, true), [], "feed-down no-terms section beat → empty, never general");
  // a feed-down section beat WITH terms stays on-topic via term-matched most-read only
  assert.ok(selectTrending([], wiki, ["crypto", "bitcoin"], 6, true).every((i) => !isGeneral(i)), "feed-down beat stays on-topic, no general leak");
  // contrast: a genuinely feed-less curiosity beat (hasFeeds=false) still uses general most-read
  assert.ok(selectTrending([], wiki, [], 6, false).some(isGeneral), "true feed-less trivia still uses general most-read");
});

test("selectTrending: a RICH feed stands alone — term-matched general most-read is NOT mixed in", () => {
  const wiki = parseMostRead(FEATURED); // includes "Dune: Part Two" (a 2024 film)
  // a dedicated feed with plenty of items (>= ENOUGH); "film" would match Dune in
  // most-read, but the feed is rich, so Dune must NOT appear (the Tea/film-leak fix).
  const feed = Array.from({ length: 8 }, (_, i) => ({ title: "Music story " + i, thumb: "t" + i, extract: "" }));
  const out = selectTrending(feed, wiki, ["film"], 6, true, false);
  assert.equal(out.length, 6);
  assert.ok(out.every((i) => /Music story/.test(i.title)), "only feed items; no general most-read leak");
});

test("selectTrending: a THIN feed borrows term-matched most-read, then broadens", () => {
  const wiki = parseMostRead(FEATURED);
  const feed = [{ title: "Lone music story", thumb: "t", extract: "" }];
  const out = selectTrending(feed, wiki, ["film"], 6, true, false);
  assert.ok(out.some((i) => /Lone music story/.test(i.title)), "keeps the feed item");
  assert.ok(out.some((i) => /Dune/.test(i.title)), "supplements with term-matched most-read when thin");
});

test("filterByCountry: narrows to a single country, broadens if it would gut the rail", () => {
  const items = [
    { title: "France raises rates", extract: "Paris" },
    { title: "Germany factory data", extract: "Berlin" },
    { title: "France election latest", extract: "" },
    { title: "Spain tourism boom", extract: "" },
  ];
  const fr = filterByCountry(items, "France");
  assert.equal(fr.length, 2);
  assert.ok(fr.every((i) => /France/.test(i.title)));
  // no country → untouched
  assert.equal(filterByCountry(items, null).length, 4);
  // ANY match scopes the rail (even one), so the country actually takes effect
  assert.equal(filterByCountry(items, "Spain").length, 1);
  // only a ZERO-match country broadens back to the full list (never empty)
  assert.equal(filterByCountry(items, "Japan").length, 4);
});

test("countriesForRegion: returns the region's country list (empty for global)", () => {
  assert.ok(countriesForRegion("europe").includes("France"));
  assert.deepEqual(countriesForRegion("global"), []);
  assert.deepEqual(countriesForRegion("nope"), []);
});

test("backfillSeeds: fills a thin pull up to max, deduped, only when seeds exist", () => {
  const seeds = ["Telehealth adoption", "GLP-1 drug market", "Hospital staffing crisis"];
  // empty live pull → seed cards (no photo, source 'seed')
  const filled = backfillSeeds([], seeds, 6);
  assert.equal(filled.length, 3);
  assert.equal(filled[0].title, "Telehealth adoption");
  assert.equal(filled[0].source, "seed");
  assert.equal(filled[0].thumb, null);
  // already-full pull is untouched
  const live = Array.from({ length: 6 }, (_, i) => ({ title: "L" + i }));
  assert.equal(backfillSeeds(live, seeds, 6).length, 6);
  // dedupe by title (case-insensitive) against the live pull
  const dd = backfillSeeds([{ title: "telehealth adoption" }], seeds, 6);
  assert.equal(dd.filter((i) => /telehealth/i.test(i.title)).length, 1);
  // no seeds → unchanged
  assert.deepEqual(backfillSeeds([{ title: "x" }], [], 6), [{ title: "x" }]);
});

test("selectTrending: an Enterprise sector backfills from seeds when the live pull is thin", () => {
  const seeds = ["Open banking disruption", "Private credit boom"];
  // feed down + no matching most-read → live pull empty, seeds fill it (so the
  // sector rail is never near-empty and generation has concrete topics).
  const out = selectTrending([], [], ["bank", "finance"], 6, true, true, seeds);
  assert.ok(out.length >= 2, "seed backfill keeps the rail populated");
  assert.ok(out.some((i) => /Open banking disruption/.test(i.title)));
  assert.ok(out.every((i) => i.source === "seed"));
});

test("selectTrending: a SHARED feed (filterFeed) is term-filtered down to the beat", () => {
  const feed = [
    { title: "Markets rally as the index climbs", thumb: "t", extract: "stocks" },
    { title: "A celebrity wedding bonanza", thumb: "t", extract: "gossip" },
  ];
  const out = selectTrending(feed, [], ["market", "stocks", "index"], 6, true, true);
  assert.ok(out.some((i) => /Markets rally/.test(i.title)), "keeps the on-sector item");
  assert.ok(!out.some((i) => /celebrity wedding/.test(i.title)), "off-sector feed item filtered out");
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
