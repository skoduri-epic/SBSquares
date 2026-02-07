import type { Quarter } from "./types";

// ESPN API response types (subset we need)

interface ESPNLinescore {
  value: number; // points scored IN this period (float, e.g. 7.0)
  displayValue: string; // e.g. "7"
  period: number; // 1-4 or 5 for OT
}

interface ESPNCompetitor {
  team: {
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    name: string; // e.g., "Patriots"
  };
  score: string;
  linescores?: ESPNLinescore[];
  homeAway: "home" | "away";
}

interface ESPNStatusType {
  state: "pre" | "in" | "post";
  completed: boolean;
  name: string; // STATUS_SCHEDULED, STATUS_IN_PROGRESS, STATUS_HALFTIME, etc.
  description: string; // "Scheduled", "In Progress", "Final", etc.
  detail: string; // "3:24 - 2nd Quarter"
}

interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  status: {
    type: ESPNStatusType;
    period: number; // current period (1-4, 5+ = OT)
  };
}

export interface ESPNEvent {
  id: string;
  competitions: ESPNCompetition[];
}

interface ESPNScoreboardResponse {
  events: ESPNEvent[];
}

// Our parsed output
export interface QuarterScore {
  quarter: Quarter;
  homeScore: number; // cumulative at end of quarter
  awayScore: number; // cumulative at end of quarter
  isComplete: boolean;
}

export interface ParsedGameScores {
  eventId: string;
  homeTeam: string; // team.name e.g., "Patriots"
  awayTeam: string; // team.name e.g., "Seahawks"
  homeDisplayName: string; // team.displayName e.g., "Kansas City Chiefs"
  awayDisplayName: string; // team.displayName e.g., "Philadelphia Eagles"
  homeAbbrev: string; // e.g., "KC"
  awayAbbrev: string; // e.g., "PHI"
  status: "pregame" | "live" | "halftime" | "final";
  statusDetail: string; // e.g., "3:24 - 2nd Quarter"
  currentPeriod: number;
  quarters: QuarterScore[];
}

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

/**
 * Fetch the ESPN scoreboard for a given date (YYYYMMDD format).
 * If no date provided, fetches today's scoreboard.
 */
export async function fetchESPNScoreboard(
  dateStr?: string
): Promise<ESPNEvent[]> {
  const url = dateStr
    ? `${ESPN_SCOREBOARD_URL}?dates=${dateStr}`
    : ESPN_SCOREBOARD_URL;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`ESPN API returned ${res.status}`);
  }

  const data: ESPNScoreboardResponse = await res.json();
  return data.events ?? [];
}

/**
 * Fetch and parse scores for a specific ESPN event.
 * Tries the scoreboard ?event= param first (works for current season).
 * Falls back to the summary endpoint for historical games from past seasons.
 * Returns null if event not found.
 */
export async function fetchESPNScores(
  eventId: string
): Promise<ParsedGameScores | null> {
  // Try scoreboard ?event= first (fast, works for current season)
  const res = await fetch(`${ESPN_SCOREBOARD_URL}?event=${eventId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ESPN API returned ${res.status}`);
  }

  const data: ESPNScoreboardResponse = await res.json();
  const event = data.events?.find((e) => e.id === eventId);

  if (event) return parseGameScores(event);

  // Fallback: ESPN's ?event= param doesn't work for past seasons.
  // Use the summary endpoint which reliably returns any event by ID.
  return fetchESPNScoresViaSummary(eventId);
}

/**
 * Fetch scores via the ESPN summary endpoint (works for any event ID including
 * historical games). The summary response shape differs from scoreboard, so we
 * map it into our ESPNEvent structure before parsing.
 */
