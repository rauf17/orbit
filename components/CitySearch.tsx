"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { City, cities as allCities } from "../lib/cities";
import { formatTime, getOffsetString } from "../lib/timeUtils";

interface CitySearchProps {
  onAddCity: (city: City) => void;
  selectedCities: City[];
  maxCities: number;
  now: Date;
  timeFormat: "12h" | "24h";
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const CONTINENTS = [
  { name: "All", emoji: "🌍" },
  { name: "Americas", emoji: "🌎" },
  { name: "Europe", emoji: "🇪🇺" },
  { name: "Asia", emoji: "🌏" },
  { name: "Middle East", emoji: "🕌" },
  { name: "Oceania", emoji: "🏝️" },
  { name: "Africa", emoji: "🐘" }
];

const matchContinent = (city: City, filter: string) => {
  if (filter === "All") return true;
  if (filter === "Americas") return city.continent === "North America" || city.continent === "South America";
  
  if (filter === "Middle East") {
    return ["AE", "SA", "QA", "KW", "OM"].includes(city.countryCode);
  }
  if (filter === "Asia") {
    return city.continent === "Asia" && !["AE", "SA", "QA", "KW", "OM"].includes(city.countryCode);
  }
  
  return city.continent === filter;
};

export default function CitySearch({
  onAddCity,
  selectedCities,
  maxCities,
  now: initialNow,
  timeFormat,
}: CitySearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContinent, setSelectedContinent] = useState("All");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [now, setNow] = useState(initialNow);
  const [addedId, setAddedId] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const disabled = selectedCities.length >= maxCities;

  // Sync internal clock for live time in results
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(t);
  }, [isOpen]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen && !disabled) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [isOpen, disabled]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedContinent("All");
      setHighlightedIndex(0);
      setAddedId(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCities = useMemo(() => {
    return allCities
      .filter((c) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          c.name.toLowerCase().includes(query) ||
          c.country.toLowerCase().includes(query);
        const matchesContinent = matchContinent(c, selectedContinent);
        return matchesSearch && matchesContinent;
      })
      .slice(0, 8);
  }, [searchQuery, selectedContinent]);

  // Reset highlight when list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCities]);

  const handleAdd = (city: City) => {
    if (selectedCities.some(c => c.id === city.id)) return;
    setAddedId(city.id);
    onAddCity(city);
    // Tiny delay before closing
    setTimeout(() => setIsOpen(false), 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredCities.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const city = filteredCities[highlightedIndex];
      if (city) handleAdd(city);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef} style={{ zIndex: 9999 }}>
      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes addedIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title={disabled ? "Max 6 cities" : undefined}
        className={`flex items-center gap-2 bg-[var(--bg-page)] rounded-[8px] px-4 py-2.5 shadow-sm border border-[var(--border-default)] text-[14px] font-sans font-semibold text-[var(--text-primary)] transition-all duration-150
          ${
            disabled
              ? "opacity-40 cursor-not-allowed"
              : "hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 active:shadow-sm"
          }
        `}
      >
        <PlusIcon />
        <span>Add City</span>
        {!disabled && !isOpen && (
          <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1 hidden md:inline">
            (press /)
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="city-search-dropdown absolute left-0 w-[340px] bg-[var(--bg-elevated)] rounded-[12px] shadow-lg border border-[var(--border-default)] overflow-hidden flex flex-col"
          style={{ zIndex: 9999, top: 'calc(100% + 8px)', animation: "popoverIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards", position: 'absolute', isolation: 'isolate' }}
        >
          {/* Search Input */}
          <div className="flex items-center w-full px-4 border-b border-[var(--border-default)]">
            <div className="text-[var(--text-muted)]">
              <SearchIcon />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search cities or countries..."
              className="w-full bg-transparent px-3 py-3 text-[14px] font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
            />
          </div>

          {/* Continent Filters */}
          <div className="flex overflow-x-auto gap-[6px] px-3 py-2.5 border-b border-[var(--border-default)] hide-scrollbar">
            {CONTINENTS.map((cont) => (
              <button
                key={cont.name}
                onClick={() => setSelectedContinent(cont.name)}
                className={`px-[10px] py-[3.5px] rounded-full text-[11px] font-sans font-medium whitespace-nowrap transition-colors flex items-center gap-1.5
                  ${
                    selectedContinent === cont.name
                      ? "bg-[var(--text-primary)] text-[var(--bg-page)]"
                      : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                  }
                `}
              >
                <span>{cont.emoji}</span>
                <span>{cont.name}</span>
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="max-h-[280px] overflow-y-auto p-2">
            {filteredCities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="text-2xl mb-2">🌍</span>
                <span className="text-[13px] font-sans text-[var(--text-secondary)]">No cities found</span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filteredCities.map((city, idx) => {
                  const isAdded = selectedCities.some((c) => c.id === city.id);
                  const isHighlighted = highlightedIndex === idx && !isAdded;
                  const isJustAdded = addedId === city.id;

                  return (
                    <div
                      key={city.id}
                      onClick={() => !isAdded && handleAdd(city)}
                      onMouseEnter={() => !isAdded && setHighlightedIndex(idx)}
                      className={`flex items-center justify-between px-2.5 py-2.5 rounded-[8px] transition-colors
                        ${isAdded ? "cursor-default" : "cursor-pointer"}
                        ${isHighlighted ? "bg-[var(--bg-surface)]" : "bg-transparent"}
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[20px] leading-none flex-shrink-0">{city.emoji}</span>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-[13px] font-display font-semibold leading-tight truncate
                              ${isAdded ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}
                            `}
                          >
                            {city.name}
                          </span>
                          <span
                            className={`text-[11px] font-sans leading-tight truncate mt-0.5
                              ${isAdded ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"}
                            `}
                          >
                            {city.country}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                        {isJustAdded ? (
                          <div className="bg-[rgba(22,163,74,0.1)] text-[#16a34a] text-[10px] font-bold px-2 py-1 rounded-md" style={{ animation: 'addedIn 200ms ease' }}>
                            Added!
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span
                              className={`text-[12px] font-sans font-semibold leading-tight tabular-nums
                                ${isAdded ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}
                              `}
                            >
                              {formatTime(now, city.timezone, timeFormat)}
                            </span>
                            <span
                              className={`text-[10px] font-sans leading-tight mt-0.5
                                ${isAdded ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"}
                              `}
                            >
                              {getOffsetString(city.timezone)}
                            </span>
                          </div>
                        )}
                        {isAdded && !isJustAdded && (
                          <div className="text-[#16a34a]">
                            <CheckIcon />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
