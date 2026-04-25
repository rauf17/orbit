"use client";
import { useState, useEffect } from "react";

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
    />
  </svg>
);

const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

export default function Navbar({
  timeFormat,
  toggleTimeFormat,
  onShare,
}: {
  timeFormat: "12h" | "24h";
  toggleTimeFormat: () => void;
  onShare: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close shortcuts modal on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowShortcuts(false);
    };
    if (showShortcuts) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [showShortcuts]);

  return (
    <>
      <nav
        className={`sticky top-0 z-40 h-[56px] w-full border-b border-[rgba(34,42,53,0.08)] transition-all duration-300 flex items-center justify-center ${
          scrolled ? "bg-[rgba(255,255,255,0.85)] backdrop-blur-[8px]" : "bg-white"
        }`}
      >
        <div className="w-full max-w-[1100px] px-[24px] flex items-center justify-between">
          <div
            className="flex items-center gap-[8px] relative group cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <style>{`
              @keyframes orbitDotSmall {
                from { transform: rotate(0deg) translateX(7px) rotate(0deg); }
                to { transform: rotate(360deg) translateX(7px) rotate(-360deg); }
              }
            `}</style>
            <div className="relative w-[18px] h-[18px] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" className="absolute inset-0">
                <circle cx="9" cy="9" r="7" fill="none" stroke="#242424" strokeWidth="1.5" />
              </svg>
              <div
                className="absolute w-[4px] h-[4px] bg-[#242424] rounded-full group-hover:hidden"
                style={{ animation: "orbitDotSmall 1.5s linear infinite" }}
              />
              <div
                className="absolute w-[4px] h-[4px] bg-[#242424] rounded-full hidden group-hover:block"
                style={{ animation: "orbitDotSmall 0.8s linear infinite" }}
              />
            </div>
            <span className="text-[15px] font-display font-semibold text-[#242424]">Orbit</span>

            {showTooltip && (
              <div className="absolute top-full mt-[8px] left-0 bg-white shadow-sm border border-[rgba(34,42,53,0.08)] rounded-[6px] px-[8px] py-[6px] text-[11px] font-sans text-[#898989] whitespace-nowrap z-50 animate-in fade-in zoom-in duration-150 delay-500 fill-mode-both">
                Every timezone. One orbit.
              </div>
            )}
          </div>

          <div className="flex items-center gap-[8px]">
            <div className="flex items-center bg-white shadow-sm border border-[rgba(34,42,53,0.08)] rounded-[4px] overflow-hidden">
              <button
                onClick={timeFormat === "24h" ? toggleTimeFormat : undefined}
                className={`px-[12px] py-[8px] text-[12px] font-sans font-semibold transition-colors duration-150 ${
                  timeFormat === "12h"
                    ? "bg-[#242424] text-white"
                    : "bg-white text-[#898989] hover:bg-[#f5f5f5]"
                }`}
              >
                12h
              </button>
              <button
                onClick={timeFormat === "12h" ? toggleTimeFormat : undefined}
                className={`px-[12px] py-[8px] text-[12px] font-sans font-semibold transition-colors duration-150 ${
                  timeFormat === "24h"
                    ? "bg-[#242424] text-white"
                    : "bg-white text-[#898989] hover:bg-[#f5f5f5]"
                }`}
              >
                24h
              </button>
            </div>

            <button
              onClick={onShare}
              className="flex items-center gap-[6px] bg-white shadow-sm border border-[rgba(34,42,53,0.08)] rounded-[8px] px-[14px] py-[10px] text-[#242424] hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 active:translate-y-0 active:shadow-sm"
            >
              <LinkIcon />
              <span className="text-[13px] font-sans font-semibold hidden md:block">Share</span>
            </button>

            <div className="w-[1px] h-[20px] bg-[rgba(34,42,53,0.08)] mx-[4px]"></div>

            <button
              onClick={() => setShowShortcuts(true)}
              className="text-[#898989] hover:text-[#242424] transition-colors p-[4px]"
              title="Keyboard Shortcuts"
            >
              <HelpIcon />
            </button>

            <a
              href="https://github.com/rauf17/orbit"
              target="_blank"
              rel="noreferrer"
              className="text-[#898989] hover:text-[#242424] transition-colors p-[4px] ml-[2px]"
            >
              <GithubIcon />
            </a>
          </div>
        </div>
      </nav>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-white rounded-[12px] shadow-lg border border-[rgba(34,42,53,0.08)] p-[24px]">
            <h3 className="text-[16px] font-display font-semibold text-[#242424] mb-[16px]">Keyboard Shortcuts</h3>
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-sans text-[#898989]">Add City</span>
                <kbd className="px-[6px] py-[2px] bg-[#f5f5f5] border border-[rgba(34,42,53,0.08)] rounded-[4px] text-[12px] font-sans font-semibold text-[#242424]">A</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-sans text-[#898989]">Share</span>
                <kbd className="px-[6px] py-[2px] bg-[#f5f5f5] border border-[rgba(34,42,53,0.08)] rounded-[4px] text-[12px] font-sans font-semibold text-[#242424]">S</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-sans text-[#898989]">Toggle 12h/24h</span>
                <kbd className="px-[6px] py-[2px] bg-[#f5f5f5] border border-[rgba(34,42,53,0.08)] rounded-[4px] text-[12px] font-sans font-semibold text-[#242424]">T</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-sans text-[#898989]">Close Dropdowns</span>
                <kbd className="px-[6px] py-[2px] bg-[#f5f5f5] border border-[rgba(34,42,53,0.08)] rounded-[4px] text-[12px] font-sans font-semibold text-[#242424]">Esc</kbd>
              </div>
            </div>
            <button 
              onClick={() => setShowShortcuts(false)}
              className="mt-[24px] w-full py-[10px] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-[8px] text-[13px] font-sans font-semibold text-[#242424] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
