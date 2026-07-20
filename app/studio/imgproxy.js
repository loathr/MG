// imgproxy.js — the same-origin image proxy contract, shared by the export renderer
// (client, export.js) and the proxy route (server, app/api/img/route.js).
//
// Why it exists: PNG export draws each photo into a <canvas>. A cross-origin photo
// can only be drawn if it loads with CORS (crossOrigin="anonymous" + the host sends
// Access-Control-Allow-Origin); a host that doesn't send it fails to load, so the
// slide exports with a blank/black background. Routing that photo through our own
// origin (/api/img) makes it same-origin — always drawable, never taints the canvas.
//
// Pure + dependency-free so the SSRF allow/deny logic is unit-tested and identical
// on both sides.

// True if `u` is a public http(s) URL we're willing to fetch server-side. Blocks
// loopback / private / link-local / cloud-metadata hosts (SSRF), and non-http
// schemes (data:/blob: never need proxying — they're already same-origin-safe).
export function isProxyableImageUrl(u) {
  let url;
  try { url = new URL(String(u)); } catch (e) { return false; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  let h = url.hostname.toLowerCase();
  if (h.startsWith("[") && h.endsWith("]")) h = h.slice(1, -1); // IPv6 literal
  if (!h || h === "localhost" || h === "0.0.0.0" || h === "::1" || h === "::") return false;
  if (h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (h === "169.254.169.254") return false;                    // cloud metadata endpoint
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return false;      // 172.16–172.31
  if (/^(fc|fd|fe80)/.test(h)) return false;                    // IPv6 ULA / link-local
  return true;
}

// The same-origin URL the client hits to fetch `u` through our proxy.
export function proxyImageUrl(u) {
  return "/api/img?u=" + encodeURIComponent(String(u));
}
