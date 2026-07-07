// Unit checks for app/studio/cloud.js — the pure cloud foundation: config gate +
// deck (de)serialization + the relative-time label. No firebase here.
import test from "node:test";
import assert from "node:assert/strict";
import { cloudConfig, isCloudEnabled, projectRecord, docFromRecord, relativeTime, collectImageData, imageKey, rewriteImages, bucketByTime, groupDecks, groupCollapsedByDefault } from "../app/studio/cloud.js";

const FIREBASE_ENV = [
  "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_APP_ID",
];
function clearEnv() { for (const k of FIREBASE_ENV) delete process.env[k]; }

test("cloud is DISABLED (no-op) when the Firebase config is absent or partial", () => {
  clearEnv();
  assert.equal(isCloudEnabled(), false);
  assert.equal(cloudConfig(), null);
  // partial config (missing appId) is still disabled — never half-on
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "k";
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "x.firebaseapp.com";
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "x";
  assert.equal(isCloudEnabled(), false);
  clearEnv();
});

test("cloud is ENABLED once the load-bearing config fields are present", () => {
  clearEnv();
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "k";
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "x.firebaseapp.com";
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "proj";
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "app";
  assert.equal(isCloudEnabled(), true);
  assert.equal(cloudConfig().projectId, "proj");
  clearEnv();
});

test("projectRecord carries metadata + the full doc; round-trips back out", () => {
  const doc = { slides: [{}, {}, {}], brand: { accent: "#fff" } };
  const rec = projectRecord(doc, { id: "d1", name: "  Private credit boom ", now: 1000, createdAt: 500 });
  assert.equal(rec.id, "d1");
  assert.equal(rec.name, "Private credit boom");   // trimmed
  assert.equal(rec.slideCount, 3);                 // derived from slides
  assert.equal(rec.updatedAt, 1000);
  assert.equal(rec.createdAt, 500);
  assert.equal(docFromRecord(rec), doc);           // exact doc back
  // empty name falls back; updatedAt falls back to createdAt
  const r2 = projectRecord({ slides: [] }, { createdAt: 7 });
  assert.equal(r2.name, "Untitled carousel");
  assert.equal(r2.slideCount, 0);
  assert.equal(r2.updatedAt, 7);
  assert.equal(docFromRecord({}), null);
});

test("relativeTime buckets seconds → months", () => {
  const now = 1_000_000_000_000;
  assert.equal(relativeTime(now, now), "just now");
  assert.equal(relativeTime(now - 30 * 1000, now), "just now");
  assert.equal(relativeTime(now - 5 * 60_000, now), "5m ago");
  assert.equal(relativeTime(now - 2 * 3_600_000, now), "2h ago");
  assert.equal(relativeTime(now - 24 * 3_600_000, now), "1 day ago");
  assert.equal(relativeTime(now - 3 * 24 * 3_600_000, now), "3 days ago");
  assert.equal(relativeTime(now - 14 * 24 * 3_600_000, now), "2 weeks ago");
  assert.equal(relativeTime(now - 60 * 24 * 3_600_000, now), "2 months ago");
});

// ---- Cloud 11c: image offload helpers --------------------------------------
const DATA_A = "data:image/jpeg;base64,QQ==";
const DATA_B = "data:image/png;base64,UE5H";
const sampleDoc = () => ({
  brand: { logo: { src: DATA_B } },
  slides: [
    { background: { type: "image", src: DATA_A, thumb: DATA_A }, elements: [
      { id: "e1", type: "image", src: DATA_A, thumb: "data:image/jpeg;base64,thumb", origSrc: DATA_B },
      { id: "e2", type: "text", content: "hi" },
      { id: "e3", type: "image", src: "https://cdn/x.jpg" }, // already a URL — ignored
    ] },
  ],
});

test("collectImageData gathers every distinct embedded data: image (bg, el src/thumb/origSrc, logo)", () => {
  const got = collectImageData(sampleDoc()).sort();
  assert.deepEqual(got.sort(), [DATA_A, DATA_B, "data:image/jpeg;base64,thumb"].sort());
  assert.ok(!got.includes("https://cdn/x.jpg"), "existing URLs are not collected");
});

test("imageKey is stable, content-addressed, and picks the right extension", () => {
  assert.equal(imageKey(DATA_A), imageKey(DATA_A));           // deterministic
  assert.notEqual(imageKey(DATA_A), imageKey(DATA_B));        // different content → different key
  assert.match(imageKey(DATA_B), /^img_[0-9a-f]+\.png$/);     // png data → .png
  assert.match(imageKey(DATA_A), /^img_[0-9a-f]+\.jpg$/);     // jpeg data → .jpg
});

