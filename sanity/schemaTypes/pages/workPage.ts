import { defineType, defineField } from "sanity";

// Singleton: the Our Work / Gallery hero copy. (The projects themselves are
// separate `project` documents.)
export const workPage = defineType({
  name: "workPage",
  title: "Our Work Page",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({ name: "lead", title: "Lead", type: "text", rows: 2 }),
  ],
  preview: { prepare: () => ({ title: "Our Work Page" }) },
});
