export const MAX_GAMES = 20;

export interface NflTeam {
  name: string;        // Display name (e.g. "Chiefs")
  city: string;        // City/region (e.g. "Kansas City")
  abbreviation: string; // ESPN logo URL abbreviation (e.g. "kc")
  primaryColor: string;
  secondaryColor: string;
}

// All 32 NFL teams with ESPN abbreviations and official colors
export const NFL_TEAMS: NflTeam[] = [
  // AFC East
  { name: "Bills", city: "Buffalo", abbreviation: "buf", primaryColor: "#00338D", secondaryColor: "#C60C30" },
  { name: "Dolphins", city: "Miami", abbreviation: "mia", primaryColor: "#008E97", secondaryColor: "#FC4C02" },
  { name: "Jets", city: "New York", abbreviation: "nyj", primaryColor: "#125740", secondaryColor: "#FFFFFF" },
  { name: "Patriots", city: "New England", abbreviation: "ne", primaryColor: "#002244", secondaryColor: "#C60C30" },
  // AFC North
  { name: "Ravens", city: "Baltimore", abbreviation: "bal", primaryColor: "#241773", secondaryColor: "#9E7C0C" },
  { name: "Bengals", city: "Cincinnati", abbreviation: "cin", primaryColor: "#FB4F14", secondaryColor: "#000000" },
  { name: "Browns", city: "Cleveland", abbreviation: "cle", primaryColor: "#311D00", secondaryColor: "#FF3C00" },
  { name: "Steelers", city: "Pittsburgh", abbreviation: "pit", primaryColor: "#FFB612", secondaryColor: "#101820" },
  // AFC South
  { name: "Texans", city: "Houston", abbreviation: "hou", primaryColor: "#03202F", secondaryColor: "#A71930" },
  { name: "Colts", city: "Indianapolis", abbreviation: "ind", primaryColor: "#002C5F", secondaryColor: "#A2AAAD" },
  { name: "Jaguars", city: "Jacksonville", abbreviation: "jax", primaryColor: "#006778", secondaryColor: "#D7A22A" },
  { name: "Titans", city: "Tennessee", abbreviation: "ten", primaryColor: "#0C2340", secondaryColor: "#4B92DB" },
  // AFC West
  { name: "Broncos", city: "Denver", abbreviation: "den", primaryColor: "#FB4F14", secondaryColor: "#002244" },
  { name: "Chiefs", city: "Kansas City", abbreviation: "kc", primaryColor: "#E31837", secondaryColor: "#FFB81C" },
  { name: "Raiders", city: "Las Vegas", abbreviation: "lv", primaryColor: "#000000", secondaryColor: "#A5ACAF" },
  { name: "Chargers", city: "Los Angeles", abbreviation: "lac", primaryColor: "#0080C6", secondaryColor: "#FFC20E" },
  // NFC East
  { name: "Cowboys", city: "Dallas", abbreviation: "dal", primaryColor: "#003594", secondaryColor: "#869397" },
  { name: "Eagles", city: "Philadelphia", abbreviation: "phi", primaryColor: "#004C54", secondaryColor: "#A5ACAF" },
  { name: "Giants", city: "New York", abbreviation: "nyg", primaryColor: "#0B2265", secondaryColor: "#A71930" },
  { name: "Commanders", city: "Washington", abbreviation: "wsh", primaryColor: "#5A1414", secondaryColor: "#FFB612" },
  // NFC North
  { name: "Bears", city: "Chicago", abbreviation: "chi", primaryColor: "#0B162A", secondaryColor: "#C83803" },
  { name: "Lions", city: "Detroit", abbreviation: "det", primaryColor: "#0076B6", secondaryColor: "#B0B7BC" },
  { name: "Packers", city: "Green Bay", abbreviation: "gb", primaryColor: "#203731", secondaryColor: "#FFB612" },
  { name: "Vikings", city: "Minnesota", abbreviation: "min", primaryColor: "#4F2683", secondaryColor: "#FFC62F" },
  // NFC South
  { name: "Falcons", city: "Atlanta", abbreviation: "atl", primaryColor: "#A71930", secondaryColor: "#000000" },
  { name: "Panthers", city: "Carolina", abbreviation: "car", primaryColor: "#0085CA", secondaryColor: "#101820" },
  { name: "Saints", city: "New Orleans", abbreviation: "no", primaryColor: "#D3BC8D", secondaryColor: "#101820" },
  { name: "Buccaneers", city: "Tampa Bay", abbreviation: "tb", primaryColor: "#D50A0A", secondaryColor: "#34302B" },
  // NFC West
  { name: "Cardinals", city: "Arizona", abbreviation: "ari", primaryColor: "#97233F", secondaryColor: "#000000" },
  { name: "Rams", city: "Los Angeles", abbreviation: "lar", primaryColor: "#003594", secondaryColor: "#FFA300" },
  { name: "49ers", city: "San Francisco", abbreviation: "sf", primaryColor: "#AA0000", secondaryColor: "#B3995D" },
  { name: "Seahawks", city: "Seattle", abbreviation: "sea", primaryColor: "#002244", secondaryColor: "#69BE28" },
];

// ESPN logo URL pattern
export const ESPN_LOGO_URL = (abbr: string) =>
  `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr}.png`;

// Lookup helpers
const teamsByName = new Map(NFL_TEAMS.map((t) => [t.name, t]));

export function getNflTeam(name: string): NflTeam | undefined {
  return teamsByName.get(name);
}

export function getNflTeamLogoUrl(name: string): string | undefined {
  const team = teamsByName.get(name);
  return team ? ESPN_LOGO_URL(team.abbreviation) : undefined;
}
