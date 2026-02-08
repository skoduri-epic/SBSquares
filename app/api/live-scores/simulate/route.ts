import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateQuarterResult } from "~/lib/game-logic";
import type { Square, DigitAssignment, Player, Quarter } from "~/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: "gameId is required" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: "action is required" },
        { status: 400 }
      );
    }

    // Fetch the game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    // --- ACTION: set-live ---
    if (action === "set-live") {
      const { quarter, teamRowScore, teamColScore, statusDetail } = body;

      if (quarter == null || teamRowScore == null || teamColScore == null) {
        return NextResponse.json(
          { success: false, error: "quarter, teamRowScore, teamColScore are required for set-live" },
          { status: 400 }
        );
      }

      const liveScore = {
        quarter,
        team_row_score: teamRowScore,
        team_col_score: teamColScore,
        status_detail: statusDetail || "",
      };

      const { error } = await supabase
        .from("games")
        .update({ live_quarter_score: liveScore })
        .eq("id", gameId);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: "set-live", liveScore });
    }

    // --- ACTION: clear ---
    if (action === "clear") {
      const { error } = await supabase
        .from("games")
        .update({ live_quarter_score: null })
        .eq("id", gameId);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: "clear" });
    }

    // --- ACTION: complete-quarter ---
    if (action === "complete-quarter") {
      const { quarter, teamRowScore, teamColScore } = body;

      if (quarter == null || teamRowScore == null || teamColScore == null) {
        return NextResponse.json(
          { success: false, error: "quarter, teamRowScore, teamColScore are required for complete-quarter" },
          { status: 400 }
        );
      }

      // Fetch game data for winner calculation
      const [squaresRes, digitsRes, playersRes] = await Promise.all([
        supabase.from("squares").select("*").eq("game_id", gameId),
        supabase.from("digit_assignments").select("*").eq("game_id", gameId),
        supabase.from("players").select("*").eq("game_id", gameId),
      ]);

      const digitAssignments: DigitAssignment[] = digitsRes.data ?? [];
      const players: Player[] = playersRes.data ?? [];
      const playerMap = new Map(players.map((p) => [p.id, p]));

      // Build 10x10 grid
      const grid: Square[][] = Array.from({ length: 10 }, (_, r) =>
        Array.from({ length: 10 }, (_, c) => ({
          id: "",
          game_id: gameId,
          row_pos: r,
          col_pos: c,
          player_id: null,
          batch: null,
          picked_at: null,
          is_tentative: false,
        }))
      );
      for (const sq of (squaresRes.data ?? []) as Square[]) {
        grid[sq.row_pos][sq.col_pos] = sq;
      }

      // Calculate prize amounts
      const pricePerSquare = game.price_per_square ?? 5;
      const totalPot = pricePerSquare * 100;
      const prizeSplit = game.prize_split ?? { q1: 25, q2: 25, q3: 25, q4: 25 };
      const winnerPct = game.winner_pct ?? 80;
      const quarterKey = `q${quarter}` as "q1" | "q2" | "q3" | "q4";
      const quarterPct = prizeSplit[quarterKey] ?? 25;
      const prizePerQuarter = Math.round((totalPot * quarterPct) / 100);

      const result = calculateQuarterResult(
        teamRowScore,
        teamColScore,
        grid,
        digitAssignments,
        playerMap,
        prizePerQuarter,
        winnerPct
      );

      // Quarter label mapping
      const quarterLabel = `Q${quarter}` as Quarter;

      // Delete existing score for this quarter if any
      await supabase
        .from("scores")
        .delete()
        .eq("game_id", gameId)
        .eq("quarter", quarterLabel);

      // Insert the final score
      await supabase.from("scores").insert({
        game_id: gameId,
        quarter: quarterLabel,
        team_row_score: teamRowScore,
        team_col_score: teamColScore,
        winner_player_id: result.winnerPlayerId,
        runner_up_player_id: result.runnerUpPlayerId,
        winner_prize: result.winnerPrize,
        runner_up_prize: result.runnerUpPrize,
      });

      // Clear live_quarter_score
      await supabase
        .from("games")
        .update({ live_quarter_score: null })
        .eq("id", gameId);

      // If Q4, mark game as completed
      if (quarter === 4) {
        await supabase
          .from("games")
          .update({ status: "completed", live_quarter_score: null })
          .eq("id", gameId);
      }

      return NextResponse.json({
        success: true,
        action: "complete-quarter",
        quarter: quarterLabel,
        result: {
          winnerPlayerId: result.winnerPlayerId,
          runnerUpPlayerId: result.runnerUpPlayerId,
          winnerPrize: result.winnerPrize,
          runnerUpPrize: result.runnerUpPrize,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    console.error("Simulation error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
