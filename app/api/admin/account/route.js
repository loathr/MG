import { NextResponse } from "next/server";
import { verifyRequest, unauthorized, forbidden } from "../../_auth";
import { isBootstrapAdmin } from "../../authCore";
import { setUserDisabled, deleteAccount } from "../../adminStore";

// Admin-only: account lifecycle actions the console can't do via role/limit —
// `disable` / `enable` (reversible; blocks sign-in via the Firebase Auth disabled
// flag) and `delete` (permanent: the Auth user + optionally all their Firestore
// data). Self-target is refused so an admin can't lock themselves out. Every
// /api/admin/* route re-checks admin (never trusts the client). See CLOUD_SETUP.md.
const ACTIONS = { disable: 1, enable: 1, delete: 1 };

export async function POST(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return auth.forbidden ? forbidden(auth.reason) : unauthorized(auth.reason);
  if (auth.gated && auth.role !== "admin" && !isBootstrapAdmin(auth.uid)) return forbidden("Admin only.");

  let body = {};
  try { body = await request.json(); } catch (e) { /* validate below */ }
  const uid = body && body.uid;
  const action = body && body.action;
  if (!uid || !ACTIONS[action]) {
    return NextResponse.json({ error: "A target uid and action (disable|enable|delete) are required." }, { status: 400 });
  }
  // Footgun guard: never let an admin disable or delete their OWN account.
  if (auth.gated && auth.uid && uid === auth.uid) {
    return forbidden("You can't suspend or remove your own account.");
  }

  try {
    const ok = action === "delete"
      ? await deleteAccount(uid, body.deleteDecks !== false)
      : await setUserDisabled(uid, action === "disable");
    return NextResponse.json({ ok, uid, action });
  } catch (e) {
    return NextResponse.json({ error: (e && e.message) || "Account action failed." }, { status: 500 });
  }
}
