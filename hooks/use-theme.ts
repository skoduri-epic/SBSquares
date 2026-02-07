"use client";

import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

const THEME_KEY = "sb-theme";
const TEAM_KEY = "sb-team";

// Official NFL team color palettes
// Each team has dark and light mode overrides for CSS custom properties
const TEAM_COLORS: Record<string, { dark: Record<string, string>; light: Record<string, string>; swatch: string }> = {
  Seahawks: {
    swatch: "#69BE28",
    dark: {
      "--primary": "#69BE28",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#69BE28",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#69BE28",
      "--card": "#0A1628",
      "--secondary": "#122036",
    },
    light: {
      "--primary": "#002A5C",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#4EA324",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#002A5C",
    },
  },
  Patriots: {
    swatch: "#C60C30",
    dark: {
      "--primary": "#C60C30",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#C60C30",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#C60C30",
      "--card": "#0F1524",
      "--secondary": "#1A2238",
    },
    light: {
      "--primary": "#002244",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#C60C30",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#002244",
    },
  },
  Chiefs: {
    swatch: "#E31837",
    dark: {
      "--primary": "#E31837",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FFB81C",
      "--accent-foreground": "#000000",
      "--ring": "#E31837",
      "--card": "#1A0A0E",
      "--secondary": "#2A1218",
    },
    light: {
      "--primary": "#E31837",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#C6A014",
      "--accent-foreground": "#000000",
      "--ring": "#E31837",
    },
  },
  Eagles: {
    swatch: "#004C54",
    dark: {
      "--primary": "#A5ACAF",
      "--primary-foreground": "#004C54",
      "--accent": "#004C54",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#A5ACAF",
      "--card": "#0A1418",
      "--secondary": "#122228",
    },
    light: {
      "--primary": "#004C54",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#A5ACAF",
      "--accent-foreground": "#000000",
      "--ring": "#004C54",
    },
  },
  "49ers": {
    swatch: "#AA0000",
    dark: {
      "--primary": "#AA0000",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#B3995D",
      "--accent-foreground": "#000000",
      "--ring": "#AA0000",
      "--card": "#1A0808",
      "--secondary": "#2A1010",
    },
    light: {
      "--primary": "#AA0000",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#8C7A45",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#AA0000",
    },
  },
  Cowboys: {
    swatch: "#003594",
    dark: {
      "--primary": "#869397",
      "--primary-foreground": "#003594",
      "--accent": "#003594",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#869397",
      "--card": "#0E1420",
      "--secondary": "#1A2030",
    },
    light: {
      "--primary": "#003594",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#869397",
      "--accent-foreground": "#000000",
      "--ring": "#003594",
    },
  },
  Packers: {
    swatch: "#203731",
    dark: {
      "--primary": "#FFB612",
      "--primary-foreground": "#203731",
      "--accent": "#203731",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#FFB612",
      "--card": "#0E1610",
      "--secondary": "#1A2A1E",
    },
    light: {
      "--primary": "#203731",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FFB612",
      "--accent-foreground": "#000000",
      "--ring": "#203731",
    },
  },
  Bills: {
    swatch: "#00338D",
    dark: {
      "--primary": "#C60C30",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#00338D",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#C60C30",
      "--card": "#0A0E1A",
      "--secondary": "#141E30",
    },
    light: {
      "--primary": "#00338D",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#C60C30",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#00338D",
    },
  },
  Dolphins: {
    swatch: "#008E97",
    dark: {
      "--primary": "#008E97",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FC4C02",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#008E97",
      "--card": "#081618",
      "--secondary": "#102428",
    },
    light: {
      "--primary": "#008E97",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FC4C02",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#008E97",
    },
  },
  Jets: {
    swatch: "#125740",
    dark: {
      "--primary": "#1A7A5A",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#125740",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#1A7A5A",
      "--card": "#081410",
      "--secondary": "#102418",
    },
    light: {
      "--primary": "#125740",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#000000",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#125740",
    },
  },
  Ravens: {
    swatch: "#241773",
    dark: {
      "--primary": "#9E7C0C",
      "--primary-foreground": "#241773",
      "--accent": "#241773",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#9E7C0C",
      "--card": "#0E0A1A",
      "--secondary": "#1A1430",
    },
    light: {
      "--primary": "#241773",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#9E7C0C",
      "--accent-foreground": "#000000",
      "--ring": "#241773",
    },
  },
  Bengals: {
    swatch: "#FB4F14",
    dark: {
      "--primary": "#FB4F14",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FB4F14",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#FB4F14",
      "--card": "#1A0E08",
      "--secondary": "#2A1810",
    },
    light: {
      "--primary": "#FB4F14",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#000000",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#FB4F14",
    },
  },
  Browns: {
    swatch: "#311D00",
    dark: {
      "--primary": "#FF3C00",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#311D00",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#FF3C00",
      "--card": "#140E06",
      "--secondary": "#221A0E",
    },
    light: {
      "--primary": "#311D00",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FF3C00",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#311D00",
    },
  },
  Steelers: {
    swatch: "#FFB612",
    dark: {
      "--primary": "#FFB612",
      "--primary-foreground": "#101820",
      "--accent": "#101820",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#FFB612",
      "--card": "#0E0E10",
      "--secondary": "#1A1A20",
    },
    light: {
      "--primary": "#101820",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FFB612",
      "--accent-foreground": "#000000",
      "--ring": "#101820",
    },
  },
  Texans: {
    swatch: "#03202F",
    dark: {
      "--primary": "#A71930",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#03202F",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#A71930",
      "--card": "#080E14",
      "--secondary": "#101A22",
    },
    light: {
      "--primary": "#03202F",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#A71930",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#03202F",
    },
  },
  Colts: {
    swatch: "#002C5F",
    dark: {
      "--primary": "#002C5F",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#A2AAAD",
      "--accent-foreground": "#002C5F",
      "--ring": "#002C5F",
      "--card": "#080E18",
      "--secondary": "#101A28",
    },
    light: {
      "--primary": "#002C5F",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#A2AAAD",
      "--accent-foreground": "#000000",
      "--ring": "#002C5F",
    },
  },
  Jaguars: {
    swatch: "#006778",
    dark: {
      "--primary": "#D7A22A",
      "--primary-foreground": "#006778",
      "--accent": "#006778",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#D7A22A",
      "--card": "#081416",
      "--secondary": "#102224",
    },
    light: {
      "--primary": "#006778",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#D7A22A",
      "--accent-foreground": "#000000",
      "--ring": "#006778",
    },
  },
  Titans: {
    swatch: "#0C2340",
    dark: {
      "--primary": "#4B92DB",
      "--primary-foreground": "#0C2340",
      "--accent": "#0C2340",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#4B92DB",
      "--card": "#080E18",
      "--secondary": "#101A28",
    },
    light: {
      "--primary": "#0C2340",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#4B92DB",
      "--accent-foreground": "#000000",
      "--ring": "#0C2340",
    },
  },
  Broncos: {
    swatch: "#FB4F14",
    dark: {
      "--primary": "#FB4F14",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#002244",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#FB4F14",
      "--card": "#120A06",
      "--secondary": "#201410",
    },
    light: {
      "--primary": "#002244",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FB4F14",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#002244",
    },
  },
  Raiders: {
    swatch: "#A5ACAF",
    dark: {
      "--primary": "#A5ACAF",
      "--primary-foreground": "#000000",
      "--accent": "#000000",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#A5ACAF",
      "--card": "#0A0A0A",
      "--secondary": "#181818",
    },
    light: {
      "--primary": "#000000",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#A5ACAF",
      "--accent-foreground": "#000000",
      "--ring": "#000000",
    },
  },
  Chargers: {
    swatch: "#0080C6",
    dark: {
      "--primary": "#0080C6",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FFC20E",
      "--accent-foreground": "#000000",
      "--ring": "#0080C6",
      "--card": "#08141A",
      "--secondary": "#10222E",
    },
    light: {
      "--primary": "#0080C6",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FFC20E",
      "--accent-foreground": "#000000",
      "--ring": "#0080C6",
    },
  },
  Giants: {
    swatch: "#0B2265",
    dark: {
      "--primary": "#A71930",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#0B2265",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#A71930",
      "--card": "#0A0E1A",
      "--secondary": "#14182A",
    },
    light: {
      "--primary": "#0B2265",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#A71930",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#0B2265",
    },
  },
  Commanders: {
    swatch: "#5A1414",
    dark: {
      "--primary": "#FFB612",
      "--primary-foreground": "#5A1414",
      "--accent": "#5A1414",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#FFB612",
      "--card": "#180A0A",
      "--secondary": "#281414",
    },
    light: {
      "--primary": "#5A1414",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FFB612",
      "--accent-foreground": "#000000",
      "--ring": "#5A1414",
    },
  },
  Bears: {
    swatch: "#0B162A",
    dark: {
      "--primary": "#C83803",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#0B162A",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#C83803",
      "--card": "#0A0E16",
      "--secondary": "#141822",
    },
    light: {
      "--primary": "#0B162A",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#C83803",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#0B162A",
    },
  },
  Lions: {
    swatch: "#0076B6",
    dark: {
      "--primary": "#0076B6",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#B0B7BC",
      "--accent-foreground": "#0076B6",
      "--ring": "#0076B6",
      "--card": "#08121A",
      "--secondary": "#101E2A",
    },
    light: {
      "--primary": "#0076B6",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#B0B7BC",
      "--accent-foreground": "#000000",
      "--ring": "#0076B6",
    },
  },
  Vikings: {
    swatch: "#4F2683",
    dark: {
      "--primary": "#FFC62F",
      "--primary-foreground": "#4F2683",
      "--accent": "#4F2683",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#FFC62F",
      "--card": "#120A1A",
      "--secondary": "#1E142A",
    },
    light: {
      "--primary": "#4F2683",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FFC62F",
      "--accent-foreground": "#000000",
      "--ring": "#4F2683",
    },
  },
  Falcons: {
    swatch: "#A71930",
    dark: {
      "--primary": "#A71930",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#A8A9AD",
      "--accent-foreground": "#A71930",
      "--ring": "#A71930",
      "--card": "#160A0E",
      "--secondary": "#241418",
    },
    light: {
      "--primary": "#A71930",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#000000",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#A71930",
    },
  },
  Panthers: {
    swatch: "#0085CA",
    dark: {
      "--primary": "#0085CA",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#101820",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#0085CA",
      "--card": "#08121A",
      "--secondary": "#101E2A",
    },
    light: {
      "--primary": "#0085CA",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#101820",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#0085CA",
    },
  },
  Saints: {
    swatch: "#D3BC8D",
    dark: {
      "--primary": "#D3BC8D",
      "--primary-foreground": "#101820",
      "--accent": "#101820",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#D3BC8D",
      "--card": "#0E0E10",
      "--secondary": "#1A1A20",
    },
    light: {
      "--primary": "#101820",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#D3BC8D",
      "--accent-foreground": "#000000",
      "--ring": "#101820",
    },
  },
  Buccaneers: {
    swatch: "#D50A0A",
    dark: {
      "--primary": "#D50A0A",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#34302B",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#D50A0A",
      "--card": "#180808",
      "--secondary": "#281010",
    },
    light: {
      "--primary": "#D50A0A",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#34302B",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#D50A0A",
    },
  },
  Cardinals: {
    swatch: "#97233F",
    dark: {
      "--primary": "#97233F",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FFB612",
      "--accent-foreground": "#000000",
      "--ring": "#97233F",
      "--card": "#160A10",
      "--secondary": "#24141C",
    },
    light: {
      "--primary": "#97233F",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#000000",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#97233F",
    },
  },
  Rams: {
    swatch: "#003594",
    dark: {
      "--primary": "#FFA300",
      "--primary-foreground": "#003594",
      "--accent": "#003594",
      "--accent-foreground": "#FFFFFF",
      "--ring": "#FFA300",
      "--card": "#0A0E1A",
      "--secondary": "#141A2A",
    },
    light: {
      "--primary": "#003594",
      "--primary-foreground": "#FFFFFF",
      "--accent": "#FFA300",
      "--accent-foreground": "#000000",
      "--ring": "#003594",
    },
  },
};

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as Theme) ?? "dark";
}

