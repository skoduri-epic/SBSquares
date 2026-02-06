"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { GameProvider, useGameContext } from "~/components/GameProvider";
import { supabase } from "~/lib/supabase";
import { generateDraftOrder, generateDigitPermutation, calculateQuarterResult, pickRandomSquares, getPlayerInitials } from "~/lib/game-logic";
import type { Quarter } from "~/lib/types";
import { PLAYER_COLORS } from "~/lib/types";
import { cn } from "~/lib/utils";
import { ArrowLeft, Play, Shuffle, Eye, EyeOff, Trophy, UserCheck, RotateCcw, Trash2, Pencil, Shield, ShieldCheck, Plus, X, Users, Copy, Check } from "lucide-react";
import { setSession } from "~/hooks/use-game";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
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

export default function AdminPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  return (
    <GameProvider gameId={gameId}>
      <AdminView gameId={gameId} />
    </GameProvider>
  );
}

function AdminView({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { game, players, squares, scores, digitAssignments, draftOrder, session, reload } = useGameContext();
  const [loading, setLoading] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPin, setEditPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [editError, setEditError] = useState("");
  const [editingGameCode, setEditingGameCode] = useState(false);
  const [gameCodeInput, setGameCodeInput] = useState("");
  const [gameCodeError, setGameCodeError] = useState("");
  const [editingTeam, setEditingTeam] = useState<"row" | "col" | null>(null);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [teamNameError, setTeamNameError] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPin, setNewPlayerPin] = useState("");
  const [addPlayerError, setAddPlayerError] = useState("");
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkResult, setBulkResult] = useState<{ name: string; pin: string; color: string }[] | null>(null);
  const [bulkCopied, setBulkCopied] = useState(false);

  if (!game || !session?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Admin access required</p>
      </div>
    );
  }

  const batch = game.status === "batch1" ? 1 : game.status === "batch2" ? 2 : null;
  const batchOrder = draftOrder
    .filter((d) => d.batch === batch)
    .sort((a, b) => a.pick_order - b.pick_order);
  const currentPicker = batchOrder.find((d) => d.picks_remaining > 0);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const batch1Order = draftOrder.filter((d) => d.batch === 1).sort((a, b) => a.pick_order - b.pick_order);
  const batch2Order = draftOrder.filter((d) => d.batch === 2).sort((a, b) => a.pick_order - b.pick_order);

  async function startBatch(batchNum: 1 | 2) {
    setLoading(`batch${batchNum}`);
    try {
      const order = generateDraftOrder(players.map((p) => p.id));
      const draftEntries = order.map((playerId, i) => ({
        game_id: game!.id,
        batch: batchNum,
        player_id: playerId,
        pick_order: i + 1,
        picks_remaining: 5,
      }));

      await supabase.from("draft_order").insert(draftEntries);
      await supabase
        .from("games")
        .update({ status: batchNum === 1 ? "batch1" : "batch2" })
        .eq("id", game!.id);

      reload();
    } catch (err) {
      console.error("Start batch failed:", err);
    } finally {
      setLoading("");
    }
  }

  async function pickOnBehalf(playerId: string) {
    if (!batch) return;
    const draft = batchOrder.find((d) => d.player_id === playerId);
    if (!draft || draft.picks_remaining <= 0) return;

    setLoading(`pick-${playerId}`);
    try {
      const picks = pickRandomSquares(squares, draft.picks_remaining);
      for (const pick of picks) {
        await supabase
          .from("squares")
          .update({
            player_id: playerId,
            batch,
            picked_at: new Date().toISOString(),
          })
          .eq("game_id", game!.id)
          .eq("row_pos", pick.row)
          .eq("col_pos", pick.col)
          .is("player_id", null);
      }

      await supabase
        .from("draft_order")
        .update({ picks_remaining: 0 })
        .eq("game_id", game!.id)
        .eq("batch", batch)
        .eq("player_id", playerId);

      reload();
    } catch (err) {
      console.error("Pick on behalf failed:", err);
    } finally {
      setLoading("");
    }
  }

  async function revealDigits() {
    setLoading("reveal");
    try {
      const rowDigits = generateDigitPermutation();
      const colDigits = generateDigitPermutation();

      const assignments = [
        ...rowDigits.map((digit, pos) => ({
          game_id: game!.id,
          axis: "row" as const,
          position: pos,
          digit,
        })),
        ...colDigits.map((digit, pos) => ({
          game_id: game!.id,
          axis: "col" as const,
          position: pos,
          digit,
        })),
      ];

      await supabase.from("digit_assignments").insert(assignments);
      await supabase
        .from("games")
        .update({ status: "locked" })
        .eq("id", game!.id);

      reload();
    } catch (err) {
      console.error("Reveal failed:", err);
    } finally {
      setLoading("");
    }
  }

  async function goLive() {
    setLoading("live");
    try {
      await supabase
        .from("games")
        .update({ status: "live" })
        .eq("id", game!.id);
      reload();
    } catch (err) {
      console.error("Go live failed:", err);
    } finally {
      setLoading("");
    }
  }

  async function resetGame() {
    setLoading("reset");
    try {
      await supabase.from("scores").delete().eq("game_id", game!.id);
      await supabase.from("digit_assignments").delete().eq("game_id", game!.id);
      await supabase.from("draft_order").delete().eq("game_id", game!.id);
      await supabase
        .from("squares")
        .update({ player_id: null, batch: null, picked_at: null })
        .eq("game_id", game!.id);
      await supabase
        .from("games")
        .update({ status: "setup" })
        .eq("id", game!.id);
      reload();
    } catch (err) {
      console.error("Reset game failed:", err);
    } finally {
      setLoading("");
    }
  }

  async function clearPlayerPicks(playerId: string) {
    setLoading(`clear-${playerId}`);
    try {
      await supabase
        .from("squares")
        .update({ player_id: null, batch: null, picked_at: null })
        .eq("game_id", game!.id)
        .eq("player_id", playerId);

      if (batch) {
        await supabase
          .from("draft_order")
          .update({ picks_remaining: 5 })
          .eq("game_id", game!.id)
          .eq("batch", batch)
          .eq("player_id", playerId);
      }

      reload();
    } catch (err) {
      console.error("Clear picks failed:", err);
    } finally {
      setLoading("");
    }
  }

  function startEditingPlayer(player: { id: string; name: string; pin: string }) {
    setEditingPlayer(player.id);
    setEditName(player.name);
    setEditPin(player.pin ?? "");
    setShowPin(false);
    setEditError("");
  }

  function cancelEditingPlayer() {
    setEditingPlayer(null);
    setEditError("");
  }

  async function savePlayer(playerId: string) {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError("Name cannot be empty");
      return;
    }
    if (!/^\d{4}$/.test(editPin)) {
      setEditError("PIN must be exactly 4 digits");
      return;
    }
    const duplicate = players.find(
      (p) => p.id !== playerId && p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setEditError("Name already taken by another player");
      return;
    }

    setLoading(`edit-${playerId}`);
    setEditError("");
    try {
      const { error } = await supabase
        .from("players")
        .update({ name: trimmedName, pin: editPin })
        .eq("id", playerId);
      if (error) {
        setEditError(error.message);
        return;
      }
      if (session && playerId === session.playerId) {
        setSession({ ...session, playerName: trimmedName });
      }
      setEditingPlayer(null);
      reload();
    } catch (err) {
      console.error("Save player failed:", err);
      setEditError("Failed to save");
    } finally {
      setLoading("");
    }
  }

  function startEditingGameCode() {
    setGameCodeInput(game!.game_code);
    setGameCodeError("");
    setEditingGameCode(true);
  }

  async function saveGameCode() {
    const code = gameCodeInput.trim().toUpperCase();
    if (!code) {
      setGameCodeError("Game code cannot be empty");
      return;
    }
    if (code.length < 3 || code.length > 10) {
      setGameCodeError("Code must be 3-10 characters");
      return;
    }
    if (!/^[A-Z0-9]+$/.test(code)) {
      setGameCodeError("Only letters and numbers allowed");
      return;
    }
    if (code === game!.game_code) {
      setEditingGameCode(false);
      return;
    }

    setLoading("game-code");
    setGameCodeError("");
    try {
      const { error } = await supabase
        .from("games")
        .update({ game_code: code })
        .eq("id", game!.id);
      if (error) {
        if (error.message.includes("unique") || error.message.includes("duplicate")) {
          setGameCodeError("This code is already in use");
        } else {
          setGameCodeError(error.message);
        }
        return;
      }
      setEditingGameCode(false);
      reload();
    } catch (err) {
      console.error("Save game code failed:", err);
      setGameCodeError("Failed to save");
    } finally {
      setLoading("");
    }
  }

  function startEditingTeam(axis: "row" | "col") {
    setTeamNameInput(axis === "row" ? game!.team_row : game!.team_col);
    setTeamNameError("");
    setEditingTeam(axis);
  }

  async function saveTeamName() {
    const name = teamNameInput.trim();
    if (!name) {
      setTeamNameError("Team name cannot be empty");
      return;
    }
    if (name.length > 30) {
      setTeamNameError("Max 30 characters");
      return;
    }
    const field = editingTeam === "row" ? "team_row" : "team_col";
    const currentValue = editingTeam === "row" ? game!.team_row : game!.team_col;
    if (name === currentValue) {
      setEditingTeam(null);
      return;
    }

    setLoading("team-name");
    setTeamNameError("");
    try {
      const { error } = await supabase
        .from("games")
        .update({ [field]: name })
        .eq("id", game!.id);
      if (error) {
        setTeamNameError(error.message);
        return;
      }
      setEditingTeam(null);
      reload();
    } catch (err) {
      console.error("Save team name failed:", err);
      setTeamNameError("Failed to save");
    } finally {
      setLoading("");
    }
  }

  async function toggleAdmin(playerId: string, currentIsAdmin: boolean) {
    setLoading(`admin-${playerId}`);
    try {
      await supabase
        .from("players")
        .update({ is_admin: !currentIsAdmin })
        .eq("id", playerId);
      reload();
    } catch (err) {
      console.error("Toggle admin failed:", err);
    } finally {
      setLoading("");
    }
  }

  function getNextColor(): string {
    const usedColors = new Set(players.map((p) => p.color));
    for (const c of PLAYER_COLORS) {
      if (!usedColors.has(c)) return c;
    }
    return PLAYER_COLORS[players.length % PLAYER_COLORS.length];
  }

  async function addPlayer() {
    const name = newPlayerName.trim();
    const pin = newPlayerPin.trim();
    if (!name) {
      setAddPlayerError("Name cannot be empty");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setAddPlayerError("PIN must be exactly 4 digits");
      return;
    }
    if (players.length >= 10) {
      setAddPlayerError("Maximum 10 players per game");
      return;
    }
    const duplicate = players.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      setAddPlayerError("Name already taken");
      return;
    }

    setLoading("add-player");
    setAddPlayerError("");
    try {
      const { error } = await supabase.from("players").insert({
        game_id: game!.id,
        name,
        pin,
        is_admin: false,
        color: getNextColor(),
      });
      if (error) {
        setAddPlayerError(error.message);
        return;
      }
      setAddingPlayer(false);
      setNewPlayerName("");
      setNewPlayerPin("");
      reload();
    } catch (err) {
      console.error("Add player failed:", err);
      setAddPlayerError("Failed to add player");
    } finally {
      setLoading("");
    }
  }

  function generatePin(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  async function bulkAddPlayers() {
    setBulkError("");
    // Parse names from text: split by newline or comma
    const raw = bulkText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (raw.length === 0) {
      setBulkError("Enter at least one player name");
      return;
    }

    // Deduplicate within the input list
    const seen = new Set<string>();
    const names: string[] = [];
    for (const n of raw) {
      const key = n.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(n);
    }

    // Check against existing players
    const existingNames = new Set(players.map((p) => p.name.toLowerCase()));
    const dupes = names.filter((n) => existingNames.has(n.toLowerCase()));
    if (dupes.length > 0) {
      setBulkError(`Already exist: ${dupes.join(", ")}`);
      return;
    }

    // Check max 10 total
    const slotsAvailable = 10 - players.length;
    if (names.length > slotsAvailable) {
      setBulkError(`Only ${slotsAvailable} slot${slotsAvailable !== 1 ? "s" : ""} available (${players.length} of 10 used)`);
      return;
    }

    setLoading("bulk-add");
    try {
      // Build player records with sequential colors
      const usedColors = new Set(players.map((p) => p.color));
      let colorIdx = 0;
      const records: { name: string; pin: string; color: string }[] = [];
      for (const name of names) {
        // Find next available color
        while (colorIdx < PLAYER_COLORS.length && usedColors.has(PLAYER_COLORS[colorIdx])) {
          colorIdx++;
        }
        const color = colorIdx < PLAYER_COLORS.length
          ? PLAYER_COLORS[colorIdx]
          : PLAYER_COLORS[(players.length + records.length) % PLAYER_COLORS.length];
        usedColors.add(color);
        colorIdx++;
        const pin = generatePin();
        records.push({ name, pin, color });
      }

      const { error } = await supabase.from("players").insert(
        records.map((r) => ({
          game_id: game!.id,
          name: r.name,
          pin: r.pin,
          is_admin: false,
          color: r.color,
        }))
      );

      if (error) {
        setBulkError(error.message);
        return;
      }

      // Show summary with PINs
      setBulkResult(records);
      setBulkText("");
      reload();
    } catch (err) {
      console.error("Bulk add failed:", err);
      setBulkError("Failed to add players");
    } finally {
      setLoading("");
    }
  }

  function copyBulkResult() {
    if (!bulkResult) return;
    const text = bulkResult
      .map((r) => `${r.name}: PIN ${r.pin}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2000);
  }

  async function removePlayer(playerId: string) {
    setLoading(`remove-${playerId}`);
    try {
      await supabase.from("players").delete().eq("id", playerId);
      reload();
    } catch (err) {
      console.error("Remove player failed:", err);
    } finally {
      setLoading("");
    }
  }

  // Count squares per player
  const squareCounts = new Map<string, number>();
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const pid = squares[r][c].player_id;
      if (pid) squareCounts.set(pid, (squareCounts.get(pid) ?? 0) + 1);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push(`/game/${gameId}`)}
            className="p-1.5 rounded-lg hover:bg-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg tracking-wider">ADMIN</h1>
          <span className="text-xs bg-secondary px-2 py-0.5 rounded ml-auto">
            {game.status}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Game Settings */}
        <section className="bg-card border border-border rounded-lg p-4 space-y-2">
          <h2 className="text-xl tracking-wider">Game Settings</h2>
          {editingGameCode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-20">Code</span>
                <input
                  type="text"
                  value={gameCodeInput}
                  onChange={(e) => setGameCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                  className="flex-1 bg-input border border-border rounded px-3 py-1.5 text-sm font-mono uppercase tracking-wider"
                  maxLength={10}
                />
                <button
                  onClick={saveGameCode}
                  disabled={loading === "game-code"}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading === "game-code" ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingGameCode(false)}
                  className="text-muted-foreground hover:text-foreground rounded px-2 py-1.5 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
              {gameCodeError && (
                <p className="text-[11px] text-destructive pl-20">{gameCodeError}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-20">Code</span>
              <span className="font-mono text-sm tracking-wider">{game.game_code}</span>
              <button
                onClick={startEditingGameCode}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                title="Edit game code"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Team Row name */}
          {editingTeam === "row" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-20">Team Row</span>
                <input
                  type="text"
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value.slice(0, 30))}
                  className="flex-1 bg-input border border-border rounded px-3 py-1.5 text-sm"
                  maxLength={30}
                  autoFocus
                />
                <button
                  onClick={saveTeamName}
                  disabled={loading === "team-name"}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading === "team-name" ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingTeam(null)}
                  className="text-muted-foreground hover:text-foreground rounded px-2 py-1.5 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
              {teamNameError && (
                <p className="text-[11px] text-destructive pl-20">{teamNameError}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-20">Team Row</span>
              <span className="text-sm">{game.team_row}</span>
              {["setup", "batch1", "batch2"].includes(game.status) && (
                <button
                  onClick={() => startEditingTeam("row")}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit team row name"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Team Col name */}
          {editingTeam === "col" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-20">Team Col</span>
                <input
                  type="text"
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value.slice(0, 30))}
                  className="flex-1 bg-input border border-border rounded px-3 py-1.5 text-sm"
                  maxLength={30}
                  autoFocus
                />
                <button
                  onClick={saveTeamName}
                  disabled={loading === "team-name"}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading === "team-name" ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingTeam(null)}
                  className="text-muted-foreground hover:text-foreground rounded px-2 py-1.5 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
              {teamNameError && (
                <p className="text-[11px] text-destructive pl-20">{teamNameError}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-20">Team Col</span>
              <span className="text-sm">{game.team_col}</span>
              {["setup", "batch1", "batch2"].includes(game.status) && (
                <button
                  onClick={() => startEditingTeam("col")}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit team column name"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </section>

        {/* Game Controls */}
        <section className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-xl tracking-wider">Game Controls</h2>

          {game.status === "setup" && (
            <button
              onClick={() => startBatch(1)}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {loading === "batch1" ? "Starting..." : "Start Batch 1"}
            </button>
          )}

          {game.status === "batch1" && (() => {
            const allBatch1Done = batchOrder.length > 0 && batchOrder.every(d => d.picks_remaining === 0);
            const remaining = batchOrder.filter(d => d.picks_remaining > 0).length;
            return (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  {allBatch1Done
                    ? "All Batch 1 picks complete. Ready to start Batch 2."
                    : `Batch 1 in progress... ${remaining} player${remaining !== 1 ? "s" : ""} still picking.`}
                </p>
                <button
                  onClick={() => startBatch(2)}
                  disabled={!!loading || !allBatch1Done}
                  className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50"
                >
                  <Shuffle className="w-4 h-4" />
                  {loading === "batch2" ? "Starting..." : "Start Batch 2"}
                </button>
              </div>
            );
          })()}

          {game.status === "batch2" && (() => {
            const allBatch2Done = batchOrder.length > 0 && batchOrder.every(d => d.picks_remaining === 0);
            const remaining = batchOrder.filter(d => d.picks_remaining > 0).length;
            return (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  {allBatch2Done
                    ? "All Batch 2 picks complete. Ready to reveal numbers."
                    : `Batch 2 in progress... ${remaining} player${remaining !== 1 ? "s" : ""} still picking.`}
                </p>
                <button
                  onClick={revealDigits}
                  disabled={!!loading || !allBatch2Done}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  {loading === "reveal" ? "Revealing..." : "Reveal Numbers"}
                </button>
              </div>
            );
          })()}

          {game.status === "locked" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Numbers revealed! Ready to go live.
              </p>
              <button
                onClick={goLive}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {loading === "live" ? "Going live..." : "Go Live"}
              </button>
            </div>
          )}

          {/* Reset Game */}
          <div className="border-t border-border pt-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {loading === "reset" ? "Resetting..." : "Reset Game"}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all picks, draft orders, digit assignments, and scores.
                    The game will return to setup status. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={resetGame}>
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        {/* Draft Status - Compact Icon Rows */}
        {(batch1Order.length > 0 || batch2Order.length > 0) && (
          <section className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h2 className="text-xl tracking-wider">Draft Order</h2>
            <TooltipProvider>
              {batch1Order.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Batch 1</span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {batch1Order.map((d) => {
                      const p = playerMap.get(d.player_id);
                      if (!p) return null;
                      const isDone = d.picks_remaining === 0;
                      const isActiveBatch = game.status === "batch1";
                      const isCurrent = isActiveBatch && d.player_id === currentPicker?.player_id;
                      const canPickFor = isActiveBatch && !isDone;
                      const status = isDone ? "Done" : isCurrent ? "Picking..." : "Waiting";

                      return (
                        <Tooltip key={d.player_id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={canPickFor ? () => pickOnBehalf(d.player_id) : undefined}
                              disabled={!canPickFor || loading === `pick-${d.player_id}`}
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0",
                                isDone && "opacity-60",
                                isCurrent && "ring-2 ring-accent animate-pulse",
                                !isDone && !isCurrent && "opacity-30",
                                canPickFor && "cursor-pointer hover:opacity-100 hover:scale-110",
                                !canPickFor && "cursor-default",
                              )}
                              style={{ backgroundColor: p.color, color: "#fff" }}
                            >
                              {loading === `pick-${d.player_id}` ? "..." : getPlayerInitials(p.name)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{p.name} - {status}</p>
                            {canPickFor && <p className="text-muted-foreground">Click to pick for</p>}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              )}

              {batch2Order.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Batch 2</span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {batch2Order.map((d) => {
                      const p = playerMap.get(d.player_id);
                      if (!p) return null;
                      const isDone = d.picks_remaining === 0;
                      const isActiveBatch = game.status === "batch2";
                      const isCurrent = isActiveBatch && d.player_id === currentPicker?.player_id;
                      const canPickFor = isActiveBatch && !isDone;
                      const status = isDone ? "Done" : isCurrent ? "Picking..." : "Waiting";

                      return (
                        <Tooltip key={d.player_id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={canPickFor ? () => pickOnBehalf(d.player_id) : undefined}
                              disabled={!canPickFor || loading === `pick-${d.player_id}`}
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0",
                                isDone && "opacity-60",
                                isCurrent && "ring-2 ring-accent animate-pulse",
                                !isDone && !isCurrent && "opacity-30",
                                canPickFor && "cursor-pointer hover:opacity-100 hover:scale-110",
                                !canPickFor && "cursor-default",
                              )}
                              style={{ backgroundColor: p.color, color: "#fff" }}
                            >
                              {loading === `pick-${d.player_id}` ? "..." : getPlayerInitials(p.name)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{p.name} - {status}</p>
                            {canPickFor && <p className="text-muted-foreground">Click to pick for</p>}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              )}
            </TooltipProvider>
          </section>
        )}

        {/* Score Entry */}
        {(game.status === "live" || game.status === "completed") && (
          <ScoreEntry gameId={gameId} />
        )}

        {/* Player List with square counts */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-xl tracking-wider mb-3">Players</h2>
          <div className="space-y-2">
            {players.map((p) => {
              const count = squareCounts.get(p.id) ?? 0;
              const isEditing = editingPlayer === p.id;

              if (isEditing) {
                return (
                  <div key={p.id} className="space-y-2 bg-secondary/30 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm min-w-0"
                      />
                      <div className="relative flex-shrink-0">
                        <input
                          type={showPin ? "text" : "password"}
                          value={editPin}
                          onChange={(e) => setEditPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="PIN"
                          inputMode="numeric"
                          maxLength={4}
                          className="w-20 bg-input border border-border rounded px-2 py-1 pr-7 text-sm tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    {editError && (
                      <p className="text-[11px] text-destructive pl-5">{editError}</p>
                    )}
                    <div className="flex items-center gap-2 pl-5">
                      <button
                        onClick={() => savePlayer(p.id)}
                        disabled={loading === `edit-${p.id}`}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {loading === `edit-${p.id}` ? "..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEditingPlayer}
                        className="text-muted-foreground hover:text-foreground rounded px-2 py-1 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="flex-1">{p.name}</span>
                  {p.is_admin && (
                    <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {count} sq
                  </span>
                  <button
                    onClick={() => startEditingPlayer(p)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    title={`Edit ${p.name}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {session?.playerId !== p.id && (
                    <button
                      onClick={() => toggleAdmin(p.id, p.is_admin)}
                      disabled={loading === `admin-${p.id}`}
                      className={cn(
                        "flex items-center gap-1 text-[10px] transition-colors disabled:opacity-50",
                        p.is_admin
                          ? "text-accent hover:text-destructive"
                          : "text-muted-foreground hover:text-accent"
                      )}
                      title={p.is_admin ? `Remove admin from ${p.name}` : `Make ${p.name} admin`}
                    >
                      {loading === `admin-${p.id}` ? "..." : p.is_admin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {count > 0 && ["setup", "batch1", "batch2"].includes(game.status) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={loading === `clear-${p.id}`}
                          className="flex items-center gap-1 text-[10px] text-destructive hover:bg-destructive/10 px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
                          title={`Clear picks for ${p.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          {loading === `clear-${p.id}` ? "..." : "Clear"}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear {p.name}'s picks?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove all {count} square{count !== 1 ? "s" : ""} picked by {p.name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => clearPlayerPicks(p.id)}>
                            Clear Picks
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {game.status === "setup" && count === 0 && session?.playerId !== p.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={loading === `remove-${p.id}`}
                          className="flex items-center text-[10px] text-destructive/60 hover:text-destructive transition-colors disabled:opacity-50"
                          title={`Remove ${p.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {p.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove {p.name} from the game.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => removePlayer(p.id)}>
                            Remove Player
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              );
            })}
          </div>
          {/* Bulk add result summary */}
          {bulkResult && (
            <div className="mt-3 space-y-2 bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">
                  Added {bulkResult.length} player{bulkResult.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={copyBulkResult}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {bulkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {bulkCopied ? "Copied" : "Copy All"}
                </button>
              </div>
              <div className="space-y-1">
                {bulkResult.map((r) => (
                  <div key={r.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="flex-1 text-foreground">{r.name}</span>
                    <span className="font-mono text-muted-foreground tabular-nums">PIN {r.pin}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setBulkResult(null)}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Single add player form */}
          {addingPlayer && (
            <div className="mt-3 space-y-2 bg-secondary/30 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: getNextColor() }}
                />
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm min-w-0"
                  autoFocus
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPlayerPin}
                  onChange={(e) => setNewPlayerPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="PIN"
                  className="w-20 bg-input border border-border rounded px-2 py-1 text-sm tabular-nums"
                />
                <button
                  onClick={addPlayer}
                  disabled={loading === "add-player"}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {loading === "add-player" ? "..." : "Add"}
                </button>
                <button
                  onClick={() => { setAddingPlayer(false); setAddPlayerError(""); setNewPlayerName(""); setNewPlayerPin(""); }}
                  className="text-muted-foreground hover:text-foreground rounded px-2 py-1 text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
              {addPlayerError && (
                <p className="text-[11px] text-destructive pl-5">{addPlayerError}</p>
              )}
            </div>
          )}

          {/* Bulk add form */}
          {bulkAdding && (
            <div className="mt-3 space-y-2 bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Enter player names, one per line or comma-separated. PINs will be auto-generated.
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Alice\nBob\nCharlie"}
                rows={4}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm resize-none"
                autoFocus
              />
              {bulkError && (
                <p className="text-[11px] text-destructive">{bulkError}</p>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setBulkAdding(false); setBulkError(""); setBulkText(""); }}
                  className="text-muted-foreground hover:text-foreground rounded px-3 py-1 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={bulkAddPlayers}
                  disabled={loading === "bulk-add"}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {loading === "bulk-add" ? "Adding..." : "Add All"}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!addingPlayer && !bulkAdding && !bulkResult && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => { setAddingPlayer(true); setAddPlayerError(""); setBulkAdding(false); }}
                disabled={players.length >= 10}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60 hover:border-border rounded-lg py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                {players.length >= 10 ? "Max 10" : "Add Player"}
              </button>
              <button
                onClick={() => { setBulkAdding(true); setBulkError(""); setAddingPlayer(false); }}
                disabled={players.length >= 10}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60 hover:border-border rounded-lg py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Users className="w-3.5 h-3.5" />
                {players.length >= 10 ? "Max 10" : "Bulk Add"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ScoreEntry({ gameId }: { gameId: string }) {
  const { game, scores, players, squares, digitAssignments, reload } = useGameContext();
  const [loading, setLoading] = useState<string | null>(null);
  const [editingQuarter, setEditingQuarter] = useState<Quarter | null>(null);
  const [scoreInputs, setScoreInputs] = useState<
    Record<string, { row: string; col: string }>
  >({
    Q1: { row: "", col: "" },
    Q2: { row: "", col: "" },
    Q3: { row: "", col: "" },
    Q4: { row: "", col: "" },
  });

  if (!game) return null;

  const existingQuarters = new Set(scores.map((s) => s.quarter));
  const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
  const playerMap = new Map(players.map((p) => [p.id, p]));

  async function submitScore(quarter: Quarter) {
    const input = scoreInputs[quarter];
    const rowScore = parseInt(input.row, 10);
    const colScore = parseInt(input.col, 10);

    if (isNaN(rowScore) || isNaN(colScore)) return;

    const isEditing = existingQuarters.has(quarter);

    setLoading(quarter);
    try {
      const result = calculateQuarterResult(
        rowScore,
        colScore,
        squares,
        digitAssignments,
        playerMap,
        game!.prize_per_quarter
      );

      if (isEditing) {
        await supabase.from("scores").delete().eq("game_id", game!.id).eq("quarter", quarter);
      }

      await supabase.from("scores").insert({
        game_id: game!.id,
        quarter,
        team_row_score: rowScore,
        team_col_score: colScore,
        winner_player_id: result.winnerPlayerId,
        runner_up_player_id: result.runnerUpPlayerId,
        winner_prize: result.winnerPrize,
        runner_up_prize: result.runnerUpPrize,
      });

      if (quarter === "Q4") {
        await supabase
          .from("games")
          .update({ status: "completed" })
          .eq("id", game!.id);
      }

      setEditingQuarter(null);
      reload();
    } catch (err) {
      console.error("Score submit failed:", err);
    } finally {
      setLoading(null);
    }
  }

  function startEditing(quarter: Quarter, rowScore: number, colScore: number) {
    setScoreInputs((s) => ({
      ...s,
      [quarter]: { row: String(rowScore), col: String(colScore) },
    }));
    setEditingQuarter(quarter);
  }

  function cancelEditing() {
    setEditingQuarter(null);
  }

  async function resetScore(quarter: Quarter) {
    setLoading(quarter);
    try {
      await supabase.from("scores").delete().eq("game_id", game!.id).eq("quarter", quarter);
      if (game!.status === "completed") {
        await supabase.from("games").update({ status: "live" }).eq("id", game!.id);
      }
      reload();
    } catch (err) {
      console.error("Reset score failed:", err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="bg-card border border-border rounded-lg p-4 space-y-4">
      <h2 className="text-xl tracking-wider flex items-center gap-2">
        <Trophy className="w-5 h-5 text-winner" />
        Score Entry
      </h2>

      {quarters.map((q) => {
        const existing = scores.find((s) => s.quarter === q);
        if (existing && editingQuarter !== q) {
          const winner = existing.winner_player_id
            ? playerMap.get(existing.winner_player_id)
            : null;
          const runnerUp = existing.runner_up_player_id
            ? playerMap.get(existing.runner_up_player_id)
            : null;
          return (
            <div key={q} className="text-sm opacity-60 space-y-0.5">
              <div className="flex items-center gap-3">
                <span className="font-medium w-8">{q}</span>
                <span className="tabular-nums">
                  {existing.team_row_score} – {existing.team_col_score}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => startEditing(q, existing.team_row_score, existing.team_col_score)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    title={`Edit ${q} scores`}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={loading === q}
                        className="flex items-center gap-1 text-[10px] text-destructive/60 hover:text-destructive transition-colors disabled:opacity-50"
                        title={`Reset ${q} score`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset {q} score?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the score and winner/runner-up for this quarter.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => resetScore(q)}>
                          Reset Score
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-8">
                {winner && (
                  <span className="flex items-center gap-1 text-xs text-winner">
                    <Trophy className="w-3 h-3" />
                    {winner.name} ${existing.winner_prize}
                  </span>
                )}
                {runnerUp && (
                  <span className="text-xs text-runner-up">
                    2nd {runnerUp.name} ${existing.runner_up_prize}
                  </span>
                )}
              </div>
            </div>
          );
        }

        if (existing && editingQuarter === q) {
          return (
            <div key={q} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm w-8">{q}</span>
                <input
                  type="number"
                  placeholder={game!.team_row}
                  value={scoreInputs[q].row}
                  onChange={(e) =>
                    setScoreInputs((s) => ({
                      ...s,
                      [q]: { ...s[q], row: e.target.value },
                    }))
                  }
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm tabular-nums"
                  min={0}
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="number"
                  placeholder={game!.team_col}
                  value={scoreInputs[q].col}
                  onChange={(e) =>
                    setScoreInputs((s) => ({
                      ...s,
                      [q]: { ...s[q], col: e.target.value },
                    }))
                  }
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm tabular-nums"
                  min={0}
                />
                <button
                  onClick={() => submitScore(q)}
                  disabled={loading === q || !scoreInputs[q].row || !scoreInputs[q].col}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-30"
                >
                  {loading === q ? "..." : "Save"}
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-muted-foreground hover:text-foreground rounded-lg px-2 py-2 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        }

        const disabled = existingQuarters.size < quarters.indexOf(q);
        return (
          <div key={q} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm w-8">{q}</span>
              <input
                type="number"
                placeholder={game!.team_row}
                value={scoreInputs[q].row}
                onChange={(e) =>
                  setScoreInputs((s) => ({
                    ...s,
                    [q]: { ...s[q], row: e.target.value },
                  }))
                }
                disabled={disabled}
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm tabular-nums disabled:opacity-30"
                min={0}
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="number"
                placeholder={game!.team_col}
                value={scoreInputs[q].col}
                onChange={(e) =>
                  setScoreInputs((s) => ({
                    ...s,
                    [q]: { ...s[q], col: e.target.value },
                  }))
                }
                disabled={disabled}
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm tabular-nums disabled:opacity-30"
                min={0}
              />
              <button
                onClick={() => submitScore(q)}
                disabled={
                  disabled ||
                  loading === q ||
                  !scoreInputs[q].row ||
                  !scoreInputs[q].col
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-30"
              >
                {loading === q ? "..." : "Save"}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
