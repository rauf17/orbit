'use client';

import { useMemo } from 'react';
import { City } from '../lib/cities';
import { getLocalHourAtUTC } from '../lib/timeUtils';

interface SparklineProps {
  cities: City[];
  sliderPercent: number;
}

export default function AvailabilitySparkline({ 
  cities, 
  sliderPercent 
}: SparklineProps) {
  const points = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => {
      if (cities.length === 0) return 0;
      const available = cities.filter(c => {
        const localH = getLocalHourAtUTC(h, c.timezone);
        return localH >= 9 && localH < 17;
      }).length;
      return available / cities.length;
    });
  }, [cities]);

  const width = 100;
  const height = 32;
  const pointWidth = width / 24;

  const pathD = points.map((p, i) => {
    const x = i * pointWidth + pointWidth / 2;
    const y = height - (p * (height - 4)) - 2;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const fillD = pathD + 
    ` L ${width} ${height} L 0 ${height} Z`;

  const sliderX = (sliderPercent / 100) * width;

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: height,
      marginBottom: 28, // Increased to accommodate labels
      marginTop: 24,
    }}>
      <div style={{
        position: 'absolute',
        top: -16,
        left: 0,
        fontSize: 10,
        color: 'var(--text-muted)',
        fontFamily: 'Inter, sans-serif'
      }}>
        Team availability across 24h
      </div>
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ 
          width: '100%', 
          height: '100%',
          overflow: 'visible'
        }}
      >
        {/* Fill area */}
        <path
          d={fillD}
          fill="rgba(22,163,74,0.08)"
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(22,163,74,0.4)"
          strokeWidth="0.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Peak dots — only show hours where ALL cities available */}
        {points.map((p, i) => p === 1 && (
          <circle
            key={i}
            cx={i * pointWidth + pointWidth / 2}
            cy={height - (p * (height - 4)) - 2}
            r={1.5}
            fill="#16a34a"
            opacity={0.8}
          />
        ))}
        {/* Cursor line on sparkline */}
        <line
          x1={sliderX}
          y1={0}
          x2={sliderX}
          y2={height}
          stroke="var(--text-primary)"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity={0.4}
        />
      </svg>
      {/* Axis labels */}
      <div style={{
        position: 'absolute',
        bottom: -14,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        {['12am','6am','12pm','6pm','12am'].map((l, i) => (
          <span key={i} style={{ 
            fontSize: 8, 
            color: 'var(--text-muted)',
            fontFamily: 'Inter, sans-serif'
          }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
