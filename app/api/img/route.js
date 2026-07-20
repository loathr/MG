import { NextResponse } from "next/server";
import { isProxyableImageUrl } from "../../studio/imgproxy";

// Same-origin image proxy for PNG export. The export canvas can only draw a
// cross-origin photo when its host sends CORS headers; many don't, so those slides
// export blank. This fetches the photo server-side (no CORS constraint) and streams
// the bytes back from our own origin, where the canvas can always draw them.
//
// Image-only and SSRF-guarded: http(s) public hosts only (isProxyableImageUrl), the
// response must actually be an image, and it's size- and time-capped.
const MAX_BYTES = 12 * 1024 * 1024;   // 12 MB — well above any slide photo
const TIMEOUT_MS = 8000;

export async function GET(request) {
  const u = new URL(request.url).searchParams.get("u");
  if (!u || !isProxyableImageUrl(u)) {
    return NextResponse.json({ error: "bad or disallowed url" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(u, {
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "image/*", "User-Agent": "LOATHR-Studio/export" },
    });
    if (!r.ok) return NextResponse.json({ error: "upstream " + r.status }, { status: 502 });

    const ct = (r.headers.get("content-type") || "").toLowerCase();
    if (!ct.startsWith("image/")) {
      return NextResponse.json({ error: "not an image" }, { status: 415 });
    }
    const declared = Number(r.headers.get("content-length") || 0);
    if (declared && declared > MAX_BYTES) {
      return NextResponse.json({ error: "too large" }, { status: 413 });
    }

    const buf = await r.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "too large" }, { status: 413 });
    }
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Length": String(buf.byteLength),
      },
    });
  } catch (e) {
    const aborted = e && e.name === "AbortError";
    return NextResponse.json({ error: aborted ? "timeout" : "fetch failed" }, { status: aborted ? 504 : 502 });
  } finally {
    clearTimeout(timer);
  }
}
