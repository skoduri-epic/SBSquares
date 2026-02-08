"use client";

import { cn } from "~/lib/utils";
import { getPlayerInitials } from "~/lib/game-logic";
import type { Square, Player } from "~/lib/types";
import { Trophy } from "lucide-react";


interface GridCellProps {
  square: Square;
  player: Player | null;
  isAvailable: boolean;
  isMyTurn: boolean;
  isMine: boolean;
  isTentative: boolean;
  tentativeIndex: number | null; // 1-based pick number badge
  isWinner: boolean;
  isRunnerUp: boolean;
  isLiveWinner: boolean;
  isLiveRunnerUp: boolean;
  liveQuarter: number | null;
  isDark: boolean;
  winnerQuarters?: string[];
  runnerUpQuarters?: string[];
  onPick?: () => void;
}

export function GridCell({
  square,
  player,
  isAvailable,
  isMyTurn,
  isMine,
  isTentative,
  tentativeIndex,
  isWinner,
  isRunnerUp,
  isLiveWinner,
  isLiveRunnerUp,
  liveQuarter,
  isDark,
  winnerQuarters,
  runnerUpQuarters,
  onPick,
}: GridCellProps) {
  // Can pick if: empty and my turn, OR tentative replacement (my turn + clicking non-mine empty)
  const canPick = isMyTurn && onPick && (!player || (isTentative && isMine));
  const isTentativeMine = isTentative && isMine;
  const isTentativeOther = isTentative && !isMine;

  return (
    <button
      onClick={canPick || (isAvailable && isMyTurn && onPick) ? onPick : undefined}
      disabled={!(canPick || (isAvailable && isMyTurn && onPick))}
      aria-label={
        player
          ? `Square ${square.row_pos},${square.col_pos} ${isTentative ? "tentatively " : ""}claimed by ${player.name}`
          : `Square ${square.row_pos},${square.col_pos} available`
      }
      className={cn(
        "relative flex items-center justify-center text-[9px] sm:text-xs font-semibold rounded-md transition-all duration-200",
        "size-[calc((100vw-7rem)/11)] sm:size-10 md:size-[52px]",
        // Hover elevation (EventOS pattern)
        "hover:shadow-md hover:-translate-y-0.5",
        // Empty/available
        !player && !isMyTurn && "border border-dashed border-border/40 bg-muted/20",
        // Pickable (empty + my turn)
        !player && isMyTurn && onPick && "border-2 border-dashed border-primary/60 bg-primary/10 cursor-pointer cell-available hover:bg-primary/20 hover:border-primary hover:shadow-lg hover:-translate-y-1",
        // Tentative mine: pulsing ring
        isTentativeMine && "border-2 ring-2 ring-accent/60 animate-pulse cursor-pointer",
        // Tentative other: dashed border
        isTentativeOther && "border-2 border-dashed",
        // Confirmed mine (not tentative)
        player && isMine && !isTentative && "border-[3px]",
        // Confirmed others (not tentative)
        player && !isMine && !isTentative && "border border-transparent",
        // Winner
        isWinner && "cell-winner ring-2 ring-winner z-10",
        // Runner-up
        isRunnerUp && "ring-2 ring-runner-up z-10",
        // Live pulsing (in-progress quarter — can overlay confirmed winners from earlier quarters)
        isLiveWinner && "cell-live-winner z-10",
        isLiveRunnerUp && "cell-live-runner-up z-10"
      )}
      style={
        player
          ? {
              backgroundColor: isTentativeMine
                ? player.color + (isDark ? "50" : "25")
                : isTentativeOther
                  ? player.color + (isDark ? "20" : "10")
                  : player.color + (isMine ? (isDark ? "70" : "30") : (isDark ? "35" : "20")),
              borderColor: isTentativeMine
                ? player.color
                : isTentativeOther
                  ? player.color + "60"
                  : isMine && isDark ? player.color : player.color + (isMine ? "80" : (isDark ? "60" : "50")),
              ...(isMine && isDark && !isTentative && !isWinner && !isRunnerUp && !isLiveWinner && !isLiveRunnerUp
                ? { boxShadow: `0 0 6px ${player.color}50, inset 0 0 4px ${player.color}20` }
                : {}),
            }
          : undefined
      }
    >
      {player && (
        <span
          className={cn("font-bold leading-none", isTentativeOther && "opacity-50")}
          style={{ color: player.color }}
        >
          {getPlayerInitials(player.name)}
        </span>
      )}
      {/* Tentative pick number badge */}
      {isTentativeMine && tentativeIndex !== null && (
        <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-accent text-accent-foreground px-1 rounded-full font-bold leading-tight z-20">
          {tentativeIndex}
        </span>
      )}
      {isWinner && (
        <Trophy className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 text-winner z-20" />
      )}
      {isWinner && winnerQuarters && winnerQuarters.length > 0 && (
        <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-winner text-black px-1 rounded-full font-bold leading-tight z-20">
          {winnerQuarters.join(" ")}
        </span>
      )}
      {isRunnerUp && runnerUpQuarters && runnerUpQuarters.length > 0 && (
        <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-runner-up text-black px-1 rounded-full font-bold leading-tight z-20">
          {runnerUpQuarters.join(" ")}
        </span>
      )}
      {(isLiveWinner || isLiveRunnerUp) && (
        <span
          className={cn(
            "absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] px-1 rounded-full font-bold leading-tight z-20 animate-pulse uppercase tracking-wider",
            isLiveWinner ? "bg-winner text-black" : "bg-runner-up text-black"
          )}
        >
          LIVE
        </span>
      )}
    </button>
  );
}
