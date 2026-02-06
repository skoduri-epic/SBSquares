"use client";

import { useState } from "react";
import { useGameContext } from "./GameProvider";
import { supabase } from "~/lib/supabase";
import { pickRandomSquares, getPlayerInitials } from "~/lib/game-logic";
import { cn } from "~/lib/utils";
import { Shuffle, MousePointer2, Check, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

interface PickControlsProps {
  onPickingStateChange?: (isManualPicking: boolean) => void;
}

export function PickControls({ onPickingStateChange }: PickControlsProps) {
  const { game, session, draftOrder, squares, currentPlayer, players, reload } = useGameContext();
  const [mode, setMode] = useState<"choose" | "manual" | null>(null);
  const [picksUsed, setPicksUsed] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!game || !session || !currentPlayer) return null;

  const batch = game.status === "batch1" ? 1 : game.status === "batch2" ? 2 : null;
  if (!batch) return null;

  // Build player map for names/colors
  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Find current picker in draft order
  const batchOrder = draftOrder
    .filter((d) => d.batch === batch)
    .sort((a, b) => a.pick_order - b.pick_order);
  const myDraft = batchOrder.find((d) => d.player_id === session.playerId);
  const currentPicker = batchOrder.find((d) => d.picks_remaining > 0);
  const isMyTurn = currentPicker?.player_id === session.playerId;
  const picksRemaining = myDraft?.picks_remaining ?? 0;

  // Draft progress - compact horizontal icon row
  function DraftProgress() {
    return (
      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 text-center">
          Batch {batch} Draft Order
        </p>
        <TooltipProvider>
          <div className="flex flex-wrap gap-2 justify-center">
            {batchOrder.map((d) => {
              const p = playerMap.get(d.player_id);
              if (!p) return null;
              const isDone = d.picks_remaining === 0;
              const isCurrent = d.player_id === currentPicker?.player_id;
              const isMe = d.player_id === session?.playerId;
              const status = isDone ? "Done" : isCurrent ? "Picking..." : "Waiting";

              return (
                <Tooltip key={d.player_id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0",
                        isDone && "opacity-60",
                        isCurrent && "ring-2 ring-accent animate-pulse",
                        !isDone && !isCurrent && "opacity-30",
                      )}
                      style={{ backgroundColor: p.color, color: "#fff" }}
                    >
                      {getPlayerInitials(p.name)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{p.name}{isMe ? " (you)" : ""} - {status}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    );
  }

  if (!isMyTurn || picksRemaining <= 0) {
    const currentPickerPlayer = currentPicker
      ? playerMap.get(currentPicker.player_id)
      : null;

    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-center">
          {picksRemaining <= 0 ? (
            <p className="text-sm text-primary font-medium">
              <Check className="inline w-4 h-4 mr-1" />
              You&apos;ve picked all your squares for Batch {batch}!
            </p>
          ) : currentPickerPlayer ? (
            <p className="text-sm text-muted-foreground">
              <Clock className="inline w-4 h-4 mr-1" />
              Waiting for{" "}
              <span className="font-semibold" style={{ color: currentPickerPlayer.color }}>
                {currentPickerPlayer.name}
              </span>{" "}
              to pick...
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Waiting...</p>
          )}
        </div>
        <DraftProgress />
      </div>
    );
  }

  async function handleRandomPick() {
    setLoading(true);
    try {
      const available = picksRemaining - picksUsed;
      const picks = pickRandomSquares(squares, available);

      for (const pick of picks) {
        await supabase
          .from("squares")
          .update({
            player_id: session!.playerId,
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
        .eq("player_id", session!.playerId);

      setPicksUsed(picksRemaining);
      setMode(null);
      onPickingStateChange?.(false);
      reload();
    } catch (err) {
      console.error("Random pick failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleManualMode() {
    setMode("manual");
    onPickingStateChange?.(true);
  }

  // Show mode chooser
  if (!mode) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-center mb-3">
          <span className="text-accent font-semibold">Your turn!</span>{" "}
          Pick {picksRemaining} squares for Batch {batch}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleRandomPick}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Shuffle className="w-4 h-4" />
            {loading ? "Picking..." : "Random Pick"}
          </button>
          <button
            onClick={handleManualMode}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg px-4 py-3 text-sm font-medium transition-colors"
          >
            <MousePointer2 className="w-4 h-4" />
            Manual Pick
          </button>
        </div>
        <DraftProgress />
      </div>
    );
  }

  // Manual picking mode
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          Tap squares to pick:{" "}
          <span className="font-bold text-accent">{picksUsed}</span> of{" "}
          <span className="font-bold">{picksRemaining}</span>
        </p>
        <button
          onClick={() => {
            setMode(null);
            setPicksUsed(0);
            onPickingStateChange?.(false);
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mt-2">
        <div
          className="bg-accent h-2 rounded-full transition-all"
          style={{ width: `${(picksUsed / picksRemaining) * 100}%` }}
        />
      </div>
    </div>
  );
}
