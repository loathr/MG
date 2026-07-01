import { NextResponse } from "next/server";
import { verifyRequest, unauthorized, forbidden } from "../../_auth";
import { setUserRole } from "../../adminStore";
import { ROLES } from "../../../studio/authority";

// Admin-only: assign an account's role (viewer / editor / admin). The role is a
// custom claim on the target's Firebase token (the authority the gate + rules
// read), mirrored to users/{uid}.role. Bootstrap: the very first admin can't be
// set by an admin (none exists yet), so a caller whose uid matches
// BOOTSTRAP_ADMIN_UID is allowed to self-promote once. See docs/CLOUD_SETUP.md.
export async function POST(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return unauthorized(auth.reason);

  const isBootstrap = !!(auth.uid && process.env.BOOTSTRAP_ADMIN_UID && auth.uid === process.env.BOOTSTRAP_ADMIN_UID);
  if (auth.gated && auth.role !== "admin" && !isBootstrap) return forbidden("Admin only.");

  let body = {};
  try { body = await request.json(); } catch (e) { /* fall through to validation */ }
  const uid = body && body.uid;
  const role = body && body.role;
  if (!uid || !ROLES.includes(role)) {
    return NextResponse.json({ error: "A target uid and a valid role (viewer|editor|admin) are required." }, { status: 400 });
  }

  const ok = await setUserRole(uid, role);
  // The target must refresh their ID token (sign out/in, or getIdToken(true)) for
  // the new claim to take effect.
  return NextResponse.json({ ok, uid, role });
}
