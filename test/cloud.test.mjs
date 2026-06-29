// Unit checks for app/studio/cloud.js — the pure cloud foundation: config gate +
// deck (de)serialization + the relative-time label. No firebase here.
import test from "node:test";
import assert from "node:assert/strict";
import { cloudConfig, isCloudEnabled, projectRecord, docFromRecord, relativeTime } from "../app/studio/cloud.js";

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
