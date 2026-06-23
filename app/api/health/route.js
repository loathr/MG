import { NextResponse } from "next/server";

// Liveness probe. GET handlers default to dynamic since Next 15, but pin it
// explicitly so the check always executes at request time (never prerendered,
// even if Cache Components is enabled later).
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
