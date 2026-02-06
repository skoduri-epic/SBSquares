"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useGame, type GameState } from "~/hooks/use-game";
import { useGameRealtime } from "~/hooks/use-realtime";

interface GameContextValue extends GameState {
  reload: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  gameId,
  children,
}: {
  gameId: string;
  children: ReactNode;
}) {
  const gameState = useGame(gameId);

  const handleRealtimeUpdate = useCallback(() => {
    gameState.reload();
  }, [gameState.reload]);

  useGameRealtime(gameId, handleRealtimeUpdate);

  return (
    <GameContext.Provider value={gameState}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameContext must be used within GameProvider");
  return ctx;
}
