// Centralized Anthropic API config + handling.
//
// The key and (optional) base URL are resolved here so every route that talks
// to Claude — /api/generate and /api/script — shares one source of truth for
// the endpoint, the version header, and the "not configured" behavior. Before
// this, each route hardcoded `https://api.anthropic.com/v1/messages` and read
// the key inline, so ANTHROPIC_BASE_URL (set in the environment) was silently
// ignored and the two routes could drift apart.
//
// ANTHROPIC_BASE_URL lets you point the key at a gateway/proxy or a
// region-specific endpoint; it defaults to the public Anthropic API.

export const ANTHROPIC_VERSION = "2023-06-01";

const DEFAULT_BASE_URL = "https://api.anthropic.com";

// Trim trailing slashes so `base + "/v1/messages"` never doubles up.
function normalizeBaseUrl(raw) {
  const base = (raw || "").trim() || DEFAULT_BASE_URL;
  return base.replace(/\/+$/, "");
}

// Resolved at call time (NOT module load) so a key added to the environment
// after a warm start is still picked up, and so nothing is captured into a build.
export function getAnthropicConfig() {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  const baseUrl = normalizeBaseUrl(process.env.ANTHROPIC_BASE_URL);
  return {
    apiKey,
    baseUrl,
    messagesUrl: baseUrl + "/v1/messages",
    configured: Boolean(apiKey),
  };
}

export function anthropicHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
  };
}
