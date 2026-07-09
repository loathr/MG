import { NextResponse } from "next/server";
import { verifyRequest, unauthorized, forbidden } from "../../_auth";
import { isBootstrapAdmin } from "../../authCore";
import { listAuditLog } from "../../adminStore";

// Admin-only: the per-generation audit log (recent rows, newest first) for the
// console's Audit tab. Same admin gate as the other /api/admin/* routes. The rows
// carry metadata + a truncated topic label only (see logGeneration) — never the
// uploaded document text or the full prompt.
export async function GET(request) {
  const auth = await verifyRequest(request);
  if (!auth.ok) return auth.forbidden ? forbidden(auth.reason) : unauthorized(auth.reason);
  if (auth.gated && auth.role !== "admin" && !isBootstrapAdmin(auth.uid)) return forbidden("Admin only.");
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const rows = await listAuditLog(limit);
  return NextResponse.json({ rows });
}
