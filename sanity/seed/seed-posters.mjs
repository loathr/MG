#!/usr/bin/env node
/**
 * Set cover images on the new video-led projects from the poster frames the
 * Colab cell uploaded to R2 (image/<slug>-poster.jpg). Only touches the 8 new
 * projects (the originals keep their existing photo covers).
 *
 *   Preview:  node sanity/seed/seed-posters.mjs --dry
 *   Run:      SANITY_PROJECT_ID=71hpjqi4 SANITY_DATASET=production \
 *               SANITY_WRITE_TOKEN=sk... node sanity/seed/seed-posters.mjs
 */
const DRY = process.argv.includes("--dry");
const B = "https://pub-ea1f271a548f41ada37411b1a646b020.r2.dev/image";
const poster = (sg) => `${B}/${sg}-poster.jpg`;

const MAP = [
  { title: "We Are Assholes", sg: "we-are-assholes-fashion-film" },
  { title: "MyWoosah", sg: "benefits-for-parents" },
  { title: "Badesere", sg: "badesere-2" },
  { title: "Social Campaign", sg: "6393-video-7-1" },
  { title: "Summer Fashion Film", sg: "summer-fashion-film" },
  { title: "Spring Fashion Film", sg: "spring-fashion-film" },
  { title: "A Day at the Market", sg: "a-day-at-the-market-fashion-film" },
  { title: "Faahion Film 2", sg: "faahion-film-2-clip" },
];

if (DRY) {
  console.log("Set coverUrl (poster) on new projects:");
  MAP.forEach((m) => console.log(`  · ${m.title}  →  ${poster(m.sg)}`));
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

for (const m of MAP) {
  const id = await client.fetch(`*[_type == "project" && title == $t][0]._id`, { t: m.title });
  if (id) {
    await client.patch(id).set({ coverUrl: poster(m.sg) }).commit();
    console.log(`✔ cover set on "${m.title}"`);
  } else {
    console.log(`⚠ no project titled "${m.title}" — skipped`);
  }
}
console.log("Done — covers show on /work cards and detail-page heroes.");
