import { NextResponse } from "next/server";
import { readShared } from "../adminStore";

// Resolve a share link → the shared deck, for the live-view / shared-edit page.
// GET /api/shared?deck=<id>&s=<token>. No sign-in required (the token is the
// capability); the server (Admin SDK) verifies it and returns the deck only when
// the token matches the deck's current share token (so rotating the link revokes
// old URLs). Returns { access:"view"|"edit", name, doc } or 403 { access:"none" }.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deck = searchParams.get("deck");
  const token = searchParams.get("s");
  if (!deck) return NextResponse.json({ access: "none" }, { status: 400 });
  const res = await readShared(deck, token);
  if (!res || res.access === "none" || !res.doc) {
    return NextResponse.json({ access: "none" }, { status: 403 });
  }
  return NextResponse.json({ access: res.access, name: res.name, doc: res.doc });
}
