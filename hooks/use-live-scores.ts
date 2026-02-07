"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const LIVE_INTERVAL = 30_000; // 30s when NFL game is live
const IDLE_INTERVAL = 60_000; // 60s when pregame or halftime

interface LiveScoresResult {
  isPolling: boolean;
  lastPollAt: Date | null;
  error: string | null;
  nflStatus: "pregame" | "live" | "halftime" | "final" | null;
  statusDetail: string | null;
}

/**
 * Polls /api/live-scores at adaptive intervals when enabled.
 * Does NOT manage game state directly - the API route writes to Supabase,
 * which triggers realtime updates via useGameRealtime.
 *
 * @param gameId - The game UUID
 * @param enabled - Whether auto-scores is enabled (game.auto_scores_enabled)
 * @param gameStatus - Current game status from our DB
 */
export function useLiveScores(
  gameId: string,
  enabled: boolean,
  gameStatus: string
): LiveScoresResult {
  const [state, setState] = useState<LiveScoresResult>({
    isPolling: false,
    lastPollAt: null,
    error: null,
    nflStatus: null,
    statusDetail: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nflStatusRef = useRef<string | null>(null);

  // Only poll when enabled AND game is in a pollable state
  const shouldPoll =
    enabled && (gameStatus === "live" || gameStatus === "locked");

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/live-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState((s) => ({
          ...s,
          error: data.error || `HTTP ${res.status}`,
          lastPollAt: new Date(),
        }));
        return;
      }

      const nflStatus = data.nflStatus ?? null;
      nflStatusRef.current = nflStatus;

      setState((s) => ({
        ...s,
        error: null,
        lastPollAt: new Date(),
        nflStatus,
        statusDetail: data.statusDetail ?? null,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Poll failed",
        lastPollAt: new Date(),
      }));
    }
  }, [gameId]);

  useEffect(() => {
    if (!shouldPoll) {
      // Clear interval and reset polling state
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setState((s) => ({ ...s, isPolling: false }));
      return;
    }

    // Start polling
    setState((s) => ({ ...s, isPolling: true, error: null }));

    // Poll immediately on enable (don't wait for first interval)
    poll();

    // Adaptive interval: shorter when live, longer when pregame/halftime
    const getInterval = () => {
      const status = nflStatusRef.current;
      if (status === "live") return LIVE_INTERVAL;
      if (status === "final") return LIVE_INTERVAL; // keep polling briefly after final
      return IDLE_INTERVAL; // pregame, halftime, or unknown
    };

    // Re-schedule interval adaptively
    const scheduleNext = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        poll().then(() => {
          // If status changed, reschedule with new interval
          const currentStatus = nflStatusRef.current;
          if (currentStatus === "final") {
            // Stop polling after final
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setState((s) => ({ ...s, isPolling: false }));
          }
        });
      }, getInterval());
    };

    scheduleNext();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldPoll, poll]);

  return state;
}
