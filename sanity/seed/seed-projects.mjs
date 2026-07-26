#!/usr/bin/env node
/**
 * Seed Sanity `project` documents from the curated R2 media library
 * (media-featured.json). One document per distinct project group, with a real
 * R2 cover URL. Idempotent: deterministic _id + createIfNotExists, so re-running
 * never duplicates and never clobbers edits you've made in the Studio.
 *
 *   Dry run (no network, prints what it would write):
 *     node sanity/seed/seed-projects.mjs --dry
 *
 *   Live (creates docs in Sanity):
 *     SANITY_PROJECT_ID=xxxx SANITY_WRITE_TOKEN=sk... \
 *       node sanity/seed/seed-projects.mjs
 *
 * Env:
 *   SANITY_PROJECT_ID   (or NEXT_PUBLIC_SANITY_PROJECT_ID)  — required (live)
 *   SANITY_WRITE_TOKEN                                       — required (live)
 *   SANITY_DATASET      (default "production")
 *   SANITY_API_VERSION  (default "2025-01-01")
 *
 * Flags:
 *   --dry       Print the documents and exit; no client, no network.
 *   --replace   Use createOrReplace instead of createIfNotExists (OVERWRITES
 *               existing docs of the same id — including any Studio edits).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");
const HTML = process.argv.includes("--html");
const REPLACE = process.argv.includes("--replace");

const data = JSON.parse(readFileSync(join(__dirname, "media-featured.json"), "utf8"));
const BASE = data.base.replace(/\/$/, "");

// --- taxonomy -------------------------------------------------------------
// Source categories → the Work filter buckets. iPhotos is photography.
const CATEGORY = {
  portraits: "portraits",
  iphotos: "photography",
  publishing: "publishing",
  music: "music",
  fashion: "fashion",
  postcards: "postcards",
  events: "events",
  weddings: "weddings",
  graphics: "graphics",
  film: "film",
};

// Default "kind" label per bucket (overridden by KNOWN copy where it exists).
const KIND = {
  fashion: "Editorial", portraits: "Portraiture", photography: "Photography",
  events: "Coverage", weddings: "Weddings", film: "Film", music: "Music",
  postcards: "Series", publishing: "Publishing", graphics: "Motion",
};

// Tidy the raw project names coming from Drive folder labels.
function cleanName(raw) {
  const map = {
    "Agidi magazine": "Agidi Magazine",
    "GAS ( Stills)": "GAS",
    "We Both Know to Much - Stills": "We Both Know Too Much",
    "L.O.A Finals I": "L.O.A",
    "iPhotos I": "iPhotos I",
    "iPhotos II": "iPhotos II",
    taye: "Taye",
  };
  if (map[raw]) return map[raw];
  // Otherwise title-case words, preserving all-caps tokens (PNG, P.E.P, BOOK 1).
  return raw
    .split(" ")
    .map((w) => (w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .trim();
}

// Hand-written copy for the projects that already have it in the site design.
// Keyed by cleaned name; applied when a seeded project matches.
const KNOWN = {
  GAS: { kind: "Film", headline: "A film with a point of view", summary: "Short film + stills, shot and cut in-house." },
  "Agidi Magazine": { kind: "Editorial", headline: "Editorial fashion, art-directed", summary: "A magazine story, shot end to end." },
  "LA SYNCDOCHE": { kind: "Campaign", headline: "A fashion world, built", summary: "Campaign & lookbook imagery." },
  "Black Renaissance": { kind: "Editorial", headline: "Heritage, restated", summary: "A fashion editorial series." },
  Portraits: { kind: "Portraiture", headline: "Faces, framed with intent", summary: "Studio & location portraits." },
  Events: { kind: "Coverage", headline: "The room, remembered", summary: "Full event documentation." },
  Engagements: { kind: "Weddings", headline: "Before the day", summary: "Engagement & wedding coverage." },
  "We Both Know Too Much": { kind: "Film", headline: "A story worth the runtime", summary: "Narrative short + stills." },
  "L.O.A": { kind: "Music", headline: "The album, made visual", summary: "Cover & campaign imagery." },
  Wavy: { kind: "Music Video", headline: "The record, on screen", summary: "Music video + performance stills." },
  "Post Cards": { kind: "Series", headline: "Small format, big intent", summary: "A postcard photo series." },
  "BOOK 1": { kind: "Publishing", headline: "A legacy artefact", summary: "Photo book — layout & sequencing." },
};

// The four projects that fill the Home "Selected work" strip.
const FEATURED = new Set(["GAS", "Agidi Magazine", "Portraits", "L.O.A"]);
// Projects that get the ▶ play affordance.
const PLAY = new Set(["GAS", "We Both Know Too Much", "Wavy"]);

// Pick a cover URL for a group: prefer a webp variant near 1280w, else largest.
function coverFor(asset) {
  const v = (asset.variants && (asset.variants.webp || asset.variants.avif)) || [];
  if (!v.length) return null;
  const sorted = [...v].sort((a, b) => a.w - b.w);
  const pick = sorted.find((x) => x.w >= 1200) || sorted[sorted.length - 1];
  return `${BASE}/${pick.src}`;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// --- group assets by (category, project) ---------------------------------
const groups = new Map();
for (const a of data.assets) {
  const key = `${a.category}::${a.project}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(a);
}

// Stable category order for the `order` field / page layout.
const CAT_ORDER = ["fashion", "portraits", "photography", "events", "weddings", "film", "music", "postcards", "publishing", "graphics"];
const entries = [...groups.entries()].sort((a, b) => {
  const ca = CATEGORY[a[1][0].category], cb = CATEGORY[b[1][0].category];
  return CAT_ORDER.indexOf(ca) - CAT_ORDER.indexOf(cb);
});

const docs = [];
let order = 0;
for (const [, assets] of entries) {
  const src = assets[0];
  const category = CATEGORY[src.category] || "graphics";
  const name = cleanName(src.project);
  const known = KNOWN[name] || {};
  const id = `project.${category}-${slugify(src.project)}`;
  docs.push({
    _id: id,
    _type: "project",
    title: name,
    slug: { _type: "slug", current: `${category}-${slugify(src.project)}` },
    kind: known.kind || KIND[category] || "",
    headline: known.headline || name,
    category,
    summary: known.summary || "",
    coverUrl: coverFor(src),
    hasVideo: PLAY.has(name) || category === "film",
    featured: FEATURED.has(name),
    order: order++,
  });
}

// --- output / write -------------------------------------------------------
if (HTML) {
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const cats = ["fashion", "portraits", "photography", "events", "weddings", "film", "music", "postcards", "publishing", "graphics"]
    .filter((c) => docs.some((d) => d.category === c));
  const card = (d) => `
    <a class="wcard" data-cat="${d.category}">
      <div class="media ${d.hasVideo ? "play" : ""}">
        <img class="cover" loading="lazy" src="${d.coverUrl}" alt="${d.title}" />
        ${d.hasVideo ? '<span class="pi">▶</span>' : ""}
        ${d.featured ? '<span class="star">★ Home</span>' : ""}
      </div>
      <div class="body"><div class="meta"><span>${d.title}</span><span>${d.kind}</span></div>
        <h3>${d.headline}</h3><p>${d.summary || ""}</p><span class="go">View project →</span></div>
    </a>`;
  const out = `<title>Our Work — seeded preview</title>
<style>
  :root{--bg:#0a0a0a;--panel:#101010;--line:#1e1e1e;--line2:#2c2c2c;--ink:#f2f2f2;--mut:#9a9a9a;--mut2:#6a6a6a;--red:#e5342a;--disp:"Space Grotesk",system-ui,sans-serif;--ease:cubic-bezier(.4,0,.2,1)}
  *{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--ink);font-family:Inter,system-ui,sans-serif;padding:44px 32px 90px}
  h1{font-family:var(--disp);font-size:28px;letter-spacing:-.02em}.sub{color:var(--mut);font-size:14px;margin:6px 0 28px;max-width:680px;line-height:1.6}
  .filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:30px}.filters button{background:transparent;border:1px solid var(--line);color:var(--mut);border-radius:100px;padding:6px 13px;font-size:12px;cursor:pointer;transition:.2s;font-family:inherit}
  .filters button.on,.filters button:hover{border-color:var(--ink);color:var(--ink)}
  .work{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}@media(max-width:900px){.work{grid-template-columns:repeat(2,1fr)}}
  .wcard{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel);transition:.25s var(--ease);text-decoration:none;color:inherit;display:block}
  .wcard:hover{border-color:var(--line2);transform:translateY(-4px)}
  .media{position:relative;aspect-ratio:16/10;background:linear-gradient(135deg,#141414,#0a0a0a);overflow:hidden;display:grid;place-items:center;border-bottom:1px solid var(--line)}
  .media img.cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;transition:transform .4s var(--ease)}.wcard:hover .media img.cover{transform:scale(1.03)}
  .media.play::after{content:"";position:absolute;width:54px;height:54px;border-radius:50%;border:1px solid rgba(255,255,255,.6);z-index:2}.media.play .pi{position:absolute;z-index:3;color:#fff;font-size:15px;margin-left:3px}
  .star{position:absolute;top:10px;left:10px;z-index:3;background:var(--red);color:#fff;font-family:var(--disp);font-size:9px;letter-spacing:.1em;font-weight:600;padding:4px 8px;border-radius:100px;text-transform:uppercase}
  .body{padding:20px 22px 24px}.meta{display:flex;justify-content:space-between;margin-bottom:9px}.meta span{font-family:var(--disp);font-size:10px;letter-spacing:.14em;color:var(--mut2);text-transform:uppercase;font-weight:500}
  .body h3{font-size:21px;margin-bottom:7px;font-family:var(--disp);letter-spacing:-.01em}.body p{color:var(--mut);font-size:13px;line-height:1.55;min-height:1px}
  .go{margin-top:14px;display:inline-flex;gap:8px;color:var(--ink);font-family:var(--disp);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:500}.wcard:hover .go{color:var(--red)}
</style>
<h1>Our Work — seeded from R2 (${docs.length} projects)</h1>
<p class="sub">Exactly what the seed script writes to Sanity: one project per group, real R2 covers, ${docs.filter((d)=>d.featured).length} marked <b style="color:var(--red)">★ Home</b> for the Selected-work strip. Copy on the un-named projects is placeholder — you'll refine it in <code>/cms</code>. Click a filter.</p>
<div class="filters"><button class="on" data-f="all">All</button>${cats.map((c) => `<button data-f="${c}">${cap(c)}</button>`).join("")}</div>
<div class="work">${docs.map(card).join("")}</div>
<script>
  const btns=[...document.querySelectorAll('.filters button')],cards=[...document.querySelectorAll('.wcard')];
  btns.forEach(b=>b.onclick=()=>{btns.forEach(x=>x.classList.remove('on'));b.classList.add('on');const f=b.dataset.f;cards.forEach(c=>c.style.display=(f==='all'||c.dataset.cat===f)?'':'none')});
</script>`;
  process.stdout.write(out);
  process.exit(0);
}

if (DRY) {
  console.log(`Would seed ${docs.length} project documents:\n`);
  for (const d of docs) {
    console.log(
      `  [${String(d.order).padStart(2)}] ${d.featured ? "★" : " "} ${d.category.padEnd(11)} ${d.title}`
    );
    console.log(`        cover: ${d.coverUrl}`);
  }
  console.log(`\n(${docs.filter((d) => d.featured).length} featured · dry run, nothing written)`);
  process.exit(0);
}

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Missing SANITY_PROJECT_ID and/or SANITY_WRITE_TOKEN. (Use --dry to preview.)");
  process.exit(1);
}

const dataset = process.env.SANITY_DATASET || "production";
console.log(`→ Target: project "${projectId}", dataset "${dataset}"`);

const { createClient } = await import("@sanity/client");
const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

// Read the count from THIS connection before and after — proves what landed
// where, using the exact project+dataset the write targeted (no CDN, no guesswork).
const before = await client.fetch('count(*[_type == "project"])');

const tx = client.transaction();
for (const d of docs) {
  if (REPLACE) tx.createOrReplace(d);
  else tx.createIfNotExists(d);
}
const res = await tx.commit();

const after = await client.fetch('count(*[_type == "project"])');
console.log(
  `Seeded ${docs.length} projects (${REPLACE ? "createOrReplace" : "createIfNotExists"}). ` +
    `Transaction ${res.transactionId}.`
);
console.log(`✔ project docs in ${projectId}/${dataset}: ${before} → ${after}`);
if (after === 0) {
  console.log("⚠ Still 0 after write — the token does not belong to this project id. Regenerate the token from inside the project whose ID matches above.");
}

// Diagnostics: published vs draft breakdown, plus an anonymous read that
// reproduces EXACTLY what the public website sees.
const pub = await client.fetch('count(*[_type == "project" && !(_id in path("drafts.**"))])');
const draft = await client.fetch('count(*[_type == "project" && (_id in path("drafts.**"))])');
console.log(`  published: ${pub}  ·  drafts: ${draft}`);

const anon = createClient({ projectId, dataset, apiVersion: process.env.SANITY_API_VERSION || "2025-01-01", useCdn: false });
let anonCount;
try {
  anonCount = await anon.fetch('count(*[_type == "project"])');
} catch (e) {
  anonCount = `ERROR: ${e.statusCode || ""} ${e.message}`;
}
console.log(`  anonymous / tokenless (what the site sees): ${anonCount}`);
if (typeof anonCount === "number" && anonCount === 0 && pub > 0) {
  console.log("→ Docs are published but anonymous reads see 0: the dataset is still NOT public at the API (visibility change not effective). Fix visibility, or use a read token.");
} else if (draft > 0 && pub === 0) {
  console.log("→ Docs are DRAFTS: the public site cannot read drafts. They need publishing.");
} else if (typeof anonCount === "number" && anonCount >= pub && pub > 0) {
  console.log("→ Anonymous can read them — the site should work after a cache-off redeploy.");
}
