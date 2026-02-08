/**
 * Scripted Super Bowl LIX simulation fixture.
 * Eagles 40 - Chiefs 22 (Eagles = team_row, Chiefs = team_col)
 *
 * Each step represents a game event with cumulative scores at that point.
 * Actions:
 *   "set-live"         → write live_quarter_score JSONB (in-progress score)
 *   "complete-quarter"  → finalize quarter score in scores table + clear live
 *   "clear"            → set live_quarter_score to null (halftime, pregame, etc.)
 */

export interface SimulationStep {
  step: number;
  quarter: number;
  teamRowScore: number; // Eagles cumulative
  teamColScore: number; // Chiefs cumulative
  event: string;
  action: "set-live" | "complete-quarter" | "clear";
  statusDetail: string;
}

export const SIMULATION_FIXTURE: SimulationStep[] = [
  // --- Pregame ---
  {
    step: 1,
    quarter: 1,
    teamRowScore: 0,
    teamColScore: 0,
    event: "Kickoff! Super Bowl LIX underway",
    action: "set-live",
    statusDetail: "Q1 15:00",
  },

  // --- Q1 ---
  {
    step: 2,
    quarter: 1,
    teamRowScore: 3,
    teamColScore: 0,
    event: "Eagles FG - Jake Elliott 42 yards",
    action: "set-live",
    statusDetail: "Q1 9:32",
  },
  {
    step: 3,
    quarter: 1,
    teamRowScore: 3,
    teamColScore: 7,
    event: "Chiefs TD - Travis Kelce 12-yard reception",
    action: "set-live",
    statusDetail: "Q1 4:15",
  },
  {
    step: 4,
    quarter: 1,
    teamRowScore: 10,
    teamColScore: 7,
    event: "Eagles TD - Saquon Barkley 8-yard run",
    action: "set-live",
    statusDetail: "Q1 1:03",
  },
  {
    step: 5,
    quarter: 1,
    teamRowScore: 10,
    teamColScore: 7,
    event: "End of Q1",
    action: "complete-quarter",
    statusDetail: "End Q1",
  },

  // --- Q2 ---
  {
    step: 6,
    quarter: 2,
    teamRowScore: 17,
    teamColScore: 7,
    event: "Eagles TD - A.J. Brown 35-yard reception",
    action: "set-live",
    statusDetail: "Q2 11:20",
  },
  {
    step: 7,
    quarter: 2,
    teamRowScore: 17,
    teamColScore: 14,
    event: "Chiefs TD - Isiah Pacheco 3-yard run",
    action: "set-live",
    statusDetail: "Q2 6:44",
  },
  {
    step: 8,
    quarter: 2,
    teamRowScore: 20,
    teamColScore: 14,
    event: "Eagles FG - Jake Elliott 38 yards",
    action: "set-live",
    statusDetail: "Q2 0:22",
  },
  {
    step: 9,
    quarter: 2,
    teamRowScore: 20,
    teamColScore: 14,
    event: "End of Q2 - Halftime",
    action: "complete-quarter",
    statusDetail: "Halftime",
  },
  {
    step: 10,
    quarter: 2,
    teamRowScore: 20,
    teamColScore: 14,
    event: "Halftime show",
    action: "clear",
    statusDetail: "Halftime",
  },

  // --- Q3 ---
  {
    step: 11,
    quarter: 3,
    teamRowScore: 20,
    teamColScore: 14,
    event: "Second half kickoff",
    action: "set-live",
    statusDetail: "Q3 15:00",
  },
  {
    step: 12,
    quarter: 3,
    teamRowScore: 27,
    teamColScore: 14,
    event: "Eagles TD - Jalen Hurts 4-yard run",
    action: "set-live",
    statusDetail: "Q3 8:55",
  },
  {
    step: 13,
    quarter: 3,
    teamRowScore: 27,
    teamColScore: 22,
    event: "Chiefs TD + 2pt - Mahomes to Kelce + conversion",
    action: "set-live",
    statusDetail: "Q3 3:10",
  },
  {
    step: 14,
    quarter: 3,
    teamRowScore: 30,
    teamColScore: 22,
    event: "Eagles FG - Jake Elliott 29 yards",
    action: "set-live",
    statusDetail: "Q3 0:05",
  },
  {
    step: 15,
    quarter: 3,
    teamRowScore: 30,
    teamColScore: 22,
    event: "End of Q3",
    action: "complete-quarter",
    statusDetail: "End Q3",
  },

  // --- Q4 ---
  {
    step: 16,
    quarter: 4,
    teamRowScore: 33,
    teamColScore: 22,
    event: "Eagles FG - Jake Elliott 44 yards",
    action: "set-live",
    statusDetail: "Q4 10:30",
  },
  {
    step: 17,
    quarter: 4,
    teamRowScore: 33,
    teamColScore: 22,
    event: "Chiefs turnover on downs at Eagles 35",
    action: "set-live",
    statusDetail: "Q4 5:12",
  },
  {
    step: 18,
    quarter: 4,
    teamRowScore: 40,
    teamColScore: 22,
    event: "Eagles TD - Saquon Barkley 60-yard run, game sealed",
    action: "set-live",
    statusDetail: "Q4 2:38",
  },
  {
    step: 19,
    quarter: 4,
    teamRowScore: 40,
    teamColScore: 22,
    event: "End of Q4 - Eagles win Super Bowl LIX!",
    action: "complete-quarter",
    statusDetail: "Final",
  },
  {
    step: 20,
    quarter: 4,
    teamRowScore: 40,
    teamColScore: 22,
    event: "Game Over - Final Score",
    action: "clear",
    statusDetail: "Final",
  },
];
