import { defineType, defineField } from "sanity";

// Singleton: all editable copy on the What We Do page — the three pillars (each
// with a set of service cards) and the five-step process.
export const whatWeDoPage = defineType({
  name: "whatWeDoPage",
  title: "What We Do Page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "pillars", title: "Pillars" },
    { name: "steps", title: "Process" },
  ],
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string", group: "hero" }),
    defineField({ name: "heading", title: "Heading", type: "text", rows: 2, group: "hero" }),
    defineField({ name: "lead", title: "Lead", type: "text", rows: 2, group: "hero" }),
    defineField({
      name: "pillars",
      title: "Pillars",
      type: "array",
      group: "pillars",
      of: [{
        type: "object",
        fields: [
          { name: "eyebrow", title: "Pillar eyebrow", type: "string" },
          { name: "heading", title: "Pillar heading", type: "string" },
          {
            name: "services",
            title: "Service cards",
            type: "array",
            of: [{
              type: "object",
              fields: [
                { name: "h", title: "Title", type: "string" },
                { name: "p", title: "Body", type: "text", rows: 2 },
              ],
              preview: { select: { title: "h", subtitle: "p" } },
            }],
          },
        ],
        preview: { select: { title: "heading", subtitle: "eyebrow" } },
      }],
    }),
    defineField({
      name: "steps",
      title: "Process steps",
      type: "array",
      group: "steps",
      of: [{
        type: "object",
        fields: [
          { name: "n", title: "Number", type: "string" },
          { name: "title", title: "Title", type: "string" },
          { name: "desc", title: "Description", type: "text", rows: 2 },
        ],
        preview: { select: { title: "title", subtitle: "n" } },
      }],
    }),
  ],
  preview: { prepare: () => ({ title: "What We Do Page" }) },
});
