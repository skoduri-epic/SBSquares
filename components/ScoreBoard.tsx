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

  const liveScore = game.live_quarter_score;

  // Determine display scores: prefer live in-progress score over last confirmed
  const isLiveInProgress = game.status === "live" && liveScore != null;
  const displayRowScore = isLiveInProgress ? liveScore!.team_row_score : (latestScore?.team_row_score ?? 0);
  const displayColScore = isLiveInProgress ? liveScore!.team_col_score : (latestScore?.team_col_score ?? 0);

  // Status text: show ESPN detail when available, otherwise static label
  const statusText = (() => {
    if (game.status === "completed") return "Final";
    if (isLiveInProgress && liveScore?.status_detail) return liveScore.status_detail;
    if (game.status === "live") return "Live";
    return "Pre-game";
  })();

  const isLiveStatus = game.status === "live";

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
          <p
            className={cn(
              "text-2xl sm:text-4xl font-bold tabular-nums",
              isLiveInProgress && "live-score-number text-foreground"
            )}
          >
            {displayRowScore}
          </p>
        </div>

        {/* Quarter indicator */}
        <div className="flex flex-col items-center px-4">
          <span
            className={cn(
              "text-xs uppercase tracking-widest mb-1",
              isLiveInProgress
                ? "text-accent font-semibold"
                : "text-muted-foreground"
            )}
          >
            {statusText}
          </span>
          <div className="flex gap-1">
            {quarters.map((q) => {
              const hasScore = scores.some((s) => s.quarter === q);
              const isCurrent = currentQuarter === q && isLiveStatus;
              // Highlight the live quarter from ESPN data
              const isLiveQuarter =
                isLiveInProgress &&
                liveScore?.quarter &&
                q === `Q${liveScore.quarter}`;
              return (
                <span
                  key={q}
                  className={cn(
                    "text-[10px] sm:text-xs px-1.5 py-0.5 rounded",
                    hasScore && "bg-primary/20 text-primary",
                    (isCurrent || isLiveQuarter) && "bg-accent text-accent-foreground",
                    !hasScore && !isCurrent && !isLiveQuarter && "bg-muted text-muted-foreground"
                  )}
                >
                  {q}
                </span>
              );
            })}
          </div>
          {isLiveStatus && scores.length < 4 && (
            <div className="w-16 h-0.5 mt-1.5 rounded-full bg-muted overflow-hidden relative">
              <div
                className="absolute top-0 h-full rounded-full bg-primary"
                style={{
                  animation: "progress-bar 2.5s cubic-bezier(0.4, 0.0, 0.2, 1) infinite",
                }}
              />
            </div>
          )}
        </div>

        {/* Team Col (Patriots) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-2xl tracking-wider text-[color:var(--patriots-accent)]">
              {game.team_col}
            </h3>
            <TeamLogo teamName={game.team_col} className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <p
            className={cn(
              "text-2xl sm:text-4xl font-bold tabular-nums",
              isLiveInProgress && "live-score-number text-foreground"
            )}
          >
            {displayColScore}
          </p>
        </div>
      </div>
    </div>
  );
}
