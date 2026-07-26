import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Manual exit from draft-mode preview.
export async function GET(req: NextRequest) {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL("/", req.url));
}