async function fetchESPNScoresViaSummary(
  eventId: string
): Promise<ParsedGameScores | null> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const header = data.header;

  if (!header?.competitions?.[0]) return null;

  const competition = header.competitions[0];
  const status = competition.status ?? {};
  const competitors = competition.competitors ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = competitors.find((c: any) => c.homeAway === "home");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = competitors.find((c: any) => c.homeAway === "away");

  if (!home || !away) return null;

  // Summary linescores only have { displayValue: "7" }, not { value: 7.0 }.
  // Convert to the format parseGameScores expects.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapLinescores = (ls: any[]): ESPNLinescore[] =>
    (ls ?? []).map((entry, i) => ({
      value: parseFloat(entry.displayValue ?? entry.value ?? "0"),
      displayValue: entry.displayValue ?? String(entry.value ?? "0"),
      period: i + 1,
    }));

  // Summary status has no `period` field — infer from linescores count
  // or from status.type.completed
  const inferredPeriod = status.type?.completed
    ? Math.max(home.linescores?.length ?? 4, 4)
    : home.linescores?.length ?? 0;

  const syntheticEvent: ESPNEvent = {
    id: eventId,
    competitions: [{
      competitors: [
        {
          homeAway: "home" as const,
          score: String(home.score ?? "0"),
          team: {
            abbreviation: home.team?.abbreviation ?? "",
            displayName: home.team?.displayName ?? "",
            shortDisplayName: home.team?.shortDisplayName ?? home.team?.name ?? "",
            name: home.team?.name ?? "",
          },
          linescores: mapLinescores(home.linescores),
        },
        {
          homeAway: "away" as const,
          score: String(away.score ?? "0"),
          team: {
            abbreviation: away.team?.abbreviation ?? "",
            displayName: away.team?.displayName ?? "",
            shortDisplayName: away.team?.shortDisplayName ?? away.team?.name ?? "",
            name: away.team?.name ?? "",
          },
          linescores: mapLinescores(away.linescores),
        },
      ],
      status: {
        type: status.type ?? {
          state: "pre" as const,
          completed: false,
          name: "STATUS_SCHEDULED",
          description: "Scheduled",
          detail: "",
        },
        period: inferredPeriod,
      },
    }],
  };

  return parseGameScores(syntheticEvent);
}

/**
 * Parse an ESPN event into our app's score format.
 */
export function parseGameScores(event: ESPNEvent): ParsedGameScores | null {
  if (!event.competitions?.[0]) return null;

  const competition = event.competitions[0];
  const { status, competitors } = competition;

  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");

  if (!home || !away) return null;

  // Determine game status
  let gameStatus: ParsedGameScores["status"];
  if (status.type.completed || status.type.state === "post") {
    gameStatus = "final";
  } else if (status.type.name === "STATUS_HALFTIME") {
    gameStatus = "halftime";
  } else if (
    status.type.state === "in" ||
    status.type.name === "STATUS_IN_PROGRESS" ||
    status.type.name === "STATUS_END_PERIOD"
  ) {
    gameStatus =
      home.linescores && home.linescores.length > 0 ? "live" : "pregame";
  } else {
    gameStatus = "pregame";
  }

  const statusDetail = status.type.detail || status.type.description || "";

  if (gameStatus === "pregame") {
    return {
      eventId: event.id,
      homeTeam: home.team.name,
      awayTeam: away.team.name,
      homeDisplayName: home.team.displayName,
      awayDisplayName: away.team.displayName,
      homeAbbrev: home.team.abbreviation,
      awayAbbrev: away.team.abbreviation,
      status: "pregame",
      statusDetail,
      currentPeriod: 0,
      quarters: [],
    };
  }

  // Convert per-period deltas to cumulative scores for Q1-Q4
  const quarters: QuarterScore[] = [];
  const quarterLabels: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
  const homeLinescores = home.linescores ?? [];
  const awayLinescores = away.linescores ?? [];

  let homeCumulative = 0;
  let awayCumulative = 0;

  for (let i = 0; i < 4; i++) {
    homeCumulative += homeLinescores[i]?.value ?? 0;
    awayCumulative += awayLinescores[i]?.value ?? 0;

    // A quarter is complete if we've moved past it or the game is final
    const isComplete = status.type.completed || status.period > i + 1;

    // Only include quarters that have linescore data
    if (i < homeLinescores.length) {
      quarters.push({
        quarter: quarterLabels[i],
        homeScore: Math.round(homeCumulative),
        awayScore: Math.round(awayCumulative),
        isComplete,
      });
    }
  }

  // Handle overtime: OT points fold into Q4 final score
  if (homeLinescores.length > 4 && quarters.length === 4) {
    let homeOT = 0;
    let awayOT = 0;
    for (let i = 4; i < homeLinescores.length; i++) {
      homeOT += homeLinescores[i]?.value ?? 0;
      awayOT += awayLinescores[i]?.value ?? 0;
    }
    quarters[3] = {
      ...quarters[3],
      homeScore: Math.round(quarters[3].homeScore + homeOT),
      awayScore: Math.round(quarters[3].awayScore + awayOT),
    };
  }

  return {
    eventId: event.id,
    homeTeam: home.team.name,
    awayTeam: away.team.name,
    homeDisplayName: home.team.displayName,
    awayDisplayName: away.team.displayName,
    homeAbbrev: home.team.abbreviation,
    awayAbbrev: away.team.abbreviation,
    status: gameStatus,
    statusDetail,
    currentPeriod: status.period,
    quarters,
  };
}

