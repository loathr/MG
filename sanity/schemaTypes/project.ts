import { defineType, defineField } from "sanity";

// A curated Work item. Fields map 1:1 to what a Work card renders, so editing is
// literal. Cover art can be an uploaded image or a direct URL (e.g. the R2 CDN
// where the existing library already lives). `category` doubles as the Our Work
// filter bucket, and `featured` promotes an item to the Home "Selected work"
// strip.
export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Project name",
      type: "string",
      description: 'Short label shown in the card meta, e.g. "GAS", "Agidi Magazine".',
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
      name: "kind",
      title: "Kind / label",
      type: "string",
      description: 'The small tag beside the name, e.g. "Editorial", "Film", "Music".',
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      description: 'The card\'s title line, e.g. "A film with a point of view".',
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "Drives the Our Work filter this project appears under.",
      options: {
        list: [
          { title: "Fashion", value: "fashion" },
          { title: "Portraits", value: "portraits" },
          { title: "Events", value: "events" },
          { title: "Weddings", value: "weddings" },
          { title: "Film", value: "film" },
          { title: "Music", value: "music" },
          { title: "Postcards", value: "postcards" },
          { title: "Publishing", value: "publishing" },
          { title: "Graphics", value: "graphics" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 2,
      description: "One-line description under the headline.",
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
      description: "Adds the ▶ marker for film / motion / video work.",
      initialValue: false,
    }),
    defineField({
      name: "featured",
      title: "Feature on Home",
      type: "boolean",
      description: 'Also show this project in the Home "Selected work" strip.',
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
