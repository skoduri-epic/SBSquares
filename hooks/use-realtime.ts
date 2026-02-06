"use client";

import { useEffect } from "react";
import { supabase } from "~/lib/supabase";

/**
 * Subscribe to real-time changes on game-related tables.
 * Calls `onUpdate` whenever any subscribed table changes.
 */
export function useGameRealtime(gameId: string | null, onUpdate: () => void) {
  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "squares", filter: `game_id=eq.${gameId}` },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores", filter: `game_id=eq.${gameId}` },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "digit_assignments", filter: `game_id=eq.${gameId}` },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "draft_order", filter: `game_id=eq.${gameId}` },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, onUpdate]);
}
