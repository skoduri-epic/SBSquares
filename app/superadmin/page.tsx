"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "~/lib/supabase";
import { timeAgo } from "~/lib/utils";
import { MAX_GAMES } from "~/lib/constants";
import type { Game } from "~/lib/types";
import { Lock, Trash2, FlaskConical } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  setup: { label: "Setup", className: "bg-zinc-600/30 text-zinc-300" },
  batch1: { label: "Batch 1", className: "bg-blue-600/30 text-blue-300" },
  batch2: { label: "Batch 2", className: "bg-blue-600/30 text-blue-300" },
  locked: { label: "Locked", className: "bg-amber-600/30 text-amber-300" },
  live: { label: "Live", className: "bg-green-600/30 text-green-300" },
  completed: { label: "Completed", className: "bg-zinc-700/30 text-zinc-500" },
};

interface GameWithCounts extends Game {
  playerCount: number;
  squaresPicked: number;
}

export default function SuperadminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [games, setGames] = useState<GameWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem("superadmin_verified") === "true") {
      setAuthenticated(true);
    }
  }, []);

  const fetchGames = useCallback(async () => {
    setLoading(true);

    const [gamesRes, playersRes, squaresRes] = await Promise.all([
      supabase.from("games").select("*").order("created_at", { ascending: false }),
      supabase.from("players").select("id, game_id"),
      supabase.from("squares").select("game_id").not("player_id", "is", null),
    ]);

    const gamesData = (gamesRes.data ?? []) as Game[];
    const playersData = playersRes.data ?? [];
    const squaresData = squaresRes.data ?? [];

    // Count per game
    const playerCounts: Record<string, number> = {};
    for (const p of playersData) {
      playerCounts[p.game_id] = (playerCounts[p.game_id] ?? 0) + 1;
    }
    const squareCounts: Record<string, number> = {};
    for (const s of squaresData) {
      squareCounts[s.game_id] = (squareCounts[s.game_id] ?? 0) + 1;
    }

    setGames(
      gamesData.map((g) => ({
        ...g,
        playerCount: playerCounts[g.id] ?? 0,
        squaresPicked: squareCounts[g.id] ?? 0,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated) fetchGames();
  }, [authenticated, fetchGames]);

  const verifyPin = useCallback(async (pinValue: string) => {
    if (pinValue.length !== 4) return;

    setPinLoading(true);
    setPinError("");

    try {
      const res = await fetch("/api/superadmin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });
      const data = await res.json();

      if (data.valid) {
        sessionStorage.setItem("superadmin_verified", "true");
        setAuthenticated(true);
      } else {
        setPinError(data.error || "Wrong PIN. Try again.");
        setPin("");
      }
    } catch {
      setPinError("Something went wrong. Try again.");
      setPin("");
    } finally {
      setPinLoading(false);
    }
  }, []);

  async function handleDelete(gameId: string) {
    setDeleting(gameId);
    await supabase.from("games").delete().eq("id", gameId);
    setDeleting(null);
    fetchGames();
  }

  async function toggleSimulation(gameId: string, current: boolean) {
    await supabase.from("games").update({ simulation_enabled: !current }).eq("id", gameId);
    fetchGames();
  }

  function handleLock() {
    sessionStorage.removeItem("superadmin_verified");
    setAuthenticated(false);
    setPin("");
    setPinError("");
  }

  // ── PIN Entry ──
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <h1 className="text-4xl tracking-wider">SUPERADMIN</h1>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <Lock className="inline w-3.5 h-3.5 mr-1" />
              Enter admin PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(val);
                if (val.length === 4) verifyPin(val);
              }}
              placeholder="****"
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] placeholder:tracking-[0.5em] focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              autoFocus
            />
          </div>
          {pinLoading && (
            <p className="text-sm text-muted-foreground text-center mt-3 animate-pulse">
              Verifying...
            </p>
          )}
          {pinError && (
            <p className="text-destructive text-sm text-center mt-3">{pinError}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl tracking-wider">SUPERADMIN</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {games.length} / {MAX_GAMES} games
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLock}>
          <Lock className="size-3.5" />
          Lock
        </Button>
      </div>

      {/* Game List */}
      {loading ? (
        <p className="text-muted-foreground text-center py-12 animate-pulse">
          Loading games...
        </p>
      ) : games.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No games yet.</p>
      ) : (
        <div className="space-y-3">
          {games.map((game) => {
            const status = STATUS_STYLES[game.status] ?? STATUS_STYLES.setup;
            return (
              <div
                key={game.id}
                className="border border-border rounded-lg bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Top row: code + status */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold tracking-wider uppercase">
                        {game.game_code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}
                      >
                        {game.status === "live" && (
                          <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                        )}
                        {status.label}
                      </span>
                    </div>

                    {/* Game name */}
                    <p className="text-sm text-foreground truncate">{game.name}</p>

                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span>Created {timeAgo(game.created_at)}</span>
                      <span>
                        Players: {game.playerCount} / {game.max_players}
                      </span>
                      <span>Squares: {game.squaresPicked} / 100</span>
                      {game.simulation_enabled && (
                        <span className="text-amber-400 font-medium">Sim enabled</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                  {/* Simulation toggle */}
                  <Button
                    variant={game.simulation_enabled ? "default" : "ghost"}
                    size="icon-sm"
                    className={game.simulation_enabled ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "text-muted-foreground hover:text-amber-400"}
                    onClick={() => toggleSimulation(game.id, game.simulation_enabled)}
                    title={game.simulation_enabled ? "Simulation enabled — click to disable" : "Enable simulation"}
                  >
                    <FlaskConical className="size-4" />
                  </Button>

                  {/* Delete button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        disabled={deleting === game.id}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Game?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete game{" "}
                          <span className="font-mono font-semibold text-foreground">
                            {game.game_code}
                          </span>{" "}
                          and all its players, squares, and scores.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleDelete(game.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
