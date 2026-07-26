#!/usr/bin/env node
/**
 * Seed the page-content singletons with the site's current copy, so every page
 * becomes click-to-edit in Presentation immediately (overlays only appear on
 * content that exists in Sanity). Idempotent: createIfNotExists, so it never
 * clobbers edits you've already made.
 *
 *   Preview:  node sanity/seed/seed-pages.mjs --dry
 *   Run:      SANITY_PROJECT_ID=71hpjqi4 SANITY_DATASET=production \
 *               SANITY_WRITE_TOKEN=sk... node sanity/seed/seed-pages.mjs
 *
 * Flags: --dry (no writes), --replace (createOrReplace — overwrites edits).
 */
const DRY = process.argv.includes("--dry");
const REPLACE = process.argv.includes("--replace");
const k = (p, i) => ({ _key: `${p}${i}` });

const siteSettings = {
  _id: "siteSettings", _type: "siteSettings",
  heroEyebrow: "Strategy-led · Creative studio",
  heroLine1: "From concept", heroLine2: "to completion.",
  heroLead: "Loathr is a strategy-led creative consultancy. We build stronger brands, execute meaningful projects, and create lasting impact. Strategy first, creative throughout.",
  marquee: ["Brand Strategy", "Photography", "Film & Motion", "Consultancy", "Web Design", "Storytelling", "Media Production", "Marketing", "Publishing"],
  pillarsEyebrow: "What we do", pillarsHeadA: "Three pillars.", pillarsHeadB: "One integrated partner.",
  pillarsLead: "Strategy leads; creative and growth execute. One consultancy, one plan. Never eleven disconnected services.",
  homePillars: [
    { ...k("p", 0), n: "01", title: "Strategy", desc: "Clarity, direction, and priorities that become your competitive advantage.", items: ["Brand Strategy", "Business Consultancy", "Project Management"] },
    { ...k("p", 1), n: "02", title: "Creative", desc: "The visual execution arm, Loathr Studios. Creative in service of the strategy.", items: ["Branding & Identity", "Design", "Photography", "Storytelling", "Media Production"] },
    { ...k("p", 2), n: "03", title: "Growth", desc: "Turning presence into demand, and perception into your most valuable asset.", items: ["Marketing", "Social Media", "Web Design", "Digital Support"] },
  ],
  selectedEyebrow: "Selected work", selectedHeading: "Proof, not decoration.",
  ctaHeadingA: "Let's build something", ctaHeadingB: "undeniable.",
  ctaBody: "Developing brands, and driving visibility, from concept to completion.",
  footerTagline: "A strategy-led creative consultancy. From concept to completion.",
  footerFine: "Black & white · red accent",
};

const aboutPage = {
  _id: "aboutPage", _type: "aboutPage",
  eyebrow: "About Loathr",
  heading: "We help organisations make sense of who they are, and how they’re perceived.",
  lead: "A strategy-first consultancy with a creative studio inside it, uniting strategy, creative, and growth on precision, long-term thinking, and ruthless execution.",
  stats: [
    { ...k("s", 0), value: "100", suffix: "+", label: "creatives & collaborators" },
    { ...k("s", 1), value: "5", suffix: "yr+", label: "work that stays future-proof" },
    { ...k("s", 2), value: "3", label: "integrated pillars" },
    { ...k("s", 3), value: "1", label: "content engine · loathrdotcom" },
  ],
  cards: [
    { ...k("c", 0), label: "Our Story", body: "Loathr began as a refusal to settle for “good enough,” an editorial stance that grew into a full consultancy." },
    { ...k("c", 1), label: "Mission", body: "To develop brands and drive visibility, turning high-level thinking into real-world results that actually work." },
    { ...k("c", 2), label: "Approach", body: "Diagnose, design, deploy, monitor, sustain. We don’t hand over a report and walk away." },
  ],
  stanceEyebrow: "A deliberate stance", stanceHeadA: "We stay ", stanceHeadEm: "faceless", stanceHeadB: " on purpose.",
  stanceLines: [
    { ...k("l", 0), text: "No founder headshots. No team carousel. No names to remember." },
    { ...k("l", 1), text: "The work is the introduction. Everything else is noise until we’re in a room." },
    { ...k("l", 2), text: "Judge us on what we make, not on who’s in the photo.", strong: true },
    { ...k("l", 3), text: "When it matters, you’ll meet us. Until then, the work." },
  ],
  ctaHeadA: "Let's build something", ctaHeadEm: "undeniable.",
};

