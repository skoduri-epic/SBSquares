"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "~/lib/supabase";
import { setSession } from "~/hooks/use-game";
import type { Game, Player } from "~/lib/types";
import { PLAYER_COLORS } from "~/lib/types";
import { ArrowLeft, Users, Lock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function JoinPage({
  params,
}: {
  params: Promise<{ gameCode: string }>;
}) {
  const { gameCode } = use(params);
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<"loading" | "form" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadGame() {
      const { data: gameData, error: gameErr } = await supabase
        .from("games")
        .select("*")
        .eq("game_code", gameCode.toUpperCase())
        .single();

      if (gameErr || !gameData) {
        setErrorMessage("Invalid game code. This game does not exist.");
        setStatus("error");
        return;
      }

      const g = gameData as Game;

      if (!g.invite_enabled) {
        setErrorMessage("This game is not accepting new players.");
        setStatus("error");
        return;
      }

      if (!["setup", "batch1", "batch2"].includes(g.status)) {
        setErrorMessage("This game has already started and is no longer accepting new players.");
        setStatus("error");
        return;
      }

      const { data: playerData } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", g.id)
        .order("created_at");

      const pList = (playerData ?? []) as Player[];

      if (pList.length >= g.max_players) {
        setErrorMessage(`This game has reached its player limit (${pList.length}/${g.max_players}).`);
        setStatus("error");
        return;
      }

      setGame(g);
      setPlayers(pList);
      setStatus("form");
    }

    loadGame();
  }, [gameCode]);

  function getNextColor(): string {
    const usedColors = new Set(players.map((p) => p.color));
    for (const c of PLAYER_COLORS) {
      if (!usedColors.has(c)) return c;
    }
    return PLAYER_COLORS[players.length % PLAYER_COLORS.length];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name cannot be empty.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setFormError("PIN must be exactly 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setFormError("PINs do not match.");
      return;
    }

    const duplicate = players.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setFormError("This name is already taken in this game.");
      return;
    }

    if (!game) return;

    setSubmitting(true);
    try {
      // Re-check player count to prevent race conditions
      const { count } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("game_id", game.id);

      if (count !== null && count >= game.max_players) {
        setFormError(`Game is full (${count}/${game.max_players}).`);
        setSubmitting(false);
        return;
      }

      const { data: newPlayer, error: insertErr } = await supabase
        .from("players")
        .insert({
          game_id: game.id,
          name: trimmedName,
          pin,
          is_admin: false,
          color: getNextColor(),
        })
        .select()
        .single();

      if (insertErr) {
        if (insertErr.message.includes("unique") || insertErr.message.includes("duplicate")) {
          setFormError("This name is already taken in this game.");
        } else {
          setFormError(insertErr.message);
        }
        return;
      }

      setSession({
        gameId: game.id,
        gameCode: game.game_code,
        playerId: newPlayer.id,
        playerName: newPlayer.name,
        isAdmin: false,
      });

      router.push(`/game/${game.id}`);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-sm text-destructive">{errorMessage}</p>
          <Link
            href="/"
            className="inline-block text-sm text-primary hover:underline"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl tracking-wider mb-1">JOIN GAME</h1>
          <p className="text-sm text-muted-foreground">{game?.name}</p>
        </div>

        {/* Game info */}
        <div className="bg-card border border-border rounded-lg p-3 mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Game Code</span>
            <span className="font-mono tracking-wider">{game?.game_code}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Teams</span>
            <span>{game?.team_row} vs {game?.team_col}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Players</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {players.length} / {game?.max_players}
            </span>
          </div>
        </div>

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <Lock className="inline w-3.5 h-3.5 mr-1" />
              4-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="****"
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-center text-lg tracking-[0.5em] placeholder:tracking-[0.5em] focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="****"
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-center text-lg tracking-[0.5em] placeholder:tracking-[0.5em] focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          {formError && (
            <p className="text-destructive text-sm text-center">{formError}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "Joining..." : "Join Game"}
          </button>
          <Link
            href="/"
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </form>
      </div>
    </div>
  );
}
