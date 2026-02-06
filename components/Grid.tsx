"use client";

import { useGameContext } from "./GameProvider";
import { GridCell } from "./GridCell";
import { TeamLogo } from "./TeamLogo";
import { SlidingNumber } from "~/components/ui/sliding-number";
import type { Score } from "~/lib/types";
import { cn } from "~/lib/utils";

interface GridProps {
  onPickSquare?: (row: number, col: number) => void;
  isMyTurn?: boolean;
  activeQuarterScores?: Score[];
}

export function Grid({ onPickSquare, isMyTurn = false, activeQuarterScores = [] }: GridProps) {
  const { squares, players, digitAssignments, game, session } = useGameContext();

  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Build digit maps
  const rowDigits: (number | null)[] = Array(10).fill(null);
  const colDigits: (number | null)[] = Array(10).fill(null);
  for (const da of digitAssignments) {
    if (da.axis === "row") rowDigits[da.position] = da.digit;
    else colDigits[da.position] = da.digit;
  }

  // Find winner/runner-up squares from scores (track which quarters)
  const winnerSquares = new Map<string, string[]>();
  const runnerUpSquares = new Map<string, string[]>();

  if (digitAssignments.length > 0) {
    const rowDigitToPos = new Map<number, number>();
    const colDigitToPos = new Map<number, number>();
    for (const da of digitAssignments) {
      if (da.axis === "row") rowDigitToPos.set(da.digit, da.position);
      else colDigitToPos.set(da.digit, da.position);
    }

    for (const score of activeQuarterScores) {
      const rd = score.team_row_score % 10;
      const cd = score.team_col_score % 10;
      const wr = rowDigitToPos.get(rd);
      const wc = colDigitToPos.get(cd);
      if (wr !== undefined && wc !== undefined) {
        const wKey = `${wr}-${wc}`;
        if (!winnerSquares.has(wKey)) winnerSquares.set(wKey, []);
        winnerSquares.get(wKey)!.push(score.quarter);
      }
      if (rd !== cd) {
        const rr = rowDigitToPos.get(cd);
        const rc = colDigitToPos.get(rd);
        if (rr !== undefined && rc !== undefined) {
          const rKey = `${rr}-${rc}`;
          if (!runnerUpSquares.has(rKey)) runnerUpSquares.set(rKey, []);
          runnerUpSquares.get(rKey)!.push(score.quarter);
        }
      }
    }
  }

  const hasDigits = digitAssignments.length > 0;
  const teamCol = game?.team_col ?? "Patriots";
  const teamRow = game?.team_row ?? "Seahawks";

  const cellSize = "w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] md:w-[52px] md:h-[52px]";
  const gap = "gap-[2px] sm:gap-1";

  return (
    <div className="overflow-x-auto p-1">
      <div className="inline-flex flex-col">
        {/* Main grid area: Seahawks label + (column headers + grid rows) */}
        <div className="flex">
          {/* Row team label (vertical) */}
          <div className="flex flex-col items-center justify-center gap-1.5 pr-2 flex-shrink-0">
            <TeamLogo teamName={teamRow} className="w-5 h-5 sm:w-6 sm:h-6 -rotate-90" />
            <h3
              className="text-base sm:text-lg md:text-xl font-bold tracking-wider text-[color:var(--seahawks-accent)]"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}
            >
              {teamRow}
            </h3>
          </div>

          {/* Column headers + grid rows */}
          <div className={cn("flex flex-col", gap)}>
            {/* Patriots team label row */}
            <div className={cn("flex mb-1", gap)}>
              {/* Spacer matching row digit header */}
              <div className={cellSize} />
              <div className="flex-1 flex items-center justify-center gap-1.5">
                <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-wider text-[color:var(--patriots-accent)]">
                  {teamCol}
                </h3>
                <TeamLogo teamName={teamCol} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            {/* Column digit headers row */}
            <div className={cn("flex", gap)}>
              {/* Corner cell (matches row digit header width) */}
              <div className={cn(cellSize, "flex items-center justify-center flex-shrink-0")} />
              {/* Column digit headers */}
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={`col-${i}`}
                  className={cn(
                    cellSize,
                    "flex items-center justify-center rounded-md bg-secondary font-extrabold text-sm sm:text-lg md:text-2xl flex-shrink-0",
                    "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                    hasDigits && colDigits[i] !== null && "text-primary"
                  )}
                >
                  {hasDigits && colDigits[i] !== null ? (
                    <SlidingNumber
                      value={colDigits[i]!}
                      animationProfile="slow"
                      easing="easeOutExpo"
                      delay={i * 200}
                    />
                  ) : (
                    <span className="text-muted-foreground">?</span>
                  )}
                </div>
              ))}
            </div>

            {/* Grid rows with row headers */}
            {Array.from({ length: 10 }, (_, r) => (
              <div key={`row-${r}`} className={cn("flex", gap)}>
                {/* Row digit header */}
                <div
                  className={cn(
                    cellSize,
                    "flex items-center justify-center rounded-md bg-secondary font-extrabold text-sm sm:text-lg md:text-2xl flex-shrink-0",
                    "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                    hasDigits && rowDigits[r] !== null && "text-primary"
                  )}
                >
                  {hasDigits && rowDigits[r] !== null ? (
                    <SlidingNumber
                      value={rowDigits[r]!}
                      animationProfile="slow"
                      easing="easeOutExpo"
                      delay={r * 200}
                    />
                  ) : (
                    <span className="text-muted-foreground">?</span>
                  )}
                </div>

                {/* Grid cells */}
                {Array.from({ length: 10 }, (_, c) => {
                  const sq = squares[r][c];
                  const player = sq.player_id ? playerMap.get(sq.player_id) ?? null : null;
                  const key = `${r}-${c}`;

                  return (
                    <GridCell
                      key={key}
                      square={sq}
                      player={player}
                      isAvailable={!sq.player_id}
                      isMyTurn={isMyTurn}
                      isMine={sq.player_id === session?.playerId}
                      isWinner={winnerSquares.has(key)}
                      isRunnerUp={runnerUpSquares.has(key) && !winnerSquares.has(key)}
                      winnerQuarters={winnerSquares.get(key)}
                      runnerUpQuarters={runnerUpSquares.get(key)}
                      onPick={onPickSquare ? () => onPickSquare(r, c) : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
