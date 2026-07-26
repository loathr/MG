import { defineType, defineField } from "sanity";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact Page",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({ name: "lead", title: "Lead", type: "text", rows: 2 }),
    defineField({
      name: "serviceOptions",
      title: "Service dropdown options",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "submitLabel", title: "Submit button label", type: "string" }),
    defineField({
      name: "faq",
      title: "Frequent queries",
      type: "array",
      of: [{
        type: "object",
        fields: [
          { name: "q", title: "Question", type: "string" },
          { name: "a", title: "Answer", type: "text", rows: 2 },
        ],
        preview: { select: { title: "q" } },
      }],
    }),
    defineField({ name: "trustNote", title: "Trust note", type: "string" }),
  ],
  preview: { prepare: () => ({ title: "Contact Page" }) },
});
