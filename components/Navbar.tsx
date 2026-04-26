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

import { useTheme } from "./ThemeProvider";
import { OrbitIcon } from "./OrbitIcon";

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
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
  const { theme, toggleTheme } = useTheme();

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
        className={`sticky top-0 z-40 h-[56px] w-full border-b border-[var(--border-default)] transition-colors duration-300 flex items-center justify-center backdrop-blur-[8px]`}
        style={{
          backgroundColor: scrolled 
            ? (theme === 'dark' ? 'rgba(13,13,15,0.85)' : 'rgba(255,255,255,0.85)')
            : 'var(--bg-page)',
          animation: 'slideDownNavbar 400ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both'
        }}
      >
        <style>{`
          @keyframes slideDownNavbar {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
          }
        `}</style>
        <div className="w-full max-w-[1100px] px-[24px] flex items-center justify-between">
          <div
            className="flex items-center gap-[8px] relative group cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="text-[var(--text-primary)]">
              <OrbitIcon size={18} speed={3} />
            </div>
            <span className="text-[15px] font-display font-semibold text-[var(--text-primary)]">Orbit</span>

            {showTooltip && (
              <div className="absolute top-full mt-[8px] left-0 bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[6px] px-[8px] py-[6px] text-[11px] font-sans text-[var(--text-secondary)] whitespace-nowrap z-50 animate-in fade-in zoom-in duration-150 delay-500 fill-mode-both">
                Every timezone. One orbit.
              </div>
            )}
          </div>

          <div className="flex items-center gap-[8px]">
            <div className="flex items-center bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[8px] overflow-hidden">
              <button
                onClick={timeFormat === "24h" ? toggleTimeFormat : undefined}
                className={`px-[12px] py-[8px] text-[12px] font-sans font-semibold transition-colors duration-150 ${
                  timeFormat === "12h"
                    ? "bg-[var(--accent)] text-[var(--bg-page)]"
                    : "bg-[var(--bg-page)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                }`}
              >
                12h
              </button>
              <button
                onClick={timeFormat === "12h" ? toggleTimeFormat : undefined}
                className={`px-[12px] py-[8px] text-[12px] font-sans font-semibold transition-colors duration-150 ${
                  timeFormat === "24h"
                    ? "bg-[var(--accent)] text-[var(--bg-page)]"
                    : "bg-[var(--bg-page)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                }`}
              >
                24h
              </button>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-[34px] h-[34px] bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[8px] text-[var(--text-primary)] hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 active:translate-y-0 active:shadow-sm"
              title="Toggle Theme"
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>

            <button
              onClick={onShare}
              className="flex items-center gap-[6px] bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[8px] px-[14px] py-[8px] h-[34px] text-[var(--text-primary)] hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 active:translate-y-0 active:shadow-sm"
            >
              <LinkIcon />
              <span className="text-[13px] font-sans font-semibold hidden md:block">Share</span>
            </button>

            <div className="w-[1px] h-[20px] bg-[var(--border-default)] mx-[4px]"></div>

            <button
              onClick={() => setShowShortcuts(true)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-[4px]"
              title="Keyboard Shortcuts"
            >
              <HelpIcon />
            </button>

            <a
              href="https://github.com/rauf17/orbit"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-[4px] ml-[2px]"
            >
              <GithubIcon />
            </a>
          </div>
        </div>
      </nav>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-[var(--bg-surface)] rounded-[12px] shadow-lg border border-[var(--border-strong)] p-[24px]">
            <h3 className="text-[16px] font-display font-semibold text-[var(--text-primary)] mb-[16px]">Keyboard Shortcuts</h3>
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-sans text-[var(--text-secondary)]">Add City</span>
                <kbd className="px-[6px] py-[2px] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[4px] text-[12px] font-sans font-semibold text-[var(--text-primary)]">A</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-sans text-[var(--text-secondary)]">Share</span>
                <kbd className="px-[6px] py-[2px] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[4px] text-[12px] font-sans font-semibold text-[var(--text-primary)]">S</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-sans text-[var(--text-secondary)]">Toggle 12h/24h</span>
                <kbd className="px-[6px] py-[2px] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[4px] text-[12px] font-sans font-semibold text-[var(--text-primary)]">T</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-sans text-[var(--text-secondary)]">Close Dropdowns</span>
                <kbd className="px-[6px] py-[2px] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[4px] text-[12px] font-sans font-semibold text-[var(--text-primary)]">Esc</kbd>
              </div>
            </div>
            <button 
              onClick={() => setShowShortcuts(false)}
              className="mt-[24px] w-full py-[10px] bg-[var(--bg-elevated)] hover:bg-[var(--border-default)] rounded-[8px] text-[13px] font-sans font-semibold text-[var(--text-primary)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
