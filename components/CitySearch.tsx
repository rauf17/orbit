"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { City, cities as allCities } from "../lib/cities";
import { formatTime } from "../lib/timeUtils";

interface CitySearchProps {
  selectedCities: City[];
  onAddCity: (city: City) => void;
  maxCities: number;
  now: Date;
}

export default function CitySearch({
  selectedCities,
  onAddCity,
  maxCities,
  now,
}: CitySearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIds = useMemo(
    () => new Set(selectedCities.map((c) => c.id)),
    [selectedCities]
  );

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCities.slice(0, 8);
    }
    const lowerQuery = searchQuery.toLowerCase();
    return allCities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.country.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8);
  }, [searchQuery]);

  const isAtMax = selectedCities.length >= maxCities;

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleMouseDown);
    }
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleAdd = (city: City) => {
    if (selectedIds.has(city.id) || isAtMax) return;
    onAddCity(city);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white rounded-lg px-[16px] py-[12px] font-inter font-semibold text-[14px] text-[#242424] transition-all duration-150 outline-none"
        style={{
          boxShadow: isOpen ? "var(--shadow-md)" : "var(--shadow-sm)",
          transform: isOpen ? "translateY(-1px)" : "none",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            e.currentTarget.style.transform = "none";
          }
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 1V13M1 7H13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Add City
      </button>

      {/* SEARCH DROPDOWN */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-[320px] bg-white rounded-xl p-[8px] z-50 overflow-hidden"
          style={{
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-default)",
          }}
        >
          {isAtMax ? (
            <div className="p-4 text-center text-[13px] font-inter text-[#898989]">
              Maximum {maxCities} cities reached
            </div>
          ) : (
            <>
              {/* SEARCH INPUT */}
              <div className="mb-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-inter text-[14px] text-[#242424] placeholder-[#898989] px-[8px] py-[12px]"
                  style={{ borderBottom: "1px solid var(--border-default)" }}
                />
              </div>

              {/* RESULTS LIST */}
              <div className="max-h-[280px] overflow-y-auto overflow-x-hidden">
                {filteredCities.length === 0 ? (
                  <div className="py-4 text-center text-[13px] font-inter text-[#898989]">
                    No cities found
                  </div>
                ) : (
                  filteredCities.map((city) => {
                    const isSelected = selectedIds.has(city.id);

                    return (
                      <button
                        key={city.id}
                        onClick={() => handleAdd(city)}
                        disabled={isSelected}
                        className={`w-full flex items-center justify-between px-[8px] py-[10px] rounded-md transition-colors text-left ${
                          isSelected
                            ? "opacity-60 cursor-default"
                            : "hover:bg-[#f5f5f5] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] leading-none">
                            {city.emoji}
                          </span>
                          <div>
                            <div className="font-display font-semibold text-[14px] text-[#242424] leading-none mb-0.5">
                              {city.name}
                            </div>
                            <div className="font-inter text-[12px] text-[#898989] leading-none">
                              {city.country}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="text-[#16a34a] font-bold text-[14px]">
                              ✓
                            </span>
                          )}
                          <span className="font-inter font-semibold text-[12px] text-[#242424]">
                            {formatTime(now, city.timezone, "12h")}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
