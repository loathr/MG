import { NextResponse } from "next/server";
import { readShared, writeShared } from "../adminStore";

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

// Save a shared EDITOR's changes back to the owner's deck. POST /api/shared?deck=
// <id>&s=<token> with { doc }. The token must grant EDIT (an edit link); the server
// offloads images and writes back. 403 when the token is view/none, so a view link
// can never write. Rotating the link revokes edit access along with view.
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const deck = searchParams.get("deck");
  const token = searchParams.get("s");
  if (!deck) return NextResponse.json({ ok: false }, { status: 400 });
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!body || !body.doc) return NextResponse.json({ ok: false }, { status: 400 });
  const res = await writeShared(deck, token, body.doc);
  if (!res.ok) return NextResponse.json({ ok: false, access: res.access }, { status: 403 });
  return NextResponse.json({ ok: true });
}
