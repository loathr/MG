import { NextResponse } from "next/server";
import { verifyIdentity } from "../../_auth";
import { accessStatus } from "../../adminStore";

// GET /api/access/status — the signed-in account's OWN access status
// (approved | pending | denied | none), folding the allow-list in so an
// allow-listed email reads "approved" even before any request doc exists. Drives
// the sign-in screen: approved → enter, pending/denied → status note, none →
// request form. Identity-only (a not-yet-allowed account can read its own status).
export async function GET(request) {
  const id = await verifyIdentity(request);
  if (!id.ok) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  if (!id.gated) return NextResponse.json({ status: "approved" });

  const res = await accessStatus(id.uid, id.email);
  return NextResponse.json(res);
}
