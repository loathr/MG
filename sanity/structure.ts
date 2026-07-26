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
      S.divider(),
      S.documentTypeListItem("project").title("Projects"),
      S.documentTypeListItem("post").title("Posts"),
    ]);
