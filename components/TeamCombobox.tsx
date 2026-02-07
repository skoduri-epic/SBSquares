"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { NFL_TEAMS, type NflTeam, ESPN_LOGO_URL } from "~/lib/constants";
import { cn } from "~/lib/utils";

interface TeamComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function TeamCombobox({
  value,
  onChange,
  placeholder = "e.g. Chiefs",
  className,
  autoFocus,
}: TeamComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const query = inputValue.trim().toLowerCase();
  const filtered = query
    ? NFL_TEAMS.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.city.toLowerCase().includes(query) ||
          t.abbreviation.toLowerCase().includes(query)
      )
    : NFL_TEAMS;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightIndex]) {
        (items[highlightIndex] as HTMLElement).scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [highlightIndex]);

  const selectTeam = useCallback(
    (team: NflTeam) => {
      setInputValue(team.name);
      onChange(team.name);
      setOpen(false);
      setHighlightIndex(-1);
    },
    [onChange]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setOpen(true);
    setHighlightIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    // Custom option counts as an extra item at the end of the list
    const hasCustomOption = filtered.length === 0 && query.length > 0;
    const totalItems = filtered.length + (hasCustomOption ? 1 : 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          selectTeam(filtered[highlightIndex]);
        } else if (hasCustomOption || (highlightIndex === filtered.length && hasCustomOption)) {
          // Accept custom name
          onChange(inputValue.trim());
          setOpen(false);
          setHighlightIndex(-1);
        } else {
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        setHighlightIndex(-1);
        break;
    }
  }

  // Find the currently matched team for the logo preview
  const matchedTeam = NFL_TEAMS.find(
    (t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        {matchedTeam && (
          <img
            src={ESPN_LOGO_URL(matchedTeam.abbreviation)}
            alt=""
            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 object-contain pointer-events-none"
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={30}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && highlightIndex >= 0
              ? `${listboxId}-${highlightIndex}`
              : undefined
          }
          aria-autocomplete="list"
          className={cn(
            "w-full bg-input border border-border rounded-lg py-2 text-sm",
            matchedTeam ? "pl-9 pr-3" : "px-3"
          )}
        />
      </div>

      {open && (filtered.length > 0 || inputValue.trim()) && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg"
        >
          {filtered.map((team, i) => (
            <li
              key={team.abbreviation}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectTeam(team);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors",
                i === highlightIndex && "bg-secondary text-secondary-foreground",
                matchedTeam?.abbreviation === team.abbreviation &&
                  "font-medium"
              )}
            >
              <img
                src={ESPN_LOGO_URL(team.abbreviation)}
                alt=""
                className="w-5 h-5 object-contain flex-shrink-0"
              />
              <span>{team.name}</span>
              <span className="ml-auto text-xs text-muted-foreground uppercase">
                {team.abbreviation}
              </span>
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: team.primaryColor }}
              />
            </li>
          ))}
          {filtered.length === 0 && query.length > 0 && (
            <li
              id={`${listboxId}-${filtered.length}`}
              role="option"
              aria-selected={highlightIndex === filtered.length}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(inputValue.trim());
                setOpen(false);
                setHighlightIndex(-1);
              }}
              onMouseEnter={() => setHighlightIndex(filtered.length)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors italic",
                highlightIndex === filtered.length
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              Use &ldquo;{inputValue.trim()}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
