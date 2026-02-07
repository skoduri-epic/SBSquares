"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "~/lib/supabase";
import { setSession, getSession } from "~/hooks/use-game";
import type { Game, Player } from "~/lib/types";
import { PLAYER_COLORS } from "~/lib/types";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [pin, setPin] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"code" | "player" | "pin" | "create">("code");
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    teamRow: "",
    teamCol: "",
    playerName: "",
    playerPin: "",
    maxPlayers: 10,
    pricePerSquare: 5,
  });

  // Check for existing session
  useEffect(() => {
    const session = getSession();
    if (session) {
      router.push(`/game/${session.gameId}`);
    }
  }, [router]);

  const lookupGame = useCallback(async (code: string) => {
    const trimmed = code.toUpperCase().trim();
    if (trimmed.length < 3) return;

    setError("");
    setLoading(true);

    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("game_code", trimmed)
        .single();

      if (gameError || !gameData) {
        setError("Game not found. Check your code and try again.");
        return;
      }

      setGame(gameData);

      const { data: playerData } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameData.id)
        .order("created_at");

      setPlayers(playerData ?? []);
      setStep("player");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-lookup game code after 600ms pause
  const codeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (step !== "code") return;
    if (codeTimerRef.current) clearTimeout(codeTimerRef.current);
    const trimmed = gameCode.trim();
    if (trimmed.length >= 3) {
      codeTimerRef.current = setTimeout(() => lookupGame(trimmed), 600);
    }
    return () => { if (codeTimerRef.current) clearTimeout(codeTimerRef.current); };
  }, [gameCode, step, lookupGame]);

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (codeTimerRef.current) clearTimeout(codeTimerRef.current);
    lookupGame(gameCode);
  }

  function handlePlayerClick(playerId: string) {
    setSelectedPlayer(playerId);
    setPin("");
    setError("");
    setStep("pin");
  }

  const verifyPin = useCallback(async (pinValue: string) => {
    if (!game || !selectedPlayer || pinValue.length !== 4) return;

    setLoading(true);
    setError("");

    try {
      const { data: player, error: pinError } = await supabase
        .from("players")
        .select("*")
        .eq("id", selectedPlayer)
        .eq("pin", pinValue)
        .single();

      if (pinError || !player) {
        setError("Wrong PIN. Try again.");
        setPin("");
        setLoading(false);
        return;
      }

      setSession({
        gameId: game.id,
        gameCode: game.game_code,
        playerId: player.id,
        playerName: player.name,
        isAdmin: player.is_admin,
      });

      router.push(`/game/${game.id}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [game, selectedPlayer, router]);

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    verifyPin(pin);
  }

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const code = createForm.code.trim().toUpperCase();
    const gameName = createForm.name.trim();
    const teamRow = createForm.teamRow.trim();
    const teamCol = createForm.teamCol.trim();
    const playerName = createForm.playerName.trim();
    const playerPin = createForm.playerPin.trim();

    if (!code || !gameName || !teamRow || !teamCol || !playerName || !playerPin) {
      setError("All fields are required");
      return;
    }
    if (code.length < 3 || code.length > 10 || !/^[A-Z0-9]+$/.test(code)) {
      setError("Game code must be 3-10 alphanumeric characters");
      return;
    }
    if (!/^\d{4}$/.test(playerPin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    setLoading(true);
    try {
      const poolAmount = createForm.pricePerSquare * 100;

      const { data: newGame, error: gameErr } = await supabase
        .from("games")
        .insert({
          game_code: code,
          name: gameName,
          team_row: teamRow,
          team_col: teamCol,
          status: "setup",
          max_players: createForm.maxPlayers,
          price_per_square: createForm.pricePerSquare,
          pool_amount: poolAmount,
          prize_per_quarter: Math.round(poolAmount / 4),
          prize_split: { q1: 25, q2: 25, q3: 25, q4: 25 },
          winner_pct: 80,
          invite_enabled: true,
        })
        .select()
        .single();

      if (gameErr) {
        if (gameErr.message.includes("unique") || gameErr.message.includes("duplicate")) {
          setError("This game code is already taken");
        } else {
          setError(gameErr.message);
        }
        return;
      }

      const { data: newPlayer, error: playerErr } = await supabase
        .from("players")
        .insert({
          game_id: newGame.id,
          name: playerName,
          pin: playerPin,
          is_admin: true,
          color: PLAYER_COLORS[0],
        })
        .select()
        .single();

      if (playerErr) {
        setError(playerErr.message);
        return;
      }

      const squareRows = [];
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          squareRows.push({ game_id: newGame.id, row_pos: r, col_pos: c });
        }
      }
      await supabase.from("squares").insert(squareRows);

      setSession({
        gameId: newGame.id,
        gameCode: newGame.game_code,
        playerId: newPlayer.id,
        playerName: newPlayer.name,
        isAdmin: true,
      });

      router.push(`/game/${newGame.id}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl tracking-wider mb-1">
            SUPER BOWL
          </h1>
          <h2 className="text-5xl sm:text-6xl tracking-widest text-accent">
            SQUARES
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Super Bowl Squares Pool
          </p>
          <Link
            href="/help"
            className="inline-block text-xs text-primary hover:underline mt-1"
          >
            How to Play
          </Link>
        </div>

        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Game Code
              </label>
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                placeholder="Enter game code..."
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-center text-lg tracking-widest uppercase placeholder:text-muted-foreground/50 placeholder:normal-case placeholder:tracking-normal focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                maxLength={10}
                autoFocus
              />
            </div>
            {loading && (
              <p className="text-sm text-muted-foreground text-center animate-pulse">Looking up game...</p>
            )}
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            <button
              type="button"
              onClick={() => { setStep("create"); setError(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              or create a new game
            </button>
          </form>
        )}

        {step === "create" && (
          <form onSubmit={handleCreateGame} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Game Code</label>
              <input
                type="text"
                value={createForm.code}
                onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) }))}
                placeholder="e.g. SB2025"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm tracking-widest uppercase"
                maxLength={10}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Game Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Super Bowl LIX Squares"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Team (Row)</label>
                <input
                  type="text"
                  value={createForm.teamRow}
                  onChange={(e) => setCreateForm((f) => ({ ...f, teamRow: e.target.value }))}
                  placeholder="e.g. Chiefs"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Team (Col)</label>
                <input
                  type="text"
                  value={createForm.teamCol}
                  onChange={(e) => setCreateForm((f) => ({ ...f, teamCol: e.target.value }))}
                  placeholder="e.g. Eagles"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Max Players</label>
                <select
                  value={createForm.maxPlayers}
                  onChange={(e) => setCreateForm((f) => ({ ...f, maxPlayers: Number(e.target.value) }))}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value={5}>5 players</option>
                  <option value={10}>10 players</option>
                  <option value={20}>20 players</option>
                  <option value={25}>25 players</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Price / Square</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={createForm.pricePerSquare}
                    onChange={(e) => setCreateForm((f) => ({ ...f, pricePerSquare: Math.max(0, Number(e.target.value)) }))}
                    className="w-full bg-input border border-border rounded-lg pl-7 pr-3 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Total Pot: <span className="font-semibold text-foreground">${(createForm.pricePerSquare * 100).toFixed(0)}</span>
              {" "}({100 / createForm.maxPlayers} squares/player)
            </p>
            <div className="border-t border-border pt-3 mt-1">
              <p className="text-xs text-muted-foreground mb-2">Your info (game admin)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Your Name</label>
                  <input
                    type="text"
                    value={createForm.playerName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, playerName: e.target.value }))}
                    placeholder="Your name"
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Your PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={createForm.playerPin}
                    onChange={(e) => setCreateForm((f) => ({ ...f, playerPin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="4 digits"
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Game"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("code"); setError(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              or join an existing game
            </button>
          </form>
        )}

        {step === "player" && (
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-1.5">
              Who are you?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePlayerClick(p.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary hover:shadow-md hover:-translate-y-0.5 text-sm font-medium transition-all"
                >
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                  {p.is_admin && (
                    <span className="text-[10px] text-accent ml-auto">
                      Admin
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("code");
                setGame(null);
                setPlayers([]);
                setSelectedPlayer("");
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different code
            </button>
          </div>
        )}

        {step === "pin" && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <div
                className="w-8 h-8 rounded-md mx-auto mb-2"
                style={{
                  backgroundColor: players.find((p) => p.id === selectedPlayer)?.color,
                }}
              />
              <p className="text-sm font-medium">
                {players.find((p) => p.id === selectedPlayer)?.name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                <Lock className="inline w-3.5 h-3.5 mr-1" />
                Enter your 4-digit PIN
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
            {loading && (
              <p className="text-sm text-muted-foreground text-center animate-pulse">Verifying...</p>
            )}
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setStep("player");
                setSelectedPlayer("");
                setPin("");
                setError("");
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Pick a different player
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
