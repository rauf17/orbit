'use client';
import { useEffect, useState } from 'react';

export default function SolarSystem() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  if (!mounted || isDark) return null;

  return (
    <>
      <style>{`
        @keyframes orbit1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbit2 { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes orbit3 { from { transform: rotate(45deg); } to { transform: rotate(405deg); } }
        @keyframes orbit4 { from { transform: rotate(180deg); } to { transform: rotate(540deg); } }
        @keyframes sunPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .solar-ring { animation: none !important; }
          .solar-sun { animation: none !important; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          overflow: 'hidden', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transform: 'translateX(30%)',
        }}
      >
        {/* Sun glow */}
        <div className="solar-sun" style={{
          position: 'absolute', width: 80, height: 80, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(245,158,11,0.12) 50%, transparent 70%)',
          animation: 'sunPulse 4s ease-in-out infinite', filter: 'blur(8px)',
        }} />
        {/* Sun core */}
        <div style={{
          position: 'absolute', width: 16, height: 16, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.5), rgba(251,191,36,0.2))',
          filter: 'blur(2px)',
        }} />
        {/* Ring 1 — 180px */}
        <div className="solar-ring" style={{
          position: 'absolute', width: 180, height: 180, borderRadius: '50%',
          border: '1px dashed rgba(0,0,0,0.07)', animation: 'orbit1 12s linear infinite',
        }}>
          <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'rgba(100,116,139,0.4)', boxShadow: '0 0 4px rgba(100,116,139,0.3)' }} />
        </div>
        {/* Ring 2 — 320px */}
        <div className="solar-ring" style={{
          position: 'absolute', width: 320, height: 320, borderRadius: '50%',
          border: '1px dashed rgba(0,0,0,0.05)', animation: 'orbit2 28s linear infinite',
        }}>
          <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: 'rgba(148,163,184,0.35)', boxShadow: '0 0 6px rgba(148,163,184,0.2)' }} />
        </div>
        {/* Ring 3 — 480px */}
        <div className="solar-ring" style={{
          position: 'absolute', width: 480, height: 480, borderRadius: '50%',
          border: '1px dashed rgba(0,0,0,0.04)', animation: 'orbit3 55s linear infinite',
        }}>
          <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: '50%', background: 'rgba(203,213,225,0.4)' }} />
          <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: 'rgba(245,158,11,0.25)' }} />
        </div>
        {/* Ring 4 — 680px */}
        <div className="solar-ring" style={{
          position: 'absolute', width: 680, height: 680, borderRadius: '50%',
          border: '1px dashed rgba(0,0,0,0.03)', animation: 'orbit4 90s linear infinite',
        }}>
          <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: 'rgba(226,232,240,0.5)' }} />
        </div>
      </div>
    </>
  );
}