test("rewriteImages swaps data URLs for uploaded URLs and leaves the rest intact", () => {
  const map = { [DATA_A]: "https://store/a.jpg", [DATA_B]: "https://store/b.png" };
  const out = rewriteImages(sampleDoc(), map);
  assert.equal(out.slides[0].background.src, "https://store/a.jpg");
  assert.equal(out.slides[0].background.thumb, "https://store/a.jpg");
  assert.equal(out.slides[0].elements[0].src, "https://store/a.jpg");
  assert.equal(out.slides[0].elements[0].origSrc, "https://store/b.png");
  assert.equal(out.slides[0].elements[0].thumb, "data:image/jpeg;base64,thumb"); // no map entry → left inline
  assert.equal(out.slides[0].elements[2].src, "https://cdn/x.jpg");              // untouched
  assert.equal(out.brand.logo.src, "https://store/b.png");
  assert.equal(out.slides[0].elements[1].content, "hi");                         // non-image fields preserved
  // the persisted doc now carries NO base64 once everything is mapped
  assert.equal(collectImageData(out).length, 1); // only the unmapped thumb remains
});

// A fixed "now": 2026-07-20 12:00 local (mid-month, so "earlier this month" is
// reachable). Deck timestamps are offsets from it so the buckets are deterministic
// regardless of when the test runs.
const NOW = new Date(2026, 6, 20, 12, 0, 0).getTime(); // Jul 20 2026 (month is 0-based)
const daysAgo = (d) => NOW - d * 864e5;

test("bucketByTime: recency buckets", () => {
  assert.equal(bucketByTime(NOW - 2 * 36e5, NOW).key, "today");            // 2h ago
  assert.equal(bucketByTime(daysAgo(2), NOW).key, "week");                 // 2 days
  assert.equal(bucketByTime(daysAgo(2), NOW).label, "Earlier this week");
  // 10 days ago is still July (same month) but older than a week
  const m = bucketByTime(daysAgo(10), NOW);
  assert.equal(m.key, "month");
  assert.equal(m.label, "Earlier in July");
  // June → its own calendar-month bucket
  const jun = bucketByTime(new Date(2026, 5, 20).getTime(), NOW);
  assert.equal(jun.label, "June 2026");
  assert.ok(jun.order > m.order, "older month sorts after earlier-this-month");
});

test("bucketByTime: month mode files everything under its calendar month", () => {
  assert.equal(bucketByTime(daysAgo(2), NOW, "month").label, "July 2026");
  assert.equal(bucketByTime(new Date(2026, 5, 1).getTime(), NOW, "month").label, "June 2026");
  assert.equal(bucketByTime(new Date(2026, 4, 1).getTime(), NOW, "month").label, "May 2026");
  // current month sorts first (order 0), older after
  assert.ok(bucketByTime(new Date(2026, 4, 1).getTime(), NOW, "month").order
    > bucketByTime(daysAgo(2), NOW, "month").order);
});

test("groupDecks: ordered buckets, items newest-first, empties dropped", () => {
  const decks = [
    { id: "a", name: "A", updatedAt: NOW - 3 * 36e5 },          // today
    { id: "b", name: "B", updatedAt: NOW - 1 * 36e5 },          // today (newer)
    { id: "c", name: "C", updatedAt: daysAgo(3) },              // this week
    { id: "d", name: "D", updatedAt: new Date(2026, 5, 10).getTime() }, // June
  ];
  const groups = groupDecks(decks, NOW);
  assert.deepEqual(groups.map((g) => g.key), ["today", "week", "m24317"]); // today · this week · June
  assert.equal(groups[0].key, "today");
  // today's items newest-first: b before a
  assert.deepEqual(groups[0].items.map((x) => x.id), ["b", "a"]);
  assert.equal(groups[1].key, "week");
  assert.equal(groups[groups.length - 1].label, "June 2026");
  // no empty groups
  assert.ok(groups.every((g) => g.items.length > 0));
});

test("groupCollapsedByDefault: older months collapsed, recent open", () => {
  const groups = groupDecks([
    { id: "a", updatedAt: NOW - 36e5 },
    { id: "d", updatedAt: new Date(2026, 5, 10).getTime() },
  ], NOW);
  const today = groups.find((g) => g.key === "today");
  const june = groups.find((g) => g.label === "June 2026");
  assert.equal(groupCollapsedByDefault(today), false);
  assert.equal(groupCollapsedByDefault(june), true);
});

test("collectImageData + rewriteImages cover slide.content.image (the re-flow source)", () => {
  const DATA_C = "data:image/jpeg;base64,Q0M=";
  const doc = {
    brand: {},
    slides: [{
      background: { type: "color", color: "#000" },
      elements: [],
      // a feature/generated slide keeps its photo on content.image as a data URL
      content: { heading: "H", image: { url: DATA_C, thumb: DATA_C, credit: "c", source: "s" } },
    }],
  };
  // it's collected for offload
  assert.ok(collectImageData(doc).includes(DATA_C), "content.image is collected");
  // and rewritten to the uploaded URL (kept in lockstep with bg/elements)
  const out = rewriteImages(doc, { [DATA_C]: "https://store/c.jpg" });
  assert.equal(out.slides[0].content.image.url, "https://store/c.jpg");
  assert.equal(out.slides[0].content.image.thumb, "https://store/c.jpg");
  assert.equal(out.slides[0].content.image.credit, "c", "non-image fields preserved");
  // no data: URL left behind → the doc no longer bloats past Firestore's cap
  assert.equal(collectImageData(out).length, 0);
});
