"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "~/lib/supabase";
import type { Game, Player, Square, DigitAssignment, DraftOrder, Score, Session } from "~/lib/types";

export interface GameState {
  game: Game | null;
  players: Player[];
  squares: Square[][];
  digitAssignments: DigitAssignment[];
  draftOrder: DraftOrder[];
  scores: Score[];
  currentPlayer: Player | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

function emptyGrid(): Square[][] {
  return Array.from({ length: 10 }, (_, r) =>
    Array.from({ length: 10 }, (_, c) => ({
      id: "",
      game_id: "",
      row_pos: r,
      col_pos: c,
      player_id: null,
      batch: null,
      picked_at: null,
      is_tentative: false,
    }))
  );
}

export function useGame(gameId: string | null) {
  const [state, setState] = useState<GameState>({
    game: null,
    players: [],
    squares: emptyGrid(),
    digitAssignments: [],
    draftOrder: [],
    scores: [],
    currentPlayer: null,
    session: null,
    loading: true,
    error: null,
  });

  const loadGame = useCallback(async (isReload = false) => {
    if (!gameId) return;

    try {
      if (!isReload) {
        setState((s) => ({ ...s, loading: true, error: null }));
      }

      const [gameRes, playersRes, squaresRes, digitsRes, draftRes, scoresRes] =
        await Promise.all([
          supabase.from("games").select("*").eq("id", gameId).single(),
          supabase.from("players").select("*").eq("game_id", gameId).order("created_at"),
          supabase.from("squares").select("*").eq("game_id", gameId),
          supabase.from("digit_assignments").select("*").eq("game_id", gameId),
          supabase.from("draft_order").select("*").eq("game_id", gameId).order("pick_order"),
          supabase.from("scores").select("*").eq("game_id", gameId).order("quarter"),
        ]);

      if (gameRes.error) throw gameRes.error;

      // Build 10x10 grid
      const grid = emptyGrid();
      for (const sq of squaresRes.data ?? []) {
        grid[sq.row_pos][sq.col_pos] = sq;
      }

      // Get session from localStorage
      const session = getSession();
      const currentPlayer =
        (playersRes.data ?? []).find((p) => p.id === session?.playerId) ?? null;

      setState({
        game: gameRes.data,
        players: playersRes.data ?? [],
        squares: grid,
        digitAssignments: digitsRes.data ?? [],
        draftOrder: draftRes.data ?? [],
        scores: scoresRes.data ?? [],
        currentPlayer,
        session,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load game",
      }));
    }
  }, [gameId]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const reload = useCallback(() => loadGame(true), [loadGame]);

  return { ...state, reload };
}

// Session helpers
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("sb-squares-session");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session) {
  localStorage.setItem("sb-squares-session", JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem("sb-squares-session");
}
