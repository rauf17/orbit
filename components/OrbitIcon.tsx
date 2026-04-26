'use client';

import React, { memo } from 'react';

export const OrbitIcon = memo(function OrbitIcon({ 
  size = 18, 
  speed = 3,
  className = "",
}: { 
  size?: number; 
  speed?: number;
  className?: string;
}) {
  return (
    <>
      <style>{`
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .orbit-spinning {
          animation: orbitSpin var(--orbit-speed, 3s) linear infinite;
          transform-origin: center center;
        }
      `}</style>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none"
        className={className}
        style={{ '--orbit-speed': `${speed}s` } as React.CSSProperties}
      >
        <circle 
          cx="12" cy="12" r="9" 
          stroke="currentColor" 
          strokeWidth="1.5"
        />
        <g className="orbit-spinning">
          <circle cx="12" cy="3" r="2.5" fill="currentColor"/>
        </g>
      </svg>
    </>
  );
});
