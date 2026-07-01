import { NextResponse } from "next/server";
import { verifyRequest, unauthorized, forbidden } from "../../_auth";
import { isBootstrapAdmin } from "../../authCore";
import { readAnyDeck } from "../../adminStore";

// Admin-only: open ANY user's deck read-only for the "All decks" viewer. The
// admin's authority IS the capability here (no share token) — so this re-verifies
// admin on every call, exactly like the other /api/admin/* routes, and never
// trusts the client. Returns { name, doc }; 404 { doc:null } when the deck is
// gone. GET /api/admin/deck?uid=<ownerUid>&deck=<deckId>. See CLOUD_SETUP.md.
export async function GET(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return unauthorized(auth.reason);
  if (auth.gated && auth.role !== "admin" && !isBootstrapAdmin(auth.uid)) return forbidden("Admin only.");

  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const deck = searchParams.get("deck");
  if (!uid || !deck) {
    return NextResponse.json({ error: "An owner uid and deck id are required." }, { status: 400 });
  }
  const res = await readAnyDeck(uid, deck);
  if (!res || !res.doc) return NextResponse.json({ doc: null }, { status: 404 });
  return NextResponse.json({ name: res.name, doc: res.doc });
}
