"use client";

import { useGameContext } from "./GameProvider";
import { Trophy, Medal } from "lucide-react";

export function QuarterResults() {
  const { scores, players, game } = useGameContext();

  if (scores.length === 0) return null;

  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-lg tracking-wider">Results</h3>
      </div>
      <div className="divide-y divide-border">
        {scores.map((score) => {
          const winner = score.winner_player_id
            ? playerMap.get(score.winner_player_id)
            : null;
          const runnerUp = score.runner_up_player_id
            ? playerMap.get(score.runner_up_player_id)
            : null;

          return (
            <div key={score.quarter} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {score.quarter}
                </span>
                <span className="text-sm tabular-nums">
                  {game?.team_row} {score.team_row_score} – {game?.team_col} {score.team_col_score}
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                {winner && (
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="w-3.5 h-3.5 text-winner" />
                    <span
                      className="font-semibold"
                      style={{ color: winner.color }}
                    >
                      {winner.name}
                    </span>
                    <span className="text-winner font-bold ml-auto">
                      ${score.winner_prize}
                    </span>
                  </div>
                )}
                {runnerUp && (
                  <div className="flex items-center gap-2 text-sm">
                    <Medal className="w-3.5 h-3.5 text-runner-up" />
                    <span
                      className="font-medium"
                      style={{ color: runnerUp.color }}
                    >
                      {runnerUp.name}
                    </span>
                    <span className="text-runner-up font-bold ml-auto">
                      ${score.runner_up_prize}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
