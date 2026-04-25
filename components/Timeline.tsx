"use client";

import React, { useState, useRef, useMemo } from "react";
import { City } from "../lib/cities";
import {
  hourToPercent,
  getOverlapHours,
  formatTime,
  getOffsetString,
} from "../lib/timeUtils";

interface TimelineProps {
  cities: City[];
  now: Date;
  timeFormat: "12h" | "24h";
  onRemoveCity: (cityId: string) => void;
  onReorderCities: (from: number, to: number) => void;
}

const DragHandleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 3C4.5 3.55228 4.05228 4 3.5 4C2.94772 4 2.5 3.55228 2.5 3C2.5 2.44772 2.94772 2 3.5 2C4.05228 2 4.5 2.44772 4.5 3Z" />
    <path d="M4.5 7C4.5 7.55228 4.05228 8 3.5 8C2.94772 8 2.5 7.55228 2.5 7C2.5 6.44772 2.94772 6 3.5 6C4.05228 6 4.5 6.44772 4.5 7Z" />
    <path d="M4.5 11C4.5 11.5523 4.05228 12 3.5 12C2.94772 12 2.5 11.5523 2.5 11C2.5 10.4477 2.94772 10 3.5 10C4.05228 10 4.5 10.4477 4.5 11Z" />
    <path d="M10.5 3C10.5 3.55228 10.0523 4 9.5 4C8.94772 4 8.5 3.55228 8.5 3C8.5 2.44772 8.94772 2 9.5 2C10.0523 2 10.5 2.44772 10.5 3Z" />
    <path d="M10.5 7C10.5 7.55228 10.0523 8 9.5 8C8.94772 8 8.5 7.55228 8.5 7C8.5 6.44772 8.94772 6 9.5 6C10.0523 6 10.5 6.44772 10.5 7Z" />
    <path d="M10.5 11C10.5 11.5523 10.0523 12 9.5 12C8.94772 12 8.5 11.5523 8.5 11C8.5 10.4477 8.94772 10 9.5 10C10.0523 10 10.5 10.4477 10.5 11Z" />
  </svg>
);

const RemoveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const getCityTimeShift = (timezone: string) => {
  const d = new Date();
  const cityTime = new Date(d.toLocaleString("en-US", { timeZone: timezone })).getTime();
  const localTime = new Date(d.toLocaleString("en-US")).getTime();
  return (cityTime - localTime) / 3600000;
};

