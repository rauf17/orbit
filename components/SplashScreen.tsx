"use client";
import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExit(true);
    }, 2800);
    const removeTimer = setTimeout(() => {
      onComplete();
    }, 3100);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#ffffff] flex flex-col items-center justify-center transition-opacity duration-300 ease-in ${
        exit ? "opacity-0" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes drawCircle {
          from { stroke-dashoffset: 88; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes orbitDot {
          from { transform: rotate(0deg) translateX(14px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(14px) rotate(-360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes expandLine {
          from { width: 0; }
          to { width: 80px; }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      {/* Orbit SVG */}
      <div className="relative w-[32px] h-[32px] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" className="absolute inset-0">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="#242424"
            strokeWidth="2"
            strokeDasharray="88"
            strokeDashoffset="88"
            style={{ animation: "drawCircle 600ms ease 100ms forwards" }}
          />
        </svg>
        <div
          className="absolute w-[6px] h-[6px] bg-[#242424] rounded-full"
          style={{ animation: "orbitDot 1.5s linear infinite" }}
        />
      </div>

      <h1
        className="mt-[24px] text-[48px] font-display font-semibold text-[#242424] opacity-0"
        style={{ animation: "fadeUp 400ms ease 400ms forwards" }}
      >
        Orbit
      </h1>

      <p
        className="mt-[8px] text-[16px] font-sans text-[#898989] opacity-0"
        style={{ animation: "fadeIn 400ms ease 700ms forwards" }}
      >
        Every timezone. One orbit.
      </p>

      <div
        className="mt-[24px] h-[1px] bg-[#e5e5e5]"
        style={{ animation: "expandLine 400ms ease 900ms forwards", width: "0" }}
      />

      {/* Progress Bar */}
      <div
        className="fixed bottom-0 left-0 h-[2px] bg-[#242424]"
        style={{ animation: "progress 2.2s ease-in-out 200ms forwards", width: "0%" }}
      />
    </div>
  );
}
