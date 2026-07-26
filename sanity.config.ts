"use client";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
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
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
});
