// Central Sanity environment config. Everything here is optional: with no
// project id set, `isSanityConfigured` is false and the site falls back to its
// hardcoded copy (mirroring how the Firebase-unconfigured path degrades). The
// user drops in two env vars — NEXT_PUBLIC_SANITY_PROJECT_ID and (optionally)
// NEXT_PUBLIC_SANITY_DATASET — and editing goes live with no code change.

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";

// True only when a real project id is present. Read paths and the embedded
// Studio both gate on this so an unconfigured deploy never throws.
export const isSanityConfigured = projectId.length > 0;
