import { NextResponse } from "next/server";
import { relayLive } from "../../adminStore";

// POST /api/shared/live?deck=<id>&s=<token> — the live-sync relay for ANONYMOUS
// share-link editors (no Firebase account). One round-trip: publish my cursor +
// ops, receive the room's presence + new ops. Authorised purely by the share token
// (resolveShared → must grant edit), mirroring /api/shared's token-as-capability
// model. Body: { sessionId, presence?, ops?, since?, leave? }.
export const maxDuration = 15;

export async function POST(request) {
  const url = new URL(request.url);
  const deck = url.searchParams.get("deck");
  const s = url.searchParams.get("s");
  if (!deck || !s) return NextResponse.json({ ok: false, error: "deck + token required" }, { status: 400 });

  let body = {};
  try { body = await request.json(); } catch (e) { /* empty poll is valid */ }
  if (!body || !body.sessionId) return NextResponse.json({ ok: false, error: "sessionId required" }, { status: 400 });

  const res = await relayLive(deck, s, body);
  if (!res.ok) return NextResponse.json({ ok: false, access: res.access || "none" }, { status: res.access === "view" ? 403 : 404 });
  return NextResponse.json(res);
}
