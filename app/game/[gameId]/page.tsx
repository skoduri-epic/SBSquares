"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GameProvider, useGameContext } from "~/components/GameProvider";
import { Grid } from "~/components/Grid";
import { ScoreBoard } from "~/components/ScoreBoard";
import { PickControls } from "~/components/PickControls";
import { QuarterResults } from "~/components/QuarterResults";
import { PlayerLegend } from "~/components/PlayerLegend";
import { supabase } from "~/lib/supabase";
import { clearSession } from "~/hooks/use-game";
import { Settings, LogOut, Sun, Moon, HelpCircle } from "lucide-react";
import { useTheme, getTeamSwatch } from "~/hooks/use-theme";
import { cn } from "~/lib/utils";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  return (
    <GameProvider gameId={gameId}>
      <GameView gameId={gameId} />
    </GameProvider>
  );
}

function GameView({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { game, session, scores, draftOrder, loading, error, reload } = useGameContext();
  const [isManualPicking, setIsManualPicking] = useState(false);
  const { theme, toggleTheme, team, setTeam } = useTheme();

  const batch = game?.status === "batch1" ? 1 : game?.status === "batch2" ? 2 : null;
  const batchOrder = draftOrder.filter((d) => d.batch === batch);
  const currentPicker = batchOrder.find((d) => d.picks_remaining > 0);
  const isMyTurn = currentPicker?.player_id === session?.playerId;

  const handlePickSquare = useCallback(
    async (row: number, col: number) => {
      if (!session || !game || !batch) return;

      const myDraft = batchOrder.find((d) => d.player_id === session.playerId);
      if (!myDraft || myDraft.picks_remaining <= 0) return;

      // Claim the square
      const { error } = await supabase
        .from("squares")
        .update({
          player_id: session.playerId,
          batch,
          picked_at: new Date().toISOString(),
        })
        .eq("game_id", game.id)
        .eq("row_pos", row)
        .eq("col_pos", col)
        .is("player_id", null);

      if (error) {
        console.error("Pick failed:", error);
        return;
      }

      // Decrement picks remaining
      await supabase
        .from("draft_order")
        .update({ picks_remaining: myDraft.picks_remaining - 1 })
        .eq("id", myDraft.id);

      reload();
    },
    [session, game, batch, batchOrder, reload]
  );

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error ?? "Game not found"}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl tracking-wider">SB SQUARES</h1>
            <p className="text-[10px] text-muted-foreground">
              {session?.playerName}
              {session?.isAdmin && " (Admin)"}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => router.push("/help")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="How to play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {session?.isAdmin && (
              <button
                onClick={() => router.push(`/game/${gameId}/admin`)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Admin settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 space-y-4">
        {/* Scoreboard */}
        <ScoreBoard />

        {/* Team color selection */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Theme</span>
          {[game.team_row, game.team_col].map((teamName) => {
            const swatch = getTeamSwatch(teamName);
            const isSelected = team === teamName;
            return (
              <button
                key={teamName}
                onClick={() => setTeam(teamName)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {swatch && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: swatch }}
                  />
                )}
                {teamName}
              </button>
            );
          })}
        </div>

        {/* Pick controls (shown during draft) */}
        {(game.status === "batch1" || game.status === "batch2") && (
          <PickControls onPickingStateChange={setIsManualPicking} />
        )}

        {/* Grid */}
        <div className="flex justify-center">
          <Grid
            onPickSquare={isManualPicking && isMyTurn ? handlePickSquare : undefined}
            isMyTurn={isManualPicking && isMyTurn}
            activeQuarterScores={scores}
          />
        </div>

        {/* Player Legend */}
        <PlayerLegend />

        {/* Quarter Results */}
        <QuarterResults />
      </main>
    </div>
  );
}
