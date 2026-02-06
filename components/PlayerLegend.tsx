"use client";

import { useState } from "react";
import { useGameContext } from "./GameProvider";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "~/lib/utils";

export function PlayerLegend() {
  const { players, squares } = useGameContext();
  const [expanded, setExpanded] = useState(false);

  // Count squares per player
  const squareCounts = new Map<string, number>();
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const pid = squares[r][c].player_id;
      if (pid) {
        squareCounts.set(pid, (squareCounts.get(pid) ?? 0) + 1);
      }
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span>Players ({players.length})</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all",
          expanded ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
          {players.map((player) => (
            <div key={player.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: player.color }}
              />
              <span className="text-xs truncate">{player.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {squareCounts.get(player.id) ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
