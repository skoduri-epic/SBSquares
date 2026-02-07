"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Grid3x3,
  Trophy,
  Users,
  Settings,
  Palette,
  Zap,
  DollarSign,
  Shuffle,
  HelpCircle,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg tracking-wider">HOW TO PLAY</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* What is Super Bowl Squares */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-accent flex-shrink-0" />
            <h2 className="text-2xl tracking-wider">What is Super Bowl Squares?</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Super Bowl Squares is a popular game played during the Super Bowl.
              A 10x10 grid creates 100 squares, each assigned to a player. The
              rows represent one team and the columns represent the other.
            </p>
            <p>
              After all squares are picked, random digits (0-9) are assigned to
              each row and column. At the end of each quarter, the last digit of
              each team's score determines the winning square.
            </p>
          </div>
        </section>

        {/* How to Create or Join */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent flex-shrink-0" />
            <h2 className="text-2xl tracking-wider">Create or Join a Game</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="text-foreground font-medium">Join a game:</span>{" "}
              Enter the game code shared by your game admin, select your name,
              and verify with your 4-digit PIN.
            </p>
            <p>
              <span className="text-foreground font-medium">Create a game:</span>{" "}
              Choose a unique game code, set the two team names, enter your name
              and PIN. You become the game admin automatically. Share the game
              code with friends so they can join.
            </p>
          </div>
        </section>

        {/* How the Draft Works */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-accent flex-shrink-0" />
            <h2 className="text-2xl tracking-wider">The Draft</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Each player picks 10 squares total, split into two batches of 5.
              The draft order is randomized for each batch.
            </p>
            <p>
              <span className="text-foreground font-medium">Batch 1:</span>{" "}
              Players take turns picking 5 squares each in a randomized order.
              Pick any open square on the grid when it is your turn.
            </p>
            <p>
              <span className="text-foreground font-medium">Batch 2:</span>{" "}
              A new random order is generated. Players pick 5 more squares each.
              After both batches, all 100 squares are filled.
            </p>
          </div>
        </section>

        {/* Scoring and Winners */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent flex-shrink-0" />
            <h2 className="text-2xl tracking-wider">Scoring and Winners</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Once the draft is complete, the admin reveals random digits (0-9)
              for the rows and columns. These are hidden during the draft so
              picks are fair.
            </p>
            <p>
              At the end of each quarter, the admin enters both team scores. The
              last digit of each score determines the winning square. For
              example, if the Row team has 17 and the Column team has 13, the
              winning square is at row 7, column 3.
            </p>
            <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-winner" />
                <span className="text-foreground font-medium">Winner</span>
                <span>gets the majority of each quarter&apos;s prize (e.g. $100 at default settings)</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-runner-up" />
                <span className="text-foreground font-medium">Runner-up</span>
                <span>(digits swapped) gets the remainder (e.g. $25)</span>
              </div>
              <p className="text-xs">
                If both teams end with the same last digit, the winner and
                runner-up are the same square. That player wins the full
                quarter prize. Amounts are configured by the game admin.
              </p>
            </div>
          </div>
        </section>

        {/* Admin Features */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent flex-shrink-0" />
            <h2 className="text-2xl tracking-wider">Admin Features</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Game admins have access to additional controls via the gear icon in
              the header.
            </p>
            <ul className="space-y-1.5 list-none">
              <li className="flex gap-2">
                <span className="text-accent">--</span>
                <span><span className="text-foreground font-medium">Add/Remove Players</span> -- manage who is in the game during setup</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">--</span>
                <span><span className="text-foreground font-medium">Start Draft</span> -- begin batch 1 and batch 2 picking phases</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">--</span>
                <span><span className="text-foreground font-medium">Pick on Behalf</span> -- make picks for players who are absent</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">--</span>
                <span><span className="text-foreground font-medium">Reveal Numbers</span> -- assign random digits to rows and columns</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">--</span>
                <span><span className="text-foreground font-medium">Enter Scores</span> -- input team scores at the end of each quarter</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">--</span>
                <span><span className="text-foreground font-medium">Edit Settings</span> -- change game code, team names, player names, and PINs</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">--</span>
                <span><span className="text-foreground font-medium">Promote/Demote Admins</span> -- grant or revoke admin access for other players</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">--</span>
                <span><span className="text-foreground font-medium">Reset Game</span> -- start over by clearing all picks and scores</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Theme and Personalization */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent flex-shrink-0" />
            <h2 className="text-2xl tracking-wider">Personalization</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="text-foreground font-medium">Dark / Light Mode:</span>{" "}
              Toggle between dark and light themes using the sun/moon icon in
              the header. Your preference is saved locally.
            </p>
            <p>
              <span className="text-foreground font-medium">Team Colors:</span>{" "}
              Choose a team color theme below the scoreboard. The app will adopt
              that team's color palette. Tap the same team again to return to the
              neutral theme.
            </p>
          </div>
        </section>

        {/* Tips */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent flex-shrink-0" />
            <h2 className="text-2xl tracking-wider">Tips</h2>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-none">
            <li className="flex gap-2">
              <span className="text-accent">--</span>
              <span>The grid updates in real-time -- no need to refresh</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent">--</span>
              <span>Your own squares are highlighted with a distinct border so you can spot them easily</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent">--</span>
              <span>Winning squares show a gold trophy icon and quarter labels</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent">--</span>
              <span>Runner-up squares have a silver ring indicator</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent">--</span>
              <span>Each player has a unique color -- check the player legend below the grid</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent">--</span>
              <span>Works great on mobile -- the grid scrolls horizontally if needed</span>
            </li>
          </ul>
        </section>

        {/* Back to home */}
        <div className="pt-4 pb-8 text-center">
          <Link
            href="/"
            className="text-sm text-primary hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
