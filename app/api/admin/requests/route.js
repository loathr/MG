import { NextResponse } from "next/server";
import { verifyRequest, unauthorized, forbidden } from "../../_auth";
import { isBootstrapAdmin } from "../../authCore";
import { listAccessRequests, decideAccessRequest } from "../../adminStore";

// Admin-only: the access-request queue for the console's Requests tab.
// GET  → every request (pending first, then recently decided).
// POST → approve/deny a request ({ uid, decision:"approve"|"deny", role? }).
//   approve adds the email to the runtime allow-list + sets the role claim; deny
//   just records the denial. Same admin gate as the other /api/admin/* routes
//   (with the BOOTSTRAP_ADMIN_UID escape for the first admin).
export async function GET(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return auth.forbidden ? forbidden(auth.reason) : unauthorized(auth.reason);
  if (auth.gated && auth.role !== "admin" && !isBootstrapAdmin(auth.uid)) return forbidden("Admin only.");
  const requests = await listAccessRequests();
  return NextResponse.json({ requests });
}

export async function POST(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return auth.forbidden ? forbidden(auth.reason) : unauthorized(auth.reason);
  if (auth.gated && auth.role !== "admin" && !isBootstrapAdmin(auth.uid)) return forbidden("Admin only.");

  let body = {};
  try { body = await request.json(); } catch (e) { /* validated below */ }
  const uid = body && body.uid;
  const decision = body && body.decision;
  const role = body && body.role;
  if (!uid || (decision !== "approve" && decision !== "deny")) {
    return NextResponse.json({ error: "A target uid and a decision (approve|deny) are required." }, { status: 400 });
  }
  const res = await decideAccessRequest(uid, decision, role, auth.uid);
  return NextResponse.json(res);
}
