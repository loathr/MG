import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { dataset, projectId, isSanityConfigured } from "../env";

const builder = isSanityConfigured
  ? imageUrlBuilder({ projectId, dataset })
  : null;

// Resolve a Sanity image ref to a URL, or return null when unconfigured / unset.
export function urlForImage(source: SanityImageSource | undefined | null) {
  if (!builder || !source) return null;
  return builder.image(source);
}
