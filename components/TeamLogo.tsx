"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";

const TEAM_LOGOS: Record<string, string> = {
  Seahawks: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
  Patriots: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
  Chiefs: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
  Eagles: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
  "49ers": "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
  Ravens: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
  Bills: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
  Cowboys: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
  Packers: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
  Lions: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
};

interface TeamLogoProps {
  teamName: string;
  className?: string;
}

export function TeamLogo({ teamName, className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const url = TEAM_LOGOS[teamName];

  if (!url || failed) return null;

  return (
    <img
      src={url}
      alt={`${teamName} logo`}
      className={cn("object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}
