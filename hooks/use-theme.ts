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
