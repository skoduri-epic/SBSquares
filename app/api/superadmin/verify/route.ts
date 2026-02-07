import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { pin } = await request.json();
  const superadminPin = process.env.SUPERADMIN_PIN;

  if (!superadminPin) {
    return NextResponse.json(
      { valid: false, error: "Superadmin not configured" },
      { status: 503 }
    );
  }

  return NextResponse.json({ valid: pin === superadminPin });
}
