#!/usr/bin/env node
/**
 * Diagnose the marketing site's live read path — replicating sanity/lib/client.ts
 * and the Our Work query EXACTLY — using the same env var names the deployed site
 * reads. Run it with the same values you put in Vercel:
 *
 *   NEXT_PUBLIC_SANITY_PROJECT_ID=71hpjqi4 \
 *   NEXT_PUBLIC_SANITY_DATASET=production \
 *   SANITY_API_READ_TOKEN=sk_your_viewer_token \
 *     node sanity/seed/diagnose.mjs
 *
 * If this prints 22 projects, the code + your values are correct, and the only
 * remaining variable is whether Vercel actually applied SANITY_API_READ_TOKEN to
 * the production build.
 */
import { createClient } from "@sanity/client";

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";
const readToken = process.env.SANITY_API_READ_TOKEN;

console.log("Resolved config (what the site would use):");
console.log(`  projectId : ${projectId || "(MISSING!)"}`);
console.log(`  dataset   : ${dataset}`);
console.log(`  apiVersion: ${apiVersion}`);
console.log(`  readToken : ${readToken ? `present (len ${readToken.length}, ${readToken.slice(0, 3)}…)` : "(MISSING — site reads anonymously)"}`);
console.log("");

if (!projectId) {
  console.log("✗ NEXT_PUBLIC_SANITY_PROJECT_ID is not set — the site can't read Sanity at all.");
  process.exit(1);
}

// EXACT mirror of sanity/lib/client.ts
const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: !readToken,
  token: readToken || undefined,
  perspective: "published",
});

// EXACT query from app/(marketing)/work/page.tsx
const WORK_QUERY = `*[_type == "project"] | order(order asc, _createdAt asc){
  "c": category, "n": title, "s": kind, "t": headline, "d": summary,
  "play": hasVideo, coverUrl, cover
}`;

try {
  const docs = await client.fetch(WORK_QUERY);
  console.log(`✔ Site read returned ${docs.length} projects.`);
  if (docs.length) {
    for (const d of docs.slice(0, 5)) {
      console.log(`   · ${d.n} [${d.c}] — cover: ${d.coverUrl || "(sanity asset)"}`);
    }
    if (docs.length > 5) console.log(`   … and ${docs.length - 5} more`);
    console.log("\n→ CODE + VALUES ARE CORRECT. If the live site still shows placeholders,");
    console.log("  Vercel is not applying SANITY_API_READ_TOKEN to the production build.");
    console.log("  Re-add it (all environments) and trigger a fresh production deploy.");
  } else {
    console.log("\n→ Read succeeded but 0 projects — check projectId/dataset match where the seed wrote.");
  }
} catch (e) {
  console.log(`✗ Read FAILED: ${e.statusCode || ""} ${e.message}`);
  console.log("\n→ With a token this usually means the token is wrong/invalid for this project.");
  console.log("  Regenerate a Viewer token in THIS project and use its exact value.");
}
