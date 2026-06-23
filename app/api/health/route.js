import { NextResponse } from "next/server";
import { getAnthropicConfig } from "../../lib/anthropic.js";

// Quick keys-status probe. Reports whether each server-side credential is
// CONFIGURED — never the values themselves, and without making any live API
// calls (so it stays fast and can't burn the Unsplash 50/hr budget).
//
// force-dynamic so the handler reads the live environment at request time
// instead of anything that could be baked at build.
export const dynamic = "force-dynamic";

const has = (v) => Boolean((v || "").trim());

export function GET() {
  const anthropic = getAnthropicConfig();

  // Mirror the fallback the image route uses: server key, then NEXT_PUBLIC_*.
  const keys = {
    anthropic: anthropic.configured,
    unsplash: has(process.env.UNSPLASH_KEY) || has(process.env.NEXT_PUBLIC_UNSPLASH_KEY),
    pexels: has(process.env.PEXELS_KEY) || has(process.env.NEXT_PUBLIC_PEXELS_KEY),
    pixabay: has(process.env.PIXABAY_KEY) || has(process.env.NEXT_PUBLIC_PIXABAY_KEY),
  };

  // Invite/admin codes gate /api/verify.
  const access = {
    adminCodes: has(process.env.ADMIN_CODES),
    inviteCodes: has(process.env.INVITE_CODES),
  };

  // Content generation needs Anthropic; image search needs ≥1 provider.
  const imageSearch = keys.unsplash || keys.pexels || keys.pixabay;
  const ready = keys.anthropic && imageSearch;

  return NextResponse.json({
    status: ready ? "ok" : "degraded",
    ready,
    keys,
    access,
    services: {
      contentGeneration: keys.anthropic,
      imageSearch,
    },
    anthropicBaseUrl: anthropic.baseUrl, // non-secret; confirms gateway wiring
    timestamp: new Date().toISOString(),
  });
}
