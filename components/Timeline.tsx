"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { City } from "../lib/cities";
import {
  formatTime,
  getOffsetString,
  isWorkingHour,
  getTimeAtPercent,
} from "../lib/timeUtils";

interface TimelineProps {
  cities: City[];
  now: Date;
}

export default function Timeline({ cities, now }: TimelineProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  const midnight = useMemo(() => {
    const d = new Date(now.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now.getDate()]); // recompute only on day change

  const cityHours = useMemo(() => {
    const map = new Map<string, number[]>();
    cities.forEach((city) => {
      const hours = [];
      for (let i = 0; i < 24; i++) {
        const d = new Date(midnight.getTime() + i * 3600 * 1000);
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: city.timezone,
          hour: "numeric",
          hourCycle: "h23",
        }).formatToParts(d);
        const hStr = parts.find((p) => p.type === "hour")?.value || "0";
        hours.push(parseInt(hStr, 10));
      }
      map.set(city.id, hours);
    });
    return map;
  }, [cities, midnight]);

  const overlapHours = useMemo(() => {
    if (cities.length < 2) return [];
    const overlaps = [];
    for (let i = 0; i < 24; i++) {
      let allWorking = true;
      for (const city of cities) {
        const ch = cityHours.get(city.id)?.[i] ?? 0;
        if (!isWorkingHour(ch)) {
          allWorking = false;
          break;
        }
      }
      if (allWorking) overlaps.push(i);
    }
    return overlaps;
  }, [cities, cityHours]);

  const overlapSegments = useMemo(() => {
    const segments: { start: number; length: number }[] = [];
    if (overlapHours.length === 0) return segments;

    let currentStart = overlapHours[0];
    let currentLength = 1;

    for (let i = 1; i < overlapHours.length; i++) {
      if (overlapHours[i] === overlapHours[i - 1] + 1) {
        currentLength++;
      } else {
        segments.push({ start: currentStart, length: currentLength });
        currentStart = overlapHours[i];
        currentLength = 1;
      }
    }
    segments.push({ start: currentStart, length: currentLength });
    return segments;
  }, [overlapHours]);

  const currentTimePercent = useMemo(() => {
    const totalMinutes =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    return Math.min(100, Math.max(0, (totalMinutes / 1440) * 100));
  }, [now]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setHoverPercent(percent);
  };

  const systemTimezone = useMemo(() => {
    if (!mounted) return "UTC";
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="w-full">
      <style>{`
        @keyframes slideUpFade {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Header Row */}
      <div className="relative h-6 mb-2 ml-[200px]">
        {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
          <div
            key={h}
            className="absolute text-[10px] text-[#b0b0b0] font-inter transform -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h === 0
              ? "12am"
              : h < 12
              ? `${h}am`
              : h === 12
              ? "12pm"
              : `${h - 12}pm`}
          </div>
        ))}
        {/* Overlap Badges */}
        {overlapSegments.map((seg, idx) => (
          <div
            key={idx}
            className="absolute flex justify-center items-end h-full"
            style={{
              left: `${(seg.start / 24) * 100}%`,
              width: `${(seg.length / 24) * 100}%`,
            }}
          >
            <div className="bg-[rgba(22,163,74,0.1)] text-[#16a34a] text-[10px] font-inter font-semibold rounded-full px-[8px] py-[2px] whitespace-nowrap transform -translate-y-1">
              ✓ Best time
            </div>
          </div>
        ))}
      </div>

      <div className="relative w-full border-t border-[rgba(34,42,53,0.06)]">
        {/* Rows */}
        {cities.map((city, index) => (
          <div
            key={city.id}
            className="h-[72px] flex border-b border-[rgba(34,42,53,0.06)] bg-white"
            style={{
              animation: `slideUpFade 300ms cubic-bezier(0.16, 1, 0.3, 1) ${
                index * 60
              }ms forwards`,
              opacity: 0,
            }}
          >
            {/* Left Sidebar */}
            <div className="w-[200px] flex-shrink-0 flex flex-col justify-center pr-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[20px] leading-none">
                      {city.emoji}
                    </span>
                    <h3 className="font-display font-semibold text-[15px] text-[#242424] leading-none tracking-[0.2px]">
                      {city.name}
                    </h3>
                  </div>
                  <div className="text-[12px] font-inter text-[#898989] leading-tight mb-2">
                    {city.country}
                  </div>
                  <div className="inline-block bg-[#f5f5f5] border border-[rgba(34,42,53,0.08)] rounded text-[10px] font-inter text-[#898989] px-[6px] py-[2px]">
                    {getOffsetString(city.timezone)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-inter font-semibold text-[#242424] leading-none mb-1">
                    {formatTime(now, city.timezone, "12h")}
                  </div>
                  <div className="text-[11px] font-inter text-[#898989] leading-tight">
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: city.timezone,
                      month: "short",
                      day: "numeric",
                    }).format(now)}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Bar Wrapper */}
            <div className="flex-1 flex items-center relative">
              <div
                className="w-full h-[44px] flex rounded-md overflow-hidden relative"
                style={{
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const localHour = cityHours.get(city.id)?.[i] ?? 0;
                  const isMorningEvening =
                    (localHour >= 6 && localHour < 9) || localHour === 17;
                  const isWorking = localHour >= 9 && localHour < 17;
                  const isOverlap = overlapHours.includes(i);

                  let bgClass = "bg-[#f0f0f0]";
                  if (isMorningEvening) bgClass = "bg-[#e0e8ff]";
                  if (isWorking) bgClass = "bg-[#ffffff]";

                  return (
                    <div
                      key={i}
                      className={`flex-1 h-full relative ${bgClass}`}
                    >
                      {isOverlap ? (
                        <div className="absolute inset-0 bg-[rgba(22,163,74,0.12)]" />
                      ) : isWorking ? (
                        <div className="absolute inset-0 bg-[rgba(22,163,74,0.06)]" />
                      ) : null}

                      {localHour === 9 && (
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[rgba(22,163,74,0.3)] z-10" />
                      )}
                      {localHour === 16 && (
                        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-[rgba(22,163,74,0.3)] z-10" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Global Overlays Container (Exact match to timeline area) */}
        <div
          className="absolute top-0 right-0 bottom-0 left-[200px] z-30"
          ref={timelineRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPercent(null)}
        >
          {/* Current Time Indicator */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#242424] pointer-events-none transition-all duration-1000 ease-linear z-20"
            style={{ left: `${currentTimePercent}%` }}
          >
            <div className="absolute -top-[4px] -translate-x-[3px] w-[8px] h-[8px] rounded-full bg-[#242424]" />
            <div
              className="absolute top-[8px] -translate-x-1/2 bg-white text-[10px] font-inter font-semibold text-[#242424] px-1.5 py-0.5 rounded whitespace-nowrap"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              {formatTime(now, systemTimezone, "12h")}
            </div>
          </div>

          {/* Hover Ghost Line & Tooltip */}
          {hoverPercent !== null && (
            <div
              className="absolute top-0 bottom-0 w-[1px] border-l border-dashed border-[#898989] pointer-events-none z-30"
              style={{ left: `${hoverPercent}%` }}
            >
              <div
                className="absolute top-8 bg-white rounded-lg p-[12px] w-[180px]"
                style={{
                  boxShadow: "var(--shadow-lg)",
                  transform: `translateX(${
                    hoverPercent < 15
                      ? "0%"
                      : hoverPercent > 85
                      ? "-100%"
                      : "-50%"
                  })`,
                }}
              >
                {cities.map((city) => (
                  <div
                    key={city.id}
                    className="flex justify-between items-center mb-1.5 last:mb-0 text-[12px] font-inter"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] leading-none">
                        {city.emoji}
                      </span>
                      <span className="text-[#898989]">{city.name}</span>
                    </div>
                    <span className="font-semibold text-[#242424]">
                      {getTimeAtPercent(hoverPercent, city.timezone)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
