"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import { getNflTeamLogoUrl } from "~/lib/constants";

interface TeamLogoProps {
  teamName: string;
  className?: string;
}

export function TeamLogo({ teamName, className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const url = getNflTeamLogoUrl(teamName);

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
