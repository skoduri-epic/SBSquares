"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GameProvider, useGameContext } from "~/components/GameProvider";
import { Grid } from "~/components/Grid";
import { ScoreBoard } from "~/components/ScoreBoard";
import { PickControls } from "~/components/PickControls";
import { QuarterResults } from "~/components/QuarterResults";
import { PlayerLegend } from "~/components/PlayerLegend";
import { supabase } from "~/lib/supabase";
import { clearSession } from "~/hooks/use-game";
import { pickRandomSquares, getDraftConfig } from "~/lib/game-logic";
import { Settings, LogOut, Sun, Moon, Monitor, HelpCircle, Info, Hash, Clock, DollarSign, AlertCircle } from "lucide-react";
import { useTheme, getTeamSwatch } from "~/hooks/use-theme";
import { toast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";

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
  const { game, session, scores, draftOrder, squares, loading, error, reload } = useGameContext();
  const [isManualPicking, setIsManualPicking] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [pickInfoOpen, setPickInfoOpen] = useState(false);
  const [warning30sOpen, setWarning30sOpen] = useState(false);
  const { theme, resolvedTheme, setTheme, team, setTeam } = useTheme();

  // Tentative pick state
  const [tentativeQueue, setTentativeQueue] = useState<string[]>([]); // "row-col" keys in pick order
  const [replaceCursor, setReplaceCursor] = useState(0);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warned30sRef = useRef(false);
  const handleTimeoutRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const pickingRef = useRef(false); // mutex for handleTentativePick
  const PICK_TIMEOUT_MS = 120_000; // 2 minutes

  // Auto-show rules modal on first visit per game
  useEffect(() => {
    const key = `sbsquares-rules-seen-${gameId}`;
    if (!localStorage.getItem(key)) {
      setRulesOpen(true);
      localStorage.setItem(key, "1");
    }
  }, [gameId]);

  // Show game code reminder toast for players who just joined via QR
  useEffect(() => {
    const code = localStorage.getItem("sb-squares-show-code-toast");
    if (code) {
      localStorage.removeItem("sb-squares-show-code-toast");
      toast({
        title: `Your game code is ${code}`,
        description: "Save this code to sign in from other devices.",
      });
    }
  }, []);

  const batch = game?.status === "batch1" ? 1 : game?.status === "batch2" ? 2 : null;
  const batchOrder = draftOrder.filter((d) => d.batch === batch);
  const currentPicker = batchOrder.find((d) => d.picks_remaining > 0);
  const isMyTurn = currentPicker?.player_id === session?.playerId;
  const myDraft = batchOrder.find((d) => d.player_id === session?.playerId);
  // Use getDraftConfig for stable maxPicks (picks_remaining is 0 after confirm)
  const draftConfig = game ? getDraftConfig(game.max_players ?? 10) : null;
  const maxPicks = draftConfig
    ? batch === 1
      ? draftConfig.batch1Picks
      : draftConfig.batch2Picks
    : 0;

  // Reconstruct tentative queue from DB on load/reconnect
  useEffect(() => {
    if (!isMyTurn || !session || !game || !batch) return;
    const myTentative = squares
      .flat()
      .filter((sq) => sq.player_id === session.playerId && sq.is_tentative && sq.batch === batch)
      .sort((a, b) => (a.picked_at ?? "").localeCompare(b.picked_at ?? ""));
    if (myTentative.length > 0) {
      setTentativeQueue(myTentative.map((sq) => `${sq.row_pos}-${sq.col_pos}`));
      setReplaceCursor(myTentative.length % maxPicks);
      setIsManualPicking(true);
    }
  }, [isMyTurn, session, game, batch, squares, maxPicks]);

  // Timer: tick every second based on tentative_started_at
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const startedAt = myDraft?.tentative_started_at;
    if (!startedAt || !isMyTurn) {
      setTimerSecondsLeft(null);
      return;
    }

    warned30sRef.current = false;
    const tick = () => {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      const remaining = Math.max(0, Math.ceil((PICK_TIMEOUT_MS - elapsed) / 1000));
      setTimerSecondsLeft(remaining);
      if (remaining <= 30 && remaining > 0 && !warned30sRef.current) {
        warned30sRef.current = true;
        setWarning30sOpen(true);
      }
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        handleTimeoutRef.current?.();
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myDraft?.tentative_started_at, isMyTurn]);

  // Handle tentative pick (write to DB with is_tentative=true)
  const handleTentativePick = useCallback(
    async (row: number, col: number) => {
      if (!session || !game || !batch || !myDraft || myDraft.picks_remaining <= 0) return;
      // Mutex: prevent concurrent picks from fast clicks
      if (pickingRef.current) return;
      pickingRef.current = true;
      try {
        const key = `${row}-${col}`;

      // No-op if already tentatively selected by me
      if (tentativeQueue.includes(key)) return;

      // If queue is full, do circular replacement
      if (tentativeQueue.length >= maxPicks) {
        const oldKey = tentativeQueue[replaceCursor];
        const [oldRow, oldCol] = oldKey.split("-").map(Number);

        // Clear old tentative square
        await supabase
          .from("squares")
          .update({
            player_id: null,
            is_tentative: false,
            batch: null,
            picked_at: null,
          })
          .eq("game_id", game.id)
          .eq("row_pos", oldRow)
          .eq("col_pos", oldCol)
          .eq("player_id", session.playerId)
          .eq("is_tentative", true);

        // Write new tentative square
        const { data: updated, error } = await supabase
          .from("squares")
          .update({
            player_id: session.playerId,
            batch,
            picked_at: new Date().toISOString(),
            is_tentative: true,
          })
          .eq("game_id", game.id)
          .eq("row_pos", row)
          .eq("col_pos", col)
          .is("player_id", null)
          .select();

        if (error || !updated || updated.length === 0) {
          const detail = error?.message ?? "0 rows updated — square may already be taken";
          console.error("Tentative pick failed (replace):", detail);
          toast({
            title: "Square unavailable",
            description: error ? `Database error: ${error.message}` : "That square was already taken.",
            variant: "destructive",
          });
          reload();
          return;
        }

        setTentativeQueue((q) => {
          const next = [...q];
          next[replaceCursor] = key;
          return next;
        });
        setReplaceCursor((c) => (c + 1) % maxPicks);
      } else {
        // Queue not full yet -- add new tentative pick
        const isFirstPick = tentativeQueue.length === 0 && !myDraft.tentative_started_at;

        const { data: updated, error } = await supabase
          .from("squares")
          .update({
            player_id: session.playerId,
            batch,
            picked_at: new Date().toISOString(),
            is_tentative: true,
          })
          .eq("game_id", game.id)
          .eq("row_pos", row)
          .eq("col_pos", col)
          .is("player_id", null)
          .select();

        if (error || !updated || updated.length === 0) {
          const detail = error?.message ?? "0 rows updated — square may already be taken";
          console.error("Tentative pick failed:", detail);
          toast({
            title: "Square unavailable",
            description: error ? `Database error: ${error.message}` : "That square was already taken.",
            variant: "destructive",
          });
          reload();
          return;
        }

        // Start timer on first pick
        if (isFirstPick) {
          await supabase
            .from("draft_order")
            .update({ tentative_started_at: new Date().toISOString() })
            .eq("id", myDraft.id);
        }

        setTentativeQueue((q) => [...q, key]);
      }

      reload();
      } finally {
        pickingRef.current = false;
      }
    },
    [session, game, batch, myDraft, tentativeQueue, maxPicks, replaceCursor, reload]
  );

  // Confirm all tentative picks
  const handleConfirmPicks = useCallback(async () => {
    if (!session || !game || !batch || !myDraft) return;

    // Finalize: set is_tentative=false for all my tentative squares
    await supabase
      .from("squares")
      .update({ is_tentative: false })
      .eq("game_id", game.id)
      .eq("player_id", session.playerId)
      .eq("is_tentative", true);

    // Decrement picks_remaining to 0 and clear timer
    await supabase
      .from("draft_order")
      .update({ picks_remaining: 0, tentative_started_at: null })
      .eq("id", myDraft.id);

    setTentativeQueue([]);
    setReplaceCursor(0);
    setIsManualPicking(false);
    reload();
  }, [session, game, batch, myDraft, reload]);

  // Timeout handler: auto-confirm existing tentative + random-fill remaining
  const handleTimeout = useCallback(async () => {
    if (!session || !game || !batch || !myDraft || myDraft.picks_remaining <= 0) return;

    // Query DB for actual tentative count to avoid stale closure state
    const { count: myTentativeCount } = await supabase
      .from("squares")
      .select("*", { count: "exact", head: true })
      .eq("game_id", game.id)
      .eq("player_id", session.playerId)
      .eq("is_tentative", true)
      .eq("batch", batch);

    // Use getDraftConfig for stable picks count
    const cfg = getDraftConfig(game.max_players ?? 10);
    const batchPicks = batch === 1 ? cfg.batch1Picks : cfg.batch2Picks;

    // Safety: cap remaining (never negative)
    const remaining = Math.max(0, batchPicks - (myTentativeCount ?? 0));

    // Random-fill remaining slots if needed
    if (remaining > 0) {
      // Re-fetch squares from DB for fresh state to avoid stale closure issues
      const { data: freshSquares } = await supabase
        .from("squares")
        .select("row_pos, col_pos, player_id")
        .eq("game_id", game.id)
        .is("player_id", null);

      const available = (freshSquares ?? []).map((sq) => ({
        row: sq.row_pos,
        col: sq.col_pos,
      }));

      // Shuffle and take only what we need
      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
      }
      const randomPicks = available.slice(0, remaining);

      for (const pick of randomPicks) {
        await supabase
          .from("squares")
          .update({
            player_id: session.playerId,
            batch,
            picked_at: new Date().toISOString(),
            is_tentative: true,
          })
          .eq("game_id", game.id)
          .eq("row_pos", pick.row)
          .eq("col_pos", pick.col)
          .is("player_id", null);
      }
    }

    // Confirm all tentative picks
    await supabase
      .from("squares")
      .update({ is_tentative: false })
      .eq("game_id", game.id)
      .eq("player_id", session.playerId)
      .eq("is_tentative", true);

    // Finalize turn
    await supabase
      .from("draft_order")
      .update({ picks_remaining: 0, tentative_started_at: null })
      .eq("id", myDraft.id);

    setTentativeQueue([]);
    setReplaceCursor(0);
    setIsManualPicking(false);
    toast({ title: "Time's up!", description: "Your picks were auto-confirmed." });
    reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, game, batch, myDraft, reload]);

  // Keep ref in sync so timer always calls latest handleTimeout
  handleTimeoutRef.current = handleTimeout;

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
            <div className="flex items-center bg-muted rounded-lg p-0.5" role="radiogroup" aria-label="Theme">
              {([
                { value: "light" as const, icon: Sun, label: "Light" },
                { value: "system" as const, icon: Monitor, label: "System" },
                { value: "dark" as const, icon: Moon, label: "Dark" },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={theme === value}
                  aria-label={label}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    theme === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setRulesOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Game rules"
            >
              <Info className="w-4 h-4" />
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
      <main className={cn("flex-1 max-w-4xl mx-auto w-full px-4 py-4 space-y-4", isManualPicking && "pb-20")}>
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
          <PickControls
            onPickingStateChange={(picking) => {
              if (picking) {
                setPickInfoOpen(true);
              } else {
                setIsManualPicking(false);
              }
            }}
            isManualPicking={isManualPicking}
            tentativeQueue={tentativeQueue}
            onConfirm={handleConfirmPicks}
            timerSecondsLeft={timerSecondsLeft}
            maxPicks={maxPicks}
          />
        )}

        {/* Grid */}
        <div className="flex justify-center">
          <Grid
            onPickSquare={isManualPicking && isMyTurn ? handleTentativePick : undefined}
            isMyTurn={isManualPicking && isMyTurn}
            tentativeQueue={tentativeQueue}
            activeQuarterScores={scores}
          />
        </div>

        {/* Player Legend */}
        <PlayerLegend />

        {/* Quarter Results */}
        <QuarterResults />
      </main>

      {/* Game Rules Modal */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl tracking-wider">Game Rules</DialogTitle>
            <DialogDescription className="sr-only">Key rules for Super Bowl Squares</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-3">
              <Hash className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Only the ones digit counts</p>
                <p className="text-xs text-muted-foreground">
                  A score of 27-14 means digits 7 and 4. The last digit of each team's score determines the winning square.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Winner decided each quarter</p>
                <p className="text-xs text-muted-foreground">
                  The score at the end of each quarter (Q1-Q4) finalizes that quarter's winning square.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <DollarSign className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Winner and runner-up each quarter</p>
                <p className="text-xs text-muted-foreground">
                  The winning square gets the majority of each quarter&apos;s prize. The runner-up (digits swapped) gets the remainder. If both digits match (e.g. 3-3), one player wins the full quarter prize. Prize amounts are set by the game admin.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">4 quarters only, no overtime</p>
                <p className="text-xs text-muted-foreground">
                  Winners are determined for Q1 through Q4 only. Overtime scores are not considered.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium transition-colors">
                Got it
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pick Info Modal — shown when entering manual pick mode */}
      <Dialog open={pickInfoOpen} onOpenChange={setPickInfoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl tracking-wider">Pick your squares</DialogTitle>
            <DialogDescription className="sr-only">Instructions for manual square picking</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              You have <span className="font-semibold text-foreground">2 minutes</span> to pick your squares.
            </p>
            <p className="text-sm text-muted-foreground">
              Tap squares on the grid to select them. Tap a new square to swap out the oldest pick.
            </p>
            <p className="text-sm text-muted-foreground">
              Any remaining slots will be <span className="font-semibold text-foreground">randomly filled</span> when time runs out.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setPickInfoOpen(false);
                setIsManualPicking(true);
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Start Picking
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 30-Second Warning Modal */}
      <Dialog open={warning30sOpen} onOpenChange={setWarning30sOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-lg tracking-wider text-destructive">30 seconds left</DialogTitle>
            <DialogDescription className="sr-only">Time warning for square picking</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Remaining squares will be randomly filled when time runs out.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <button className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg px-4 py-2.5 text-sm font-medium transition-colors">
                Got it
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
