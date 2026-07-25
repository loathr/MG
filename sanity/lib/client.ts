import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, isSanityConfigured } from "../env";

// Read-only client for server components. Only instantiated when a project id is
// present; otherwise null, and callers fall back to hardcoded copy. `useCdn` is
// on for fast public reads (published content only).
export const client = isSanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn: true })
  : null;
