import { draftMode } from "next/headers";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, isSanityConfigured } from "../env";
import { client } from "./client";

// A second client used only inside the Presentation editor (draft mode): reads
// the "drafts" perspective with a token and stega-encodes results so the visual
// overlay can map a clicked element back to its field (studioUrl = /cms).
const readToken = process.env.SANITY_API_READ_TOKEN;
const draftClient =
  isSanityConfigured && readToken
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: false,
        token: readToken,
        perspective: "drafts",
        stega: {
          enabled: true,
          studioUrl: "/cms",
          // Stega is for DISPLAY TEXT only. Never encode fields used in logic
          // (category → filter buttons, slug) or as URLs (cover/video/image) —
          // the invisible characters would break string matching and media.
          filter: (props) => {
            const path = props.sourcePath || [];
            const last = path[path.length - 1];
            if (typeof last === "string" && (last === "category" || last === "slug" || /url$/i.test(last))) return false;
            if (typeof props.value === "string" && /^https?:\/\//.test(props.value)) return false;
            return props.filterDefault(props);
          },
        },
      })
    : null;

// Env-gated fetch. Returns `fallback` when Sanity isn't configured, and also if
// a query errors or comes back empty — the marketing site must never blank out.
// In Presentation (draft mode) it reads live drafts; otherwise published content
// with a short revalidate.
export async function sanityFetch<T>(
  query: string,
  fallback: T,
  params: Record<string, unknown> = {}
): Promise<T> {
  let isDraft = false;
  try {
    isDraft = (await draftMode()).isEnabled;
  } catch {
    isDraft = false;
  }
  const active = isDraft && draftClient ? draftClient : client;
  if (!active) return fallback;
  try {
    const data = await active.fetch<T>(
      query,
      params,
      isDraft ? { cache: "no-store" } : { next: { revalidate: 60 } }
    );
    if (data == null) return fallback;
    if (Array.isArray(data) && data.length === 0) return fallback;
    return data;
  } catch {
    return fallback;
  }
}
