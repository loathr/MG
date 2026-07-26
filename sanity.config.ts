"use client";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool, defineLocations } from "sanity/presentation";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";

// Config for the embedded Studio mounted at /cms. `projectId` may be empty when
// the site is deployed without a Sanity project — the /cms route guards on that
// before mounting the Studio, so this module never blows up at import time.
export default defineConfig({
  basePath: "/cms",
  projectId: projectId || "missing-project-id",
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    // Presentation = the live/visual editor: a preview of the site beside the
    // fields, click-to-edit. Draft edits preview via /api/draft-mode/enable.
    presentationTool({
      previewUrl: { previewMode: { enable: "/api/draft-mode/enable" } },
      resolve: {
        locations: {
          siteSettings: defineLocations({
            message: "Home hero, marquee & closing band",
            locations: [{ title: "Home", href: "/" }],
          }),
          project: defineLocations({
            select: { title: "title" },
            resolve: (doc) => ({
              locations: [
                { title: (doc?.title as string) || "Project", href: "/work" },
                { title: "The Gallery", href: "/gallery" },
              ],
            }),
          }),
          post: defineLocations({
            select: { title: "title" },
            resolve: (doc) => ({
              locations: [{ title: (doc?.title as string) || "Post", href: "/insights" }],
            }),
          }),
        },
      },
    }),
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
