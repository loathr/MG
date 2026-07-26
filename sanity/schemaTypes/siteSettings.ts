import { defineType, defineField } from "sanity";

// Singleton: Home page copy + global footer. Field names map 1:1 to what the
// pages render, with a hardcoded fallback in code so an empty/absent document
// never blanks the site.
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  groups: [
    { name: "hero", title: "Home · hero", default: true },
    { name: "pillars", title: "Home · pillars" },
    { name: "selected", title: "Home · selected work" },
    { name: "cta", title: "Home · closing band" },
    { name: "footer", title: "Footer" },
  ],
  fields: [
    defineField({ name: "heroEyebrow", title: "Hero eyebrow", type: "string", group: "hero" }),
    defineField({ name: "heroLine1", title: "Headline — line 1", type: "string", group: "hero" }),
    defineField({ name: "heroLine2", title: "Headline — line 2 (last word underlined)", type: "string", group: "hero" }),
    defineField({ name: "heroLead", title: "Hero lead", type: "text", rows: 3, group: "hero" }),
    defineField({ name: "marquee", title: "Marquee words", type: "array", of: [{ type: "string" }], group: "hero" }),

    defineField({ name: "pillarsEyebrow", title: "Pillars eyebrow", type: "string", group: "pillars" }),
    defineField({ name: "pillarsHeadA", title: "Pillars heading — line 1", type: "string", group: "pillars" }),
    defineField({ name: "pillarsHeadB", title: "Pillars heading — line 2", type: "string", group: "pillars" }),
    defineField({ name: "pillarsLead", title: "Pillars lead", type: "text", rows: 2, group: "pillars" }),
    defineField({
      name: "homePillars",
      title: "Pillars (3)",
      type: "array",
      group: "pillars",
      of: [{
        type: "object",
        fields: [
          { name: "n", title: "Number", type: "string" },
          { name: "title", title: "Title", type: "string" },
          { name: "desc", title: "Description", type: "text", rows: 2 },
          { name: "items", title: "List items", type: "array", of: [{ type: "string" }] },
        ],
        preview: { select: { title: "title", subtitle: "n" } },
      }],
    }),

    defineField({ name: "selectedEyebrow", title: "Selected-work eyebrow", type: "string", group: "selected" }),
    defineField({ name: "selectedHeading", title: "Selected-work heading", type: "string", group: "selected" }),

    defineField({ name: "ctaHeadingA", title: "Closing — line 1", type: "string", group: "cta" }),
    defineField({ name: "ctaHeadingB", title: "Closing — line 2 (emphasised)", type: "string", group: "cta" }),
    defineField({ name: "ctaBody", title: "Closing — body", type: "text", rows: 2, group: "cta" }),

    defineField({ name: "footerTagline", title: "Footer tagline", type: "string", group: "footer" }),
    defineField({ name: "footerFine", title: "Footer fine print", type: "string", group: "footer" }),
  ],
  preview: { prepare: () => ({ title: "Site Settings" }) },
});