const whatWeDoPage = {
  _id: "whatWeDoPage", _type: "whatWeDoPage",
  eyebrow: "What we do",
  heading: "Everything a company needs, under one roof, organised, not scattered.",
  lead: "Grouped into three pillars so it’s clear how we work together, not eleven disconnected services.",
  pillars: [
    { ...k("pl", 0), eyebrow: "Strategy & Consultancy · Loathr Enterprises", heading: "The thinking that comes first", services: [
      { ...k("a", 0), h: "Business Strategy & Management", p: "Business strategy, business management, growth strategy, market entry, competitive positioning." },
      { ...k("a", 1), h: "Operations & Structuring", p: "Operational structuring, procurement strategy, process optimisation, financial structuring, risk." },
      { ...k("a", 2), h: "Advisory & Delivery", p: "Business consultancy, project management, organisational development, representation & negotiation." },
    ] },
    { ...k("pl", 1), eyebrow: "Creative · Loathr Studios", heading: "The visual execution arm", services: [
      { ...k("b", 0), h: "Branding & Identity", p: "The visual systems that make your presence undeniable." },
      { ...k("b", 1), h: "Photography", p: "Product, lifestyle, editorial, portraiture, art-directed end to end." },
      { ...k("b", 2), h: "Media Production", p: "Film, motion, commercials, documentary, cinematic precision." },
      { ...k("b", 3), h: "Design", p: "Editorial, campaign, and publishing design for longevity." },
      { ...k("b", 4), h: "Storytelling", p: "Documentary & narrative, stories worth the runtime." },
      { ...k("b", 5), h: "AI & Hybrid Production", p: "Synthetic + hybrid visual assets, disciplined and strategic." },
    ] },
    { ...k("pl", 2), eyebrow: "Growth", heading: "Turning presence into demand", services: [
      { ...k("c", 0), h: "Marketing", p: "Measurable growth: SEO, PPC, and lead generation across the full funnel." },
      { ...k("c", 1), h: "Social Media", p: "Commanding the conversation with tactical, relentless digital." },
      { ...k("c", 2), h: "Web Design", p: "Award-worthy sites that meet business goals and feel like an experience." },
    ] },
  ],
  steps: [
    { ...k("st", 0), n: "01", title: "Diagnose", desc: "Deconstruct the model, stack, and landscape." },
    { ...k("st", 1), n: "02", title: "Design", desc: "Frameworks and roadmaps with clear objectives." },
    { ...k("st", 2), n: "03", title: "Deploy", desc: "Execute alongside your team, not from afar." },
    { ...k("st", 3), n: "04", title: "Monitor", desc: "Track against defined KPIs and benchmarks." },
    { ...k("st", 4), n: "05", title: "Sustain", desc: "Embed systems and transfer knowledge." },
  ],
};

const workPage = {
  _id: "workPage", _type: "workPage",
  eyebrow: "Our work", heading: "We bring your boldest ideas to life.",
  lead: "Each project tells a story: client, challenge, solution, outcome. Not just a wall of images.",
};

const insightsPage = {
  _id: "insightsPage", _type: "insightsPage",
  eyebrow: "Insights", heading: "The blog, with a point of view.",
  engineNote: "Posts published straight from the loathrdotcom engine, generated, then rendered here as articles.",
};

const newsletterPage = {
  _id: "newsletterPage", _type: "newsletterPage",
  eyebrow: "The Weekly", heading: "One issue a week.\nAssembled from the week.",
  lead: "The best of what loathrdotcom generated this week: culture, enterprise, and the news desk, all in one edition. No filler.",
  formKicker: "Subscribe · free", placeholder: "you@company.com", submitLabel: "Subscribe",
  fineprint: "Weekly. Unsubscribe anytime. Sound-designed reading experience on the web edition.",
  archiveEyebrow: "Archive", archiveHeading: "Past issues",
  issues: [
    { ...k("i", 0), no: "Issue 042", t: "The one where nobody blinked", d: "Split verdicts, a market read, and three things worth loathing.", dt: "Jul 20, 2026 · 6 posts" },
    { ...k("i", 1), no: "Issue 041", t: "Receipts & second-order effects", d: "The stories that mattered, read and argued from every angle.", dt: "Jul 13, 2026 · 5 posts" },
    { ...k("i", 2), no: "Issue 040", t: "Standards, not cynicism", d: "Forty issues in. A retrospective on the takes that aged well.", dt: "Jul 6, 2026 · 7 posts" },
  ],
};

const contactPage = {
  _id: "contactPage", _type: "contactPage",
  eyebrow: "Get started", heading: "Let’s talk.",
  lead: "Whether you have a question or a project to scope, from concept to completion, we’re here.",
  serviceOptions: ["Strategy: Business / Consultancy / PM", "Creative: Branding / Photo / Film", "Growth: Marketing / Social / Web", "Not sure yet"],
  submitLabel: "Send message",
  faq: [
    { ...k("f", 0), q: "What services do you offer?", a: "Strategy, creative/production, and growth, grouped as three pillars so engagements stay integrated, not scattered." },
    { ...k("f", 1), q: "Typical project timeline?", a: "Scoped per engagement. We define scope, timeline, and budget parameters up front. No surprises." },
    { ...k("f", 2), q: "Do you offer post-launch support?", a: "Yes. We embed systems and transfer knowledge. We don't hand over a report and walk away." },
    { ...k("f", 3), q: "Online and offline projects?", a: "Both. Digital experiences, film, print, and physical brand systems." },
  ],
  trustNote: "Accredited & trusted · logos pending",
};

const docs = [siteSettings, aboutPage, whatWeDoPage, workPage, insightsPage, newsletterPage, contactPage];

if (DRY) {
  console.log(`Would seed ${docs.length} page documents:`);
  docs.forEach((d) => console.log(`  · ${d._id}`));
  console.log("(dry run, nothing written)");
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
const client = createClient({ projectId, dataset, apiVersion: process.env.SANITY_API_VERSION || "2025-01-01", token, useCdn: false });

const tx = client.transaction();
for (const d of docs) REPLACE ? tx.createOrReplace(d) : tx.createIfNotExists(d);
const res = await tx.commit();
console.log(`Seeded ${docs.length} page documents (${REPLACE ? "createOrReplace" : "createIfNotExists"}). Transaction ${res.transactionId}.`);
console.log("These are published, so every page is now click-to-edit in /cms → Presentation.");
