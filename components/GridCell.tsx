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
  isWinner: boolean;
  isRunnerUp: boolean;
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
  isWinner,
  isRunnerUp,
  isDark,
  winnerQuarters,
  runnerUpQuarters,
  onPick,
}: GridCellProps) {
  const canPick = isAvailable && isMyTurn && onPick;

  return (
    <button
      onClick={canPick ? onPick : undefined}
      disabled={!canPick}
      aria-label={
        player
          ? `Square ${square.row_pos},${square.col_pos} claimed by ${player.name}`
          : `Square ${square.row_pos},${square.col_pos} available`
      }
      className={cn(
        "relative flex items-center justify-center text-[9px] sm:text-xs font-semibold rounded-md transition-all duration-200",
        "size-[calc((100vw-7rem)/11)] sm:size-10 md:size-[52px]",
        // Hover elevation (EventOS pattern)
        "hover:shadow-md hover:-translate-y-0.5",
        // Empty/available
        !player && !canPick && "border border-dashed border-border/40 bg-muted/20",
        // Pickable
        canPick && "border-2 border-dashed border-primary/60 bg-primary/10 cursor-pointer cell-available hover:bg-primary/20 hover:border-primary hover:shadow-lg hover:-translate-y-1",
        // Claimed - mine (thicker border, higher opacity)
        player && isMine && "border-[3px]",
        // Claimed - others
        player && !isMine && "border border-transparent",
        // Winner
        isWinner && "cell-winner ring-2 ring-winner z-10",
        // Runner-up
        isRunnerUp && "ring-2 ring-runner-up z-10"
      )}
      style={
        player
          ? {
              backgroundColor: player.color + (isMine ? (isDark ? "70" : "30") : (isDark ? "35" : "20")),
              borderColor: isMine && isDark ? player.color : player.color + (isMine ? "80" : (isDark ? "60" : "50")),
              ...(isMine && isDark && !isWinner && !isRunnerUp
                ? { boxShadow: `0 0 6px ${player.color}50, inset 0 0 4px ${player.color}20` }
                : {}),
            }
          : undefined
      }
    >
      {player && (
        <span
          className="font-bold leading-none"
          style={{ color: player.color }}
        >
          {getPlayerInitials(player.name)}
        </span>
      )}
      {isWinner && (
        <Trophy className="absolute -top-1 -left-1 w-3 h-3 text-winner z-20" />
      )}
      {isWinner && winnerQuarters && winnerQuarters.length > 0 && (
        <span className="absolute -top-1.5 -right-1.5 text-[7px] sm:text-[8px] bg-winner text-black px-0.5 sm:px-1 rounded-full font-bold leading-tight z-20">
          {winnerQuarters.join(" ")}
        </span>
      )}
      {isRunnerUp && runnerUpQuarters && runnerUpQuarters.length > 0 && (
        <span className="absolute -top-1.5 -right-1.5 text-[7px] sm:text-[8px] bg-runner-up text-black px-0.5 sm:px-1 rounded-full font-bold leading-tight z-20">
          {runnerUpQuarters.join(" ")}
        </span>
      )}
    </button>
  );
}