function getStoredTeam(): string {
  if (typeof window === "undefined") return "neutral";
  return localStorage.getItem(TEAM_KEY) ?? "neutral";
}

function applyTeamColors(teamName: string, theme: Theme) {
  const root = document.documentElement;
  // Clear any existing team overrides
  root.removeAttribute("style");

  if (teamName === "neutral") return;

  const palette = TEAM_COLORS[teamName];
  if (!palette) return;

  const vars = theme === "dark" ? palette.dark : palette.light;
  for (const [prop, value] of Object.entries(vars)) {
    root.style.setProperty(prop, value);
  }
}

export function getTeamSwatch(teamName: string): string | null {
  return TEAM_COLORS[teamName]?.swatch ?? null;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [team, setTeamState] = useState<string>(getStoredTeam);

  useEffect(() => {
    const storedTheme = getStoredTheme();
    const storedTeam = getStoredTeam();
    setThemeState(storedTheme);
    setTeamState(storedTeam);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    applyTeamColors(storedTeam, storedTheme);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
    const currentTeam = localStorage.getItem(TEAM_KEY) ?? "neutral";
    applyTeamColors(currentTeam, t);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [theme, setTheme]);

  const setTeam = useCallback((teamName: string) => {
    const next = team === teamName ? "neutral" : teamName;
    setTeamState(next);
    localStorage.setItem(TEAM_KEY, next);
    const currentTheme = (localStorage.getItem(THEME_KEY) as Theme) ?? "dark";
    applyTeamColors(next, currentTheme);
  }, [team]);

  return { theme, setTheme, toggleTheme, team, setTeam };
}
