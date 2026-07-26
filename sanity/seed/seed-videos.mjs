#!/usr/bin/env node
/**
 * Attach transcoded R2 videos to projects, and create the new video-led projects
 * (Commercial / Social / fashion films). Idempotent: patches existing projects'
 * videoUrl by title; createIfNotExists for new ones.
 *
 *   Preview:  node sanity/seed/seed-videos.mjs --dry
 *   Run:      SANITY_PROJECT_ID=71hpjqi4 SANITY_DATASET=production \
 *               SANITY_WRITE_TOKEN=sk... node sanity/seed/seed-videos.mjs
 */
const DRY = process.argv.includes("--dry");
const V = "https://pub-ea1f271a548f41ada37411b1a646b020.r2.dev/video";
const vid = (f) => `${V}/${f}-preview.mp4`;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Existing projects → set videoUrl (matched by title).
const SET = [
  { title: "GAS", file: "gas" },
  { title: "Agidi Magazine", file: "agidi-fashion-film" },
  { title: "Events", file: "vods-video" },
  { title: "Wavy", file: "shayo-galore-ii" },
];

// New projects to create (best-quality clip picked by largest source).
const NEW = [
  { title: "We Are Assholes", category: "commercial", kind: "Commercial", file: "we-are-assholes-fashion-film", summary: "A commercial film with attitude." },
  { title: "MyWoosah", category: "commercial", kind: "Commercial", file: "benefits-for-parents", summary: "Brand film for MyWoosah — the breather every parent needs." },
  { title: "Badesere", category: "fashion", kind: "Fashion Film", file: "badesere-2", summary: "A fashion film." },
  { title: "Social Campaign", category: "social", kind: "Social", file: "6393-video-7-1", summary: "Short-form social campaign content." },
  { title: "Summer Fashion Film", category: "fashion", kind: "Fashion Film", file: "summer-fashion-film", summary: "A summer fashion film." },
  { title: "Spring Fashion Film", category: "fashion", kind: "Fashion Film", file: "spring-fashion-film", summary: "A spring fashion film." },
  { title: "A Day at the Market", category: "fashion", kind: "Fashion Film", file: "a-day-at-the-market-fashion-film", summary: "A fashion film — a day at the market." },
  { title: "Faahion Film 2", category: "fashion", kind: "Fashion Film", file: "faahion-film-2-clip", summary: "A fashion film." },
];

if (DRY) {
  console.log("Set videoUrl on existing projects:");
  SET.forEach((s) => console.log(`  · ${s.title}  →  ${vid(s.file)}`));
  console.log("\nCreate new projects:");
  NEW.forEach((n) => console.log(`  · ${n.title} [${n.category}]  →  ${vid(n.file)}`));
  console.log("\n(dry run, nothing written)");
  process.exit(0);
}

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Missing SANITY_PROJECT_ID and/or SANITY_WRITE_TOKEN. (Use --dry to preview.)");
  process.exit(1);
}
const dataset = process.env.SANITY_DATASET || "production";
const { createClient } = await import("@sanity/client");
const client = createClient({ projectId, dataset, apiVersion: process.env.SANITY_API_VERSION || "2025-01-01", token, useCdn: false });

// 1) patch existing projects' videoUrl
for (const s of SET) {
  const id = await client.fetch(`*[_type == "project" && title == $t][0]._id`, { t: s.title });
  if (id) {
    await client.patch(id).set({ videoUrl: vid(s.file), hasVideo: true }).commit();
    console.log(`✔ set videoUrl on "${s.title}"`);
  } else {
    console.log(`⚠ no existing project titled "${s.title}" — skipped`);
  }
}

// 2) create new projects (after the seeded ones; order 100+)
const maxOrder = (await client.fetch(`*[_type == "project"] | order(order desc)[0].order`)) || 0;
const tx = client.transaction();
NEW.forEach((n, i) => {
  const id = `project.${n.category}-${slugify(n.title)}`;
  tx.createIfNotExists({
    _id: id, _type: "project",
    title: n.title, slug: { _type: "slug", current: slugify(n.title) },
    kind: n.kind, headline: n.title, category: n.category, summary: n.summary,
    videoUrl: vid(n.file), hasVideo: true, featured: false, order: Math.max(maxOrder + 1 + i, 100 + i),
  });
});
const res = await tx.commit();
console.log(`✔ created/ensured ${NEW.length} new projects. Transaction ${res.transactionId}.`);
console.log("Published — they appear in Our Work, the gallery, and each has a /work/[slug] page.");
