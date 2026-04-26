"use client";
import { useEffect, useState } from "react";
import { OrbitIcon } from "./OrbitIcon";

export default function SplashScreen() {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExit(true);
    }, 2800);
    return () => {
      clearTimeout(exitTimer);
    };
  }, []);

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
      <div className="relative flex items-center justify-center text-[var(--text-primary)]">
        <OrbitIcon size={40} speed={4} />
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
