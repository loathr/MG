import { defineType, defineField } from "sanity";

// A curated Work item. The user manages these to drive the Our Work grid and
// the Home "Selected work" strip — cover art comes from Sanity's asset pipeline
// (or, later, a direct R2 URL via `coverUrl` for the already-uploaded library).
export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "client",
      title: "Client / label",
      type: "string",
      description: 'Short attribution shown in the card meta, e.g. "GAS".',
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          "Film & Motion",
          "Photography",
          "Fashion",
          "Portraits",
          "Music",
          "Branding",
          "Publishing",
          "Web",
        ],
      },
    }),
    defineField({ name: "year", title: "Year", type: "string" }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "cover",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverUrl",
      title: "Cover URL (R2 / external)",
      type: "url",
      description:
        "Optional: paste a direct image URL (e.g. the R2 CDN) instead of uploading. Takes precedence when set.",
    }),
    defineField({
      name: "hasVideo",
      title: "Show play affordance",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "featured",
      title: "Feature on Home",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      initialValue: 0,
      description: "Lower numbers appear first.",
    }),
  ],
  orderings: [
    {
      title: "Sort order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "category", media: "cover" },
  },
});
