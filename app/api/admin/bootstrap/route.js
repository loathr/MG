import { NextResponse } from "next/server";
import { verifyRequest, unauthorized } from "../../_auth";
import { isBootstrapAdmin } from "../../authCore";
import { setUserRole } from "../../adminStore";

// One-time self-promote for the FIRST admin (the chicken-and-egg escape: assigning
// admin needs an admin, but none exists yet). The app calls this AUTOMATICALLY once
// after sign-in, so no console snippet is needed. It promotes the caller to admin
// ONLY when their server-VERIFIED uid matches BOOTSTRAP_ADMIN_UID (a server-only env
// var) and they aren't already admin. Anyone else → { promoted:false } (a cheap
// no-op). Idempotent. Close the escape entirely by removing BOOTSTRAP_ADMIN_UID once
// you're set — the route then promotes nobody, ever.
export async function POST(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return unauthorized(auth.reason);
  // Gate off (open app) → no bootstrap concept; already admin → nothing to do; not
  // the bootstrap uid → decline. Only the exact BOOTSTRAP_ADMIN_UID gets promoted.
  if (!auth.gated || auth.role === "admin" || !isBootstrapAdmin(auth.uid)) {
    return NextResponse.json({ promoted: false, role: auth.role || null });
  }
  const ok = await setUserRole(auth.uid, "admin");
  return NextResponse.json({ promoted: ok, role: ok ? "admin" : auth.role });
}
