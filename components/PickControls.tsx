"use client";

import { useState, useEffect, useRef } from "react";
import { useGameContext } from "./GameProvider";
import { supabase } from "~/lib/supabase";
import { pickRandomSquares, getPlayerInitials, getDraftConfig } from "~/lib/game-logic";
import { cn } from "~/lib/utils";
import { Shuffle, MousePointer2, Check, Clock, Timer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

interface PickControlsProps {
  onPickingStateChange?: (isManualPicking: boolean) => void;
  isManualPicking?: boolean;
  tentativeQueue?: string[];
  onConfirm?: () => Promise<void>;
  timerSecondsLeft?: number | null;
  maxPicks?: number;
}

export function PickControls({ onPickingStateChange, isManualPicking = false, tentativeQueue, onConfirm, timerSecondsLeft, maxPicks: maxPicksProp }: PickControlsProps) {
  const { game, session, draftOrder, squares, currentPlayer, players, reload } = useGameContext();
  const [mode, setMode] = useState<"choose" | "manual" | null>(null);
  const [loading, setLoading] = useState(false);
  const randomPickRef = useRef(false);

  // Sync internal mode with parent's isManualPicking prop
  useEffect(() => {
    if (isManualPicking) {
      setMode("manual");
    } else if (mode === "manual") {
      setMode(null);
    }
  }, [isManualPicking]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game || !session || !currentPlayer) return null;

  const batch = game.status === "batch1" ? 1 : game.status === "batch2" ? 2 : null;
  if (!batch) return null;

  const isSingleBatch = getDraftConfig(game.max_players ?? 10).batches === 1;
  const batchLabel = isSingleBatch ? "Draft" : `Batch ${batch}`;

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
          {isSingleBatch ? "Draft Order" : `${batchLabel} Draft Order`}
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
              You&apos;ve picked all your squares{!isSingleBatch ? ` for Batch ${batch}` : ""}!
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
    if (randomPickRef.current) return;
    randomPickRef.current = true;
    setLoading(true);
    try {
      const picks = pickRandomSquares(squares, picksRemaining);

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

      setMode(null);
      onPickingStateChange?.(false);
      reload();
    } catch (err) {
      console.error("Random pick failed:", err);
    } finally {
      setLoading(false);
      randomPickRef.current = false;
    }
  }

  function handleManualMode() {
    onPickingStateChange?.(true);
  }

  // Show mode chooser
  if (!mode) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-center mb-3">
          <span className="text-accent font-semibold">Your turn!</span>{" "}
          Pick {picksRemaining} square{picksRemaining !== 1 ? "s" : ""}{!isSingleBatch ? ` for Batch ${batch}` : ""}
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

  // Manual picking mode — floating bottom bar
  // Use maxPicks prop from parent (derived from getDraftConfig) for stable count
  const totalPicks = maxPicksProp ?? picksRemaining;
  const tentativeCount = tentativeQueue?.length ?? 0;
  const allSlotsFilled = tentativeCount >= totalPicks;

  // Format timer as m:ss
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isTimerLow = timerSecondsLeft !== null && timerSecondsLeft !== undefined && timerSecondsLeft <= 30;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm?.();
      setMode(null);
      onPickingStateChange?.(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {/* Pick count */}
        <span className={cn(
          "text-lg font-bold tabular-nums flex-shrink-0",
          allSlotsFilled ? "text-green-500" : "text-accent"
        )}>
          {tentativeCount}/{totalPicks}
        </span>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
          {Array.from({ length: totalPicks }, (_, i) => {
            const isFilled = i < tentativeCount;
            return (
              <span
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200",
                  !isFilled && "border border-muted-foreground/40"
                )}
                style={isFilled ? { backgroundColor: currentPlayer.color } : undefined}
              />
            );
          })}
        </div>

        {/* Timer */}
        {timerSecondsLeft !== null && timerSecondsLeft !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-mono font-bold tabular-nums flex-shrink-0",
            isTimerLow ? "text-red-400 animate-pulse" : "text-muted-foreground"
          )}>
            <Timer className="w-3.5 h-3.5" />
            {formatTimer(timerSecondsLeft)}
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={loading || !allSlotsFilled}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all flex-shrink-0",
            allSlotsFilled
              ? "bg-green-600 hover:bg-green-700 text-white animate-pulse"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Check className="w-4 h-4" />
          {loading ? "..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}
