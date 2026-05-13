"use client";

import React from "react";

const SolarGradientEngine = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-white">
      <style>{`
        @keyframes sunBreathing {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .solar-gradient-core {
          position: absolute;
          inset: -10%;
          background: radial-gradient(
            circle at center,
            #FFFDEB 0%,
            #FFFDEB 20%,
            #FFFFFF 70%,
            #FFFFFF 100%
          );
          animation: sunBreathing 20s ease-in-out infinite;
          filter: blur(40px);
        }
      `}</style>
      <div className="solar-gradient-core" aria-hidden="true" />
    </div>
  );
};

export default SolarGradientEngine;
