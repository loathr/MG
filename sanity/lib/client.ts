import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, isSanityConfigured } from "../env";

// Server-only read token. Optional: when present, the site reads authenticated
// (works regardless of dataset visibility); when absent, it reads the public
// CDN. Never prefixed NEXT_PUBLIC — it must stay server-side and never ship to
// the browser. client.ts is imported only by server components, so it doesn't.
const readToken = process.env.SANITY_API_READ_TOKEN;

// Read client for server components. Only instantiated when a project id is
// present; otherwise null, and callers fall back to hardcoded copy.
// `perspective: "published"` guarantees only published docs surface even when a
// token is used (drafts from the Studio never leak onto the live site).
export const client = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: !readToken,
      token: readToken || undefined,
      perspective: "published",
    })
  : null;
