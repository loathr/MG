import { NextResponse } from "next/server";
import { verifyIdentity } from "../../_auth";
import { createAccessRequest } from "../../adminStore";

// POST /api/access/request — a signed-in but NOT-yet-allowed account asks for
// access. Identity-only gate (verifyIdentity): the caller is authenticated but the
// allow-list is deliberately NOT enforced, so an external Google account can lodge
// a pending request an admin then reviews. The only write a guest can make, and
// only to their OWN request doc. Gate off → everyone's already in.
export async function POST(request) {
  const id = await verifyIdentity(request);
  if (!id.ok) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  if (!id.gated) return NextResponse.json({ status: "approved" });

  let body = {};
  try { body = await request.json(); } catch (e) { /* note is optional */ }
  const note = String((body && body.note) || "").slice(0, 500);
  const res = await createAccessRequest(id.uid, { email: id.email, name: id.name, note });
  return NextResponse.json(res);
}
