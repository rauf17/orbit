'use client';
export function OrbitIcon({ 
  size = 18, 
  speed = 3,
}: { 
  size?: number;
  speed?: number;
}) {
  const id = `orbit-${size}-${speed}`;
  return (
    <>
      <style>{`
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .orbit-dot-${id} {
          animation: orbitSpin ${speed}s linear infinite;
          transform-origin: 12px 12px;
        }
      `}</style>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none"
      >
        <circle 
          cx="12" cy="12" r="9" 
          stroke="currentColor" 
          strokeWidth="1.5"
        />
        <g className={`orbit-dot-${id}`}>
          <circle cx="12" cy="3" r="2.5" fill="currentColor"/>
        </g>
      </svg>
    </>
  );
}
