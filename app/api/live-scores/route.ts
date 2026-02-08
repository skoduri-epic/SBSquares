import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchESPNScores,
  fetchESPNScoreboard,
  findGameByTeams,
  parseGameScores,
  matchTeamToAxis,
} from "~/lib/espn";
import { calculateQuarterResult } from "~/lib/game-logic";
import type { Square, DigitAssignment, Player, Score, Quarter, LiveQuarterScore } from "~/lib/types";

// Use service-level client for server-side writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { gameId } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: "gameId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch game and verify auto_scores is enabled
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

    if (!game.auto_scores_enabled) {
      return NextResponse.json(
        { success: false, error: "Auto scores not enabled for this game" },
        { status: 400 }
      );
    }

    if (game.status === "completed") {
      return NextResponse.json({
        success: true,
        updated: [],
        gameStatus: "completed",
        nflStatus: "final",
        statusDetail: "Game completed",
      });
    }

    // 2. Fetch ESPN scores
    let espnScores;

    if (game.espn_event_id) {
      espnScores = await fetchESPNScores(game.espn_event_id);
    } else {
      // Auto-detect: search scoreboard for matching team
      const events = await fetchESPNScoreboard();
      const matchedEvent =
        findGameByTeams(events, game.team_row) ||
        findGameByTeams(events, game.team_col);

      if (matchedEvent) {
        // Save the detected event ID for future polls
        await supabase
          .from("games")
          .update({ espn_event_id: matchedEvent.id })
          .eq("id", gameId);

        espnScores = parseGameScores(matchedEvent);
      }
    }

    if (!espnScores) {
      return NextResponse.json({
        success: true,
        updated: [],
        gameStatus: game.status,
        nflStatus: null,
        statusDetail: "No ESPN game found",
      });
    }

    if (espnScores.status === "pregame") {
      // Clear any stale live score during pregame
      if (game.live_quarter_score !== null) {
        await supabase
          .from("games")
          .update({ live_quarter_score: null })
          .eq("id", gameId);
      }
      return NextResponse.json({
        success: true,
        updated: [],
        gameStatus: game.status,
        nflStatus: "pregame",
        statusDetail: espnScores.statusDetail,
      });
    }

    // 3. Map ESPN teams to our row/col axes
    const homeAxis = matchTeamToAxis(
      espnScores.homeTeam,
      espnScores.homeDisplayName,
      espnScores.homeAbbrev,
      game.team_row,
      game.team_col
    );
    const awayAxis = matchTeamToAxis(
      espnScores.awayTeam,
      espnScores.awayDisplayName,
      espnScores.awayAbbrev,
      game.team_row,
      game.team_col
    );

    if (!homeAxis && !awayAxis) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot map ESPN teams to game teams. ESPN: ${espnScores.homeDisplayName} / ${espnScores.awayDisplayName}. Game: ${game.team_row} (row) / ${game.team_col} (col). Make sure team names match.`,
        },
        { status: 400 }
      );
    }

    // 4. Fetch game data needed for winner calculation
    const [squaresRes, digitsRes, playersRes, scoresRes] = await Promise.all([
      supabase.from("squares").select("*").eq("game_id", gameId),
      supabase.from("digit_assignments").select("*").eq("game_id", gameId),
      supabase.from("players").select("*").eq("game_id", gameId),
      supabase.from("scores").select("*").eq("game_id", gameId),
    ]);

    const digitAssignments: DigitAssignment[] = digitsRes.data ?? [];
    const players: Player[] = playersRes.data ?? [];
    const existingScores: Score[] = scoresRes.data ?? [];
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

    // 5. Process each completed quarter
    const updated: string[] = [];
    const existingByQuarter = new Map(existingScores.map((s) => [s.quarter, s]));

    // Calculate prize per quarter from game config
    const pricePerSquare = game.price_per_square ?? 5;
    const totalPot = pricePerSquare * 100;
    const prizeSplit = game.prize_split ?? { q1: 25, q2: 25, q3: 25, q4: 25 };
    const winnerPct = game.winner_pct ?? 80;

    // Helper to map ESPN home/away scores to our row/col
    const getScores = (q: { homeScore: number; awayScore: number }) => {
      if (homeAxis === "row") {
        return { rowScore: q.homeScore, colScore: q.awayScore };
      } else if (homeAxis === "col") {
        return { rowScore: q.awayScore, colScore: q.homeScore };
      } else if (awayAxis === "row") {
        return { rowScore: q.awayScore, colScore: q.homeScore };
      } else {
        // awayAxis === "col"
        return { rowScore: q.homeScore, colScore: q.awayScore };
      }
    };

    for (const q of espnScores.quarters) {
      if (!q.isComplete) continue;

      // Map ESPN scores to row/col based on team mapping
      const { rowScore: teamRowScore, colScore: teamColScore } = getScores(q);

      // Check if this quarter already has the same scores
      const existing = existingByQuarter.get(q.quarter);
      if (
        existing &&
        existing.team_row_score === teamRowScore &&
        existing.team_col_score === teamColScore
      ) {
        continue; // No change needed
      }

      // Calculate winner/runner-up
      const quarterKey = q.quarter.toLowerCase() as "q1" | "q2" | "q3" | "q4";
      const quarterPct = prizeSplit[quarterKey] ?? prizeSplit[q.quarter] ?? 25;
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

      // Upsert: delete existing then insert (matches ScoreEntry pattern)
      if (existing) {
        await supabase
          .from("scores")
          .delete()
          .eq("game_id", gameId)
          .eq("quarter", q.quarter);
      }

      await supabase.from("scores").insert({
        game_id: gameId,
        quarter: q.quarter,
        team_row_score: teamRowScore,
        team_col_score: teamColScore,
        winner_player_id: result.winnerPlayerId,
        runner_up_player_id: result.runnerUpPlayerId,
        winner_prize: result.winnerPrize,
        runner_up_prize: result.runnerUpPrize,
      });

      updated.push(q.quarter);
    }

    // 6. Write live_quarter_score for the current in-progress quarter
    // This enables real-time grid pulsing on the winning square
    let liveQuarterScore: LiveQuarterScore | null = null;

    if (espnScores.status === "live") {
      // Find the current in-progress quarter (has linescore data but not yet complete)
      const inProgressQuarter = espnScores.quarters.find((q) => !q.isComplete);

      if (inProgressQuarter) {
        const { rowScore, colScore } = getScores(inProgressQuarter);
        liveQuarterScore = {
          quarter: espnScores.currentPeriod,
          team_row_score: rowScore,
          team_col_score: colScore,
          status_detail: espnScores.statusDetail,
        };
      }
    }
    // For pregame, halftime, final, or no in-progress quarter: liveQuarterScore stays null

    await supabase
      .from("games")
      .update({ live_quarter_score: liveQuarterScore })
      .eq("id", gameId);

    // 7. If game is final and all 4 quarters are scored, mark completed
    let newGameStatus = game.status;
    if (espnScores.status === "final") {
      const allQuarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
      const scoredQuarters = new Set([
        ...existingScores.map((s) => s.quarter),
        ...updated,
      ]);
      const allScored = allQuarters.every((q) => scoredQuarters.has(q));

      if (allScored && game.status !== "completed") {
        await supabase
          .from("games")
          .update({ status: "completed", live_quarter_score: null })
          .eq("id", gameId);
        newGameStatus = "completed";
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      gameStatus: newGameStatus,
      nflStatus: espnScores.status,
      statusDetail: espnScores.statusDetail,
    });
  } catch (err) {
    console.error("Live scores error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
