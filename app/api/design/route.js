import { NextResponse } from "next/server";
import { verifyRequest, unauthorized, forbidden, quotaExceeded } from "../_auth";
import { meterGenerate } from "../adminStore";

// POST /api/design — turn a short design description into a small, structured
// "design spec" (palette + fonts) the client folds onto the deck brand
// (design.designBrand → store.applyDesign). Auth-gated + metered like /api/generate
// (it calls the model, so it counts against the monthly limit). The APPLICATION of
// the spec is deterministic + undoable client-side; only producing it is AI.
export const maxDuration = 60;

const SPEC_HEX = /^#[0-9a-fA-F]{6}$/;

// Keep only well-formed fields so a stray model reply can't inject junk into the
// brand. Pure-ish guard.
function sanitizeSpec(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const k of ["accent", "secondary", "bg", "ink"]) if (typeof s[k] === "string" && SPEC_HEX.test(s[k])) out[k] = s[k];
  for (const k of ["labelFont", "headFont", "bodyFont", "wordmark"]) if (typeof s[k] === "string" && s[k].length <= 80) out[k] = s[k].trim();
  return out;
}

export async function POST(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return auth.forbidden ? forbidden(auth.reason) : unauthorized(auth.reason);
  if (auth.gated && auth.uid) {
    const quota = await meterGenerate(auth.uid, Date.now(), auth.role);
    if (!quota.allowed) return quotaExceeded(quota.remaining);
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });

  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
  const prompt = String((body && body.prompt) || "").slice(0, 400).trim();
  if (!prompt) return NextResponse.json({ error: "empty prompt" }, { status: 400 });

  const sys = "You are a brand designer. Given a short look/mood description for an editorial Instagram carousel, reply with ONLY a compact JSON object choosing a palette and type. Keys (all optional, omit rather than guess): accent (#rrggbb), secondary (#rrggbb), bg (#rrggbb, the deck background), ink (#rrggbb, main text), headFont, bodyFont, labelFont (CSS font-family strings from common web/Google fonts). No prose, no code fences.";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-opus-4-8", max_tokens: 400, system: sys,
        messages: [{ role: "user", content: "Look: " + prompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: (data && data.error && data.error.message) || "model error" }, { status: 502 });
    const text = (data.content && data.content[0] && data.content[0].text) || "";
    const m = text.match(/\{[\s\S]*\}/);
    let parsed = null;
    try { parsed = m ? JSON.parse(m[0]) : null; } catch (e) { parsed = null; }
    const spec = sanitizeSpec(parsed);
    if (!Object.keys(spec).length) return NextResponse.json({ error: "couldn't read a design from that" }, { status: 422 });
    return NextResponse.json({ spec });
  } catch (e) {
    return NextResponse.json({ error: (e && e.message) || "design failed" }, { status: 500 });
  }
}
