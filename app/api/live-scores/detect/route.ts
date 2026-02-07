import { NextResponse } from "next/server";
import { detectSuperBowlEvent } from "~/lib/espn";

/**
 * POST /api/live-scores/detect
 * Auto-detect the ESPN event ID for the Super Bowl.
 * Body: { teamRow: string, teamCol: string, date?: string (YYYYMMDD) }
 * Returns: { eventId, homeTeam, awayTeam } or { error }
 */
export async function POST(request: Request) {
  try {
    const { teamRow, teamCol, date } = await request.json();

    if (!teamRow || !teamCol) {
      return NextResponse.json(
        { success: false, error: "teamRow and teamCol are required" },
        { status: 400 }
      );
    }

    const result = await detectSuperBowlEvent(teamRow, teamCol, date);

    if (!result) {
      return NextResponse.json({
        success: false,
        error: "Could not auto-detect the game. Please enter the ESPN event ID manually.",
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Detect Super Bowl error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Detection failed",
      },
      { status: 500 }
    );
  }
}
