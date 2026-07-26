import { defineType, defineField } from "sanity";

// Singleton: all editable copy on the About page. Field names map to what the
// page renders; code keeps the current text as fallback so a blank field never
// blanks the page.
export const aboutPage = defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "cards", title: "Story / Mission / Approach" },
    { name: "stance", title: "Faceless stance" },
    { name: "cta", title: "Closing band" },
  ],
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string", group: "hero" }),
    defineField({ name: "heading", title: "Heading", type: "text", rows: 2, group: "hero" }),
    defineField({ name: "lead", title: "Lead", type: "text", rows: 3, group: "hero" }),
    defineField({
      name: "stats",
      title: "Stats",
      type: "array",
      group: "hero",
      of: [{
        type: "object",
        fields: [
          { name: "value", title: "Value", type: "string" },
          { name: "suffix", title: "Suffix (red)", type: "string" },
          { name: "label", title: "Label", type: "string" },
        ],
        preview: { select: { title: "value", subtitle: "label" } },
      }],
    }),
    defineField({
      name: "cards",
      title: "Cards",
      type: "array",
      group: "cards",
      of: [{
        type: "object",
        fields: [
          { name: "label", title: "Label", type: "string" },
          { name: "body", title: "Body", type: "text", rows: 3 },
        ],
        preview: { select: { title: "label", subtitle: "body" } },
      }],
    }),
    defineField({ name: "stanceEyebrow", title: "Stance eyebrow", type: "string", group: "stance" }),
    defineField({ name: "stanceHeadA", title: "Stance heading — before emphasis", type: "string", group: "stance", description: 'e.g. "We stay"' }),
    defineField({ name: "stanceHeadEm", title: "Stance heading — emphasis", type: "string", group: "stance", description: 'e.g. "faceless"' }),
    defineField({ name: "stanceHeadB", title: "Stance heading — after emphasis", type: "string", group: "stance", description: 'e.g. "on purpose."' }),
    defineField({
      name: "stanceLines",
      title: "Stance paragraphs",
      type: "array",
      group: "stance",
      of: [{
        type: "object",
        fields: [
          { name: "text", title: "Text", type: "text", rows: 2 },
          { name: "strong", title: "Bold", type: "boolean", initialValue: false },
        ],
        preview: { select: { title: "text" } },
      }],
    }),
    defineField({ name: "ctaHeadA", title: "Closing — line 1", type: "string", group: "cta" }),
    defineField({ name: "ctaHeadEm", title: "Closing — line 2 (emphasised)", type: "string", group: "cta" }),
  ],
  preview: { prepare: () => ({ title: "About Page" }) },
});