const TimelineBar = ({ city }: { city: City }) => {
  const shift = useMemo(() => getCityTimeShift(city.timezone), [city.timezone]);

  const renderSegment = (start: number, end: number, classes: string) => {
    return [-1, 0, 1].map((day) => {
      const localStart = start - shift + day * 24;
      const localEnd = end - shift + day * 24;
      if (localEnd <= 0 || localStart >= 24) return null;

      const left = Math.max(0, localStart) / 24 * 100;
      const right = Math.min(24, localEnd) / 24 * 100;
      const width = right - left;
      if (width <= 0) return null;

      return (
        <div
          key={`${day}-${start}`}
          className={`absolute top-0 bottom-0 ${classes}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      );
    });
  };

  return (
    <div className="h-[48px] w-full relative rounded-[8px] overflow-hidden shadow-sm border border-[rgba(34,42,53,0.08)] bg-white">
      {/* Deep Night 0-6 */}
      {renderSegment(0, 6, "bg-[#f0f0f0]")}
      {/* Deep Night 18-24 */}
      {renderSegment(18, 24, "bg-[#f0f0f0]")}

      {/* Shoulder 6-9 */}
      {renderSegment(6, 9, "bg-[#e8eeff]")}
      {/* Shoulder 17-18 */}
      {renderSegment(17, 18, "bg-[#e8eeff]")}

      {/* Working 9-17 */}
      {renderSegment(9, 17, "bg-[#ffffff] border-y border-[rgba(34,42,53,0.08)]")}

      {/* Working Overlay */}
      {renderSegment(9, 17, "bg-[rgba(22,163,74,0.05)] border-x-[2px] border-[rgba(22,163,74,0.25)]")}
    </div>
  );
};

export default function Timeline({
  cities,
  now,
  timeFormat,
  onRemoveCity,
  onReorderCities,
}: TimelineProps) {
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rightAreaLeft = rect.left + 220; // 220px is left sidebar
    const rightAreaWidth = rect.width - 220;
    const x = e.clientX - rightAreaLeft;

    if (x >= 0 && x <= rightAreaWidth) {
      setHoverPercent((x / rightAreaWidth) * 100);
    } else {
      setHoverPercent(null);
    }
  };

  const handleMouseLeave = () => setHoverPercent(null);

  const handleRemove = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onRemoveCity(id);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  };

  // Group continuous overlap blocks
  const blocks = useMemo(() => {
    if (cities.length === 0) return [];
    const overlaps = getOverlapHours(cities.map((c) => c.timezone));
    const res: { start: number; end: number }[] = [];
    if (overlaps.length > 0) {
      let start = overlaps[0];
      let prev = overlaps[0];
      for (let i = 1; i <= overlaps.length; i++) {
        if (i === overlaps.length || overlaps[i] !== prev + 1) {
          res.push({ start, end: prev + 1 });
          if (i < overlaps.length) {
            start = overlaps[i];
            prev = overlaps[i];
          }
        } else {
          prev = overlaps[i];
        }
      }
    }
    return res;
  }, [cities]);

  const baseShift = cities.length > 0 ? getCityTimeShift(cities[0].timezone) : 0;
  const nowPercent = hourToPercent(now.getHours(), now.getMinutes());

  const getTooltipTime = (percent: number, timezone: string) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const totalMinutes = Math.round((percent / 100) * 24 * 60);
    const targetDate = new Date(d.getTime() + totalMinutes * 60 * 1000);
    return formatTime(targetDate, timezone, timeFormat);
  };

  const hoverDate = useMemo(() => {
    if (hoverPercent === null) return now;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const totalMinutes = Math.round((hoverPercent / 100) * 24 * 60);
    return new Date(d.getTime() + totalMinutes * 60 * 1000);
  }, [hoverPercent, now]);

  const markers = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(16px); }
        }
      `}</style>

      <div
        className="w-full relative select-none"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex w-full">
          <div className="w-[220px] flex-shrink-0" />
          <div className="flex-1 min-w-0 relative h-[28px]">
            {markers.map((h) => {
              const label =
                timeFormat === "24h"
                  ? h.toString().padStart(2, "0")
                  : `${h % 12 || 12}${h >= 12 ? "pm" : "am"}`;
              return (
                <div
                  key={h}
                  className="absolute text-[10px] font-sans text-[#b0b0b0] -translate-x-1/2 bottom-1"
                  style={{ left: `${(h / 24) * 100}%` }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rows Container */}
        <div className="relative w-full">
          {/* Overlap Zone */}
          <div className="absolute top-0 bottom-0 right-0 w-[calc(100%-220px)] pointer-events-none z-10">
            {blocks.map((block, idx) => {
              return [-1, 0, 1].map((day) => {
                const localStart = block.start - baseShift + day * 24;
                const localEnd = block.end - baseShift + day * 24;
                if (localEnd <= 0 || localStart >= 24) return null;

                const left = Math.max(0, localStart) / 24 * 100;
                const right = Math.min(24, localEnd) / 24 * 100;
                const width = right - left;
                if (width <= 0) return null;

                return (
                  <div
                    key={`${idx}-${day}`}
                    className="absolute top-0 bottom-0 bg-[rgba(22,163,74,0.12)] border border-[rgba(22,163,74,0.3)] rounded-[4px]"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {idx === 0 && day === 0 && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[rgba(22,163,74,0.1)] text-[#16a34a] text-[10px] font-semibold font-sans px-[10px] py-[3px] rounded-full whitespace-nowrap">
                        ✓ Best overlap
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>

          {/* Now Indicator */}
          <div className="absolute top-0 bottom-0 right-0 w-[calc(100%-220px)] pointer-events-none z-20">
            <div
              className="absolute top-0 bottom-0 w-[1.5px] bg-[#242424] transition-all duration-1000 ease-linear"
              style={{ left: `${nowPercent}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#242424] rounded-full" />
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white shadow-sm rounded-[4px] flex items-center justify-center px-[6px] py-[2px] text-[10px] font-semibold text-[#242424] whitespace-nowrap">
                {formatTime(
                  now,
                  Intl.DateTimeFormat().resolvedOptions().timeZone,
                  timeFormat
                )}
              </div>
            </div>
          </div>

          {/* Hover Tooltip & Line */}
          <div className="absolute top-0 bottom-0 right-0 w-[calc(100%-220px)] pointer-events-none z-30">
            {hoverPercent !== null && (
              <>
                <div
                  className="absolute top-0 bottom-0 w-px border-l border-dashed border-[#d0d0d0]"
                  style={{ left: `${hoverPercent}%` }}
                />
                <div
                  className="absolute z-40 bg-white shadow-lg rounded-[10px] px-3.5 py-3 min-w-[180px] pointer-events-none"
                  style={{
                    left: `calc(${hoverPercent}% + 16px)`,
                    top: "20px",
                    transform: hoverPercent > 70 ? "translateX(-100%)" : "none",
                    marginLeft: hoverPercent > 70 ? "-32px" : "0",
                  }}
                >
                  <div className="text-[12px] font-semibold text-[#898989] mb-2 font-sans">
                    UTC · {formatTime(hoverDate, "UTC", timeFormat)}
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    {cities.map((c) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{c.emoji}</span>
                          <span className="text-[12px] font-display font-semibold text-[#242424]">
                            {c.name}
                          </span>
                        </div>
                        <span className="text-[13px] font-semibold text-[#242424] font-sans">
                          {getTooltipTime(hoverPercent, c.timezone).replace(
                            / (AM|PM)/i,
                            (m) => m.toLowerCase()
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rows */}
          <div className="relative">
            {cities.map((city, idx) => (
              <div
                key={city.id}
                className={`flex w-full h-[80px] items-center group relative border-b border-[rgba(34,42,53,0.05)] py-4 ${
                  dragOverIdx === idx ? "border-t-[2px] border-t-[#242424]" : ""
                }`}
                style={{
                  animation: removingIds.has(city.id)
                    ? "slideOut 200ms ease-out forwards"
                    : `slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 80}ms both`,
                  opacity: draggedIdx === idx ? 0.4 : 1,
                }}
                draggable="true"
                onDragStart={(e) => {
                  setDraggedIdx(idx);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIdx(idx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIdx !== null && draggedIdx !== idx) {
                    onReorderCities(draggedIdx, idx);
                  }
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
              >
                {/* Left Sidebar */}
                <div className="w-[220px] h-full flex-shrink-0 pr-4 relative flex items-center">
                  <div className="absolute left-0 opacity-0 group-hover:opacity-100 cursor-grab text-[#b0b0b0] p-2 -ml-4">
                    <DragHandleIcon />
                  </div>

                  <div className="flex flex-col w-full pl-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] leading-none">{city.emoji}</span>
                      <span className="text-[14px] font-display font-semibold text-[#242424] leading-none truncate">
                        {city.name}
                      </span>
                    </div>
                    <div className="text-[11px] font-sans text-[#898989] mt-1 truncate">
                      {city.country}
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <div className="text-[20px] font-sans font-bold text-[#242424] leading-none tracking-tight">
                        {formatTime(now, city.timezone, timeFormat)}
                      </div>
                      <div className="text-[10px] font-sans bg-[#f5f5f5] border border-[rgba(34,42,53,0.08)] rounded-[4px] px-[8px] py-[2px] text-[#898989]">
                        {getOffsetString(city.timezone)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(city.id)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[#898989] hover:text-[#242424] p-1"
                  >
                    <RemoveIcon />
                  </button>
                </div>

                {/* Right Area (Timeline Bar) */}
                <div className="flex-1 min-w-0 relative flex items-center h-full">
                  <TimelineBar city={city} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
