import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { code } = await request.json();
    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, error: "No code provided" });
    }

    const trimmed = code.trim().toUpperCase();

    // Check admin codes
    const adminCodes = (process.env.ADMIN_CODES || "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (adminCodes.includes(trimmed)) {
      return NextResponse.json({ valid: true, role: "admin" });
    }

    // Check invite codes
    const inviteCodes = (process.env.INVITE_CODES || "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (inviteCodes.includes(trimmed)) {
      return NextResponse.json({ valid: true, role: "limited" });
    }

    return NextResponse.json({ valid: false, error: "Invalid invite code" });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
