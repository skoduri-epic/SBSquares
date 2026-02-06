"use client";

import { useGameContext } from "./GameProvider";
import { TeamLogo } from "./TeamLogo";
import { cn } from "~/lib/utils";

export function ScoreBoard() {
  const { game, scores } = useGameContext();

  if (!game) return null;

  const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;
  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;
  const currentQuarter = latestScore?.quarter ?? null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between">
        {/* Team Row (Seahawks) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <TeamLogo teamName={game.team_row} className="w-10 h-10 sm:w-12 sm:h-12" />
            <h3 className="text-lg sm:text-2xl tracking-wider text-[color:var(--seahawks-accent)]">
              {game.team_row}
            </h3>
          </div>
          <p className="text-2xl sm:text-4xl font-bold tabular-nums">
            {latestScore?.team_row_score ?? 0}
          </p>
        </div>

        {/* Quarter indicator */}
        <div className="flex flex-col items-center px-4">
          <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            {game.status === "completed" ? "Final" : game.status === "live" ? "Live" : "Pre-game"}
          </span>
          <div className="flex gap-1">
            {quarters.map((q) => {
              const hasScore = scores.some((s) => s.quarter === q);
              const isCurrent = currentQuarter === q && game.status === "live";
              return (
                <span
                  key={q}
                  className={cn(
                    "text-[10px] sm:text-xs px-1.5 py-0.5 rounded",
                    hasScore && "bg-primary/20 text-primary",
                    isCurrent && "bg-accent text-accent-foreground",
                    !hasScore && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {q}
                </span>
              );
            })}
          </div>
        </div>

        {/* Team Col (Patriots) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-2xl tracking-wider text-[color:var(--patriots-accent)]">
              {game.team_col}
            </h3>
            <TeamLogo teamName={game.team_col} className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <p className="text-2xl sm:text-4xl font-bold tabular-nums">
            {latestScore?.team_col_score ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
