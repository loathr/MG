import { client } from "./client";

// Env-gated fetch. Returns `fallback` when Sanity isn't configured, and also if
// a query errors or comes back empty — the marketing site must never blank out
// because the CMS is unreachable. Revalidates on a short interval so edits show
// up without a redeploy.
export async function sanityFetch<T>(
  query: string,
  fallback: T,
  params: Record<string, unknown> = {}
): Promise<T> {
  if (!client) return fallback;
  try {
    const data = await client.fetch<T>(query, params, {
      next: { revalidate: 60 },
    });
    if (data == null) return fallback;
    if (Array.isArray(data) && data.length === 0) return fallback;
    return data;
  } catch {
    return fallback;
  }
}
