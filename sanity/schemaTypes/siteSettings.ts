import { defineType, defineField } from "sanity";

// Singleton: the editable copy that drives the marketing site's key surfaces.
// Field names map 1:1 to what the pages render, with a hardcoded fallback in
// code so an empty/absent document never blanks the site.
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  groups: [
    { name: "hero", title: "Home hero", default: true },
    { name: "cta", title: "Closing band" },
    { name: "meta", title: "Brand & footer" },
  ],
  fields: [
    defineField({
      name: "heroEyebrow",
      title: "Hero eyebrow",
      type: "string",
      group: "hero",
      description: 'Small label above the headline, e.g. "Strategy-led · Creative studio".',
    }),
    defineField({
      name: "heroLine1",
      title: "Headline — line 1",
      type: "string",
      group: "hero",
      description: 'e.g. "From concept"',
    }),
    defineField({
      name: "heroLine2",
      title: "Headline — line 2",
      type: "string",
      group: "hero",
      description: 'e.g. "to completion." — the last word is underlined automatically.',
    }),
    defineField({
      name: "heroLead",
      title: "Hero lead paragraph",
      type: "text",
      rows: 3,
      group: "hero",
    }),
    defineField({
      name: "marquee",
      title: "Marquee words",
      type: "array",
      of: [{ type: "string" }],
      group: "hero",
      description: "The scrolling word band under the hero.",
    }),
    defineField({
      name: "ctaHeadingA",
      title: "Closing band — heading line 1",
      type: "string",
      group: "cta",
    }),
    defineField({
      name: "ctaHeadingB",
      title: "Closing band — heading line 2 (emphasised)",
      type: "string",
      group: "cta",
    }),
    defineField({
      name: "ctaBody",
      title: "Closing band — body",
      type: "text",
      rows: 2,
      group: "cta",
    }),
    defineField({
      name: "footerTagline",
      title: "Footer tagline",
      type: "string",
      group: "meta",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site Settings" }),
  },
});
