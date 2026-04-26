'use client';
import { useEffect, useState, useMemo } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export default function Starfield() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const stars = useMemo<Star[]>(() => 
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: i < 60 ? 1 : i < 75 ? 1.5 : 2.5,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      opacity: 0.3 + Math.random() * 0.5,
    }))
  , []);

  useEffect(() => {
    setMounted(true);
    const check = () => {
      setIsDark(
        document.documentElement.getAttribute('data-theme') === 'dark'
      );
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  if (!mounted || !isDark) return null;

  return (
    <>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes shootingStar {
          0% { transform: translateX(0) translateY(0); opacity: 1; }
          100% { transform: translateX(200px) translateY(100px); opacity: 0; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        {stars.map(star => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              backgroundColor: star.id % 7 === 0 
                ? 'rgba(180,200,255,0.9)'
                : 'rgba(255,255,255,0.85)',
              boxShadow: star.size > 2 
                ? `0 0 ${star.size * 2}px rgba(255,255,255,0.6)` 
                : 'none',
              animation: `twinkle ${star.duration}s ${star.delay}s ease-in-out infinite`,
            }}
          />
        ))}
        {/* 3 shooting stars */}
        {[0,1,2].map(i => (
          <div key={`shoot-${i}`} style={{
            position: 'absolute',
            left: `${20 + i * 30}%`,
            top: `${10 + i * 15}%`,
            width: 60,
            height: 1,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.8), transparent)',
            borderRadius: 1,
            animation: `shootingStar ${8 + i * 4}s ${i * 6}s linear infinite`,
          }} />
        ))}
      </div>
    </>
  );
}
