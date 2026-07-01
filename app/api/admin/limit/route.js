import { NextResponse } from "next/server";
import { verifyRequest, unauthorized, forbidden } from "../../_auth";
import { setUserLimit } from "../../adminStore";

// Admin-only: set an account's monthly generation cap (0 = unlimited), stored at
// users/{uid}.limits.monthly and enforced server-side on /api/generate. Same admin
// gate + BOOTSTRAP_ADMIN_UID escape as the role route.
export async function POST(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return unauthorized();
  const isBootstrap = !!(auth.uid && process.env.BOOTSTRAP_ADMIN_UID && auth.uid === process.env.BOOTSTRAP_ADMIN_UID);
  if (auth.gated && auth.role !== "admin" && !isBootstrap) return forbidden("Admin only.");

  let body = {};
  try { body = await request.json(); } catch (e) { /* fall through to validation */ }
  const uid = body && body.uid;
  const monthly = body && body.monthly;
  if (!uid || monthly == null || isNaN(Number(monthly)) || Number(monthly) < 0) {
    return NextResponse.json({ error: "A target uid and a non-negative monthly limit are required." }, { status: 400 });
  }
  const ok = await setUserLimit(uid, monthly);
  return NextResponse.json({ ok, uid, monthly: Math.max(0, Math.floor(Number(monthly))) });
}