/**
 * Find an ESPN event matching a team name.
 * Matches against team.name ("Patriots"), shortDisplayName, then displayName.
 */
export function findGameByTeams(
  events: ESPNEvent[],
  teamName: string
): ESPNEvent | null {
  const target = teamName.toLowerCase();

  for (const event of events) {
    const competition = event.competitions?.[0];
    if (!competition) continue;

    for (const competitor of competition.competitors) {
      const { name, shortDisplayName, displayName } = competitor.team;
      if (
        name.toLowerCase() === target ||
        shortDisplayName.toLowerCase() === target ||
        displayName.toLowerCase().includes(target)
      ) {
        return event;
      }
    }
  }

  return null;
}

/**
 * Auto-detect the Super Bowl event from ESPN.
 * Strategy:
 *   1. If a dateStr is provided (YYYYMMDD), fetch that date's scoreboard.
 *      Super Bowl Sunday typically has only one game, so return it.
 *   2. If multiple events exist, match using one of the team names from the game.
 *   3. Falls back to null if no match found (admin must enter event ID manually).
 */
export async function detectSuperBowlEvent(
  teamRow: string,
  teamCol: string,
  dateStr?: string
): Promise<{ eventId: string; homeTeam: string; awayTeam: string } | null> {
  const events = await fetchESPNScoreboard(dateStr);

  if (events.length === 0) return null;

  // If only one game on that date, it's almost certainly the Super Bowl
  if (events.length === 1) {
    const event = events[0];
    const comp = event.competitions?.[0];
    if (!comp) return null;
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    return {
      eventId: event.id,
      homeTeam: home?.team.displayName ?? "Home",
      awayTeam: away?.team.displayName ?? "Away",
    };
  }

  // Multiple games: try matching by team name
  const match = findGameByTeams(events, teamRow) ?? findGameByTeams(events, teamCol);
  if (match) {
    const comp = match.competitions?.[0];
    const home = comp?.competitors.find((c) => c.homeAway === "home");
    const away = comp?.competitors.find((c) => c.homeAway === "away");
    return {
      eventId: match.id,
      homeTeam: home?.team.displayName ?? "Home",
      awayTeam: away?.team.displayName ?? "Away",
    };
  }

  return null;
}

/**
 * Match an ESPN team name to a game's team_row or team_col.
 * Returns "row" or "col" if matched, null otherwise.
 */
export function matchTeamToAxis(
  teamName: string,
  teamDisplayName: string,
  teamAbbrev: string,
  gameTeamRow: string,
  gameTeamCol: string
): "row" | "col" | null {
  const nameLower = teamName.toLowerCase();
  const displayLower = teamDisplayName.toLowerCase();
  const abbrevLower = teamAbbrev.toLowerCase();
  const rowLower = gameTeamRow.toLowerCase();
  const colLower = gameTeamCol.toLowerCase();

  // Check row match
  if (
    nameLower === rowLower ||
    displayLower.includes(rowLower) ||
    abbrevLower === rowLower ||
    rowLower.includes(nameLower)
  ) {
    return "row";
  }

  // Check col match
  if (
    nameLower === colLower ||
    displayLower.includes(colLower) ||
    abbrevLower === colLower ||
    colLower.includes(nameLower)
  ) {
    return "col";
  }

  return null;
}
