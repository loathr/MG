import { defineType, defineField } from "sanity";

// Singleton: the Insights hero copy. (The articles are separate `post`
// documents.)
export const insightsPage = defineType({
  name: "insightsPage",
  title: "Insights Page",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({ name: "engineNote", title: "Engine note", type: "text", rows: 2, description: 'The pill under the heading. Wrap "loathrdotcom" in the text; it renders bold automatically.' }),
  ],
  preview: { prepare: () => ({ title: "Insights Page" }) },
});
