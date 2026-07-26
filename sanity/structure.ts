import type { StructureResolver } from "sanity/structure";

// Custom desk: Site Settings is a singleton (one document, no list), Projects and
// Posts are ordinary collections.
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Site Settings")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings")
        ),
      S.listItem()
        .title("About Page")
        .id("aboutPage")
        .child(S.document().schemaType("aboutPage").documentId("aboutPage")),
      S.listItem()
        .title("What We Do Page")
        .id("whatWeDoPage")
        .child(S.document().schemaType("whatWeDoPage").documentId("whatWeDoPage")),
      S.listItem()
        .title("Newsletter Page")
        .id("newsletterPage")
        .child(S.document().schemaType("newsletterPage").documentId("newsletterPage")),
      S.listItem()
        .title("Contact Page")
        .id("contactPage")
        .child(S.document().schemaType("contactPage").documentId("contactPage")),
      S.divider(),
      S.documentTypeListItem("project").title("Projects"),
      S.documentTypeListItem("post").title("Posts"),
    ]);
