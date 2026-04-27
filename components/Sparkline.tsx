"use client";

import React, { useMemo } from "react";
import { City } from "../lib/cities";
import { getLocalHourAtUTC } from "../lib/timeUtils";

interface SparklineProps {
  cities: City[];
  selectedDate: Date;
  sliderPercent: number;
}

export const Sparkline = ({ cities, selectedDate, sliderPercent }: SparklineProps) => {
  const data = useMemo(() => {
    if (cities.length === 0) return Array(24).fill(0);
    
    return Array.from({ length: 24 }, (_, utcH) => {
      const availableCount = cities.filter(city => {
        const h = getLocalHourAtUTC(utcH, city.timezone, selectedDate);
        return h >= 9 && h < 17;
      }).length;
      return availableCount / cities.length;
    });
  }, [cities, selectedDate]);

  const getColor = (score: number) => {
    if (score >= 0.5) return "#16a34a"; // green
    if (score > 0) return "#fbbf24";    // amber
    return "#898989";                  // muted gray
  };

  return (
    <div className="w-full h-8 relative mb-1 pointer-events-none">
      <svg width="100%" height="32" viewBox="0 0 240 32" preserveAspectRatio="none" className="overflow-visible">
        {data.map((score, i) => {
          const h = score * 32;
          const color = getColor(score);
          return (
            <g key={i}>
              {/* Fill area */}
              <rect
                x={i * 10}
                y={32 - h}
                width="10"
                height={h}
                fill={color}
                fillOpacity="0.15"
              />
              {/* Top edge line */}
              {h > 0 && (
                <line
                  x1={i * 10}
                  y1={32 - h}
                  x2={(i + 1) * 10}
                  y2={32 - h}
                  stroke={color}
                  strokeWidth="1"
                  strokeOpacity="1"
                />
              )}
            </g>
          );
        })}

        {/* Tracking Dot */}
        <circle
          cx={(sliderPercent / 100) * 240}
          cy={16}
          r="3"
          className="fill-gray-800 dark:fill-white shadow-lg"
          style={{
            filter: "drop-shadow(0 0 2px rgba(0,0,0,0.3))",
            transition: 'cx 120ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </svg>
    </div>
  );
};
