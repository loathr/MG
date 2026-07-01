import { NextResponse } from "next/server";
import { verifyRequest, unauthorized, forbidden } from "../../_auth";
import { listAccounts, listAllDecks } from "../../adminStore";
import { usagePeriodKey } from "../../../studio/authority";
import { workspaceTotals } from "../../../studio/adminModel";
import { isBootstrapAdmin } from "../../authCore";

// Admin-only: the whole admin-console payload — every account (role + monthly
// limit + this-month usage), every deck's metadata, the current usage period, and
// the headline totals. Same admin gate as /api/admin/role (with the
// BOOTSTRAP_ADMIN_UID escape for the very first admin). Editors/viewers get 403.
export async function GET(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return unauthorized(auth.reason);
  if (auth.gated && auth.role !== "admin" && !isBootstrapAdmin(auth.uid)) return forbidden("Admin only.");

  const nowMs = Date.now();
  const [accounts, decks] = await Promise.all([listAccounts(nowMs), listAllDecks()]);
  return NextResponse.json({ accounts, decks, period: usagePeriodKey(nowMs), totals: workspaceTotals(accounts) });
}
