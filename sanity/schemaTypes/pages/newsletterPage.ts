import { defineType, defineField } from "sanity";

export const newsletterPage = defineType({
  name: "newsletterPage",
  title: "Newsletter Page",
  type: "document",
  groups: [
    { name: "hero", title: "Hero & signup", default: true },
    { name: "archive", title: "Archive" },
  ],
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string", group: "hero" }),
    defineField({ name: "heading", title: "Heading", type: "text", rows: 2, group: "hero", description: "Use a line break for two lines." }),
    defineField({ name: "lead", title: "Lead", type: "text", rows: 2, group: "hero" }),
    defineField({ name: "formKicker", title: "Signup kicker", type: "string", group: "hero" }),
    defineField({ name: "placeholder", title: "Email placeholder", type: "string", group: "hero" }),
    defineField({ name: "submitLabel", title: "Submit label", type: "string", group: "hero" }),
    defineField({ name: "fineprint", title: "Fine print", type: "text", rows: 2, group: "hero" }),
    defineField({ name: "archiveEyebrow", title: "Archive eyebrow", type: "string", group: "archive" }),
    defineField({ name: "archiveHeading", title: "Archive heading", type: "string", group: "archive" }),
    defineField({
      name: "issues",
      title: "Past issues",
      type: "array",
      group: "archive",
      of: [{
        type: "object",
        fields: [
          { name: "no", title: "Issue no.", type: "string" },
          { name: "t", title: "Title", type: "string" },
          { name: "d", title: "Description", type: "text", rows: 2 },
          { name: "dt", title: "Meta (date · posts)", type: "string" },
        ],
        preview: { select: { title: "t", subtitle: "no" } },
      }],
    }),
  ],
  preview: { prepare: () => ({ title: "Newsletter Page" }) },
});
