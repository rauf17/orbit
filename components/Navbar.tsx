"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useTheme } from "./ThemeProvider";
import { OrbitIcon } from "./OrbitIcon";
import { useToast } from "../hooks/useToast";

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
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

interface NavbarProps {
  timeFormat: "12h" | "24h";
  toggleTimeFormat: () => void;
  onShare: () => void;
  onShowShortcuts: () => void;
  isShareAnimating?: boolean;
}

const Navbar = ({ timeFormat, toggleTimeFormat, onShare, onShowShortcuts, isShareAnimating }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleTheme = useCallback(() => {
    toggleTheme();
    showToast({ 
      message: `Switched to ${theme === "light" ? "dark" : "light"} mode`, 
      type: "info" 
    });
  }, [theme, toggleTheme, showToast]);

  return (
    <nav
      className={`sticky top-0 z-40 h-[48px] md:h-[56px] w-full border-b border-[var(--border-default)] transition-all duration-300 flex items-center justify-center ${scrolled ? 'shadow-sm' : ''}`}
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(13,13,15,0.9)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          className="flex items-center gap-[6px] md:gap-[8px] relative group cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="text-[var(--text-primary)]">
            <OrbitIcon size={18} speed={3} />
          </div>
          <span className="text-[14px] md:text-[15px] font-display font-semibold text-[var(--text-primary)]">Orbit</span>

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
              className={`px-[10px] md:px-[12px] py-[6px] md:py-[8px] text-[12px] font-sans font-semibold transition-colors duration-150 ${
                timeFormat === "12h"
                  ? "bg-[var(--accent)] text-[var(--bg-page)]"
                  : "bg-[var(--bg-page)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
              }`}
            >
              <span className="md:inline hidden">12h</span>
              <span className="md:hidden">{timeFormat === '12h' ? '12h' : ''}</span>
              {timeFormat === '24h' && <span className="md:hidden opacity-0 w-0 overflow-hidden">12h</span>}
            </button>
            <button
              onClick={timeFormat === "12h" ? toggleTimeFormat : undefined}
              className={`px-[10px] md:px-[12px] py-[6px] md:py-[8px] text-[12px] font-sans font-semibold transition-colors duration-150 ${
                timeFormat === "24h"
                  ? "bg-[var(--accent)] text-[var(--bg-page)]"
                  : "bg-[var(--bg-page)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
              }`}
            >
              <span className="md:inline hidden">24h</span>
              <span className="md:hidden">{timeFormat === '24h' ? '24h' : ''}</span>
              {timeFormat === '12h' && <span className="md:hidden opacity-0 w-0 overflow-hidden">24h</span>}
            </button>
          </div>

          <button
            onClick={handleToggleTheme}
            className="flex items-center justify-center w-[30px] h-[30px] md:w-[34px] md:h-[34px] bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[8px] text-[var(--text-primary)] hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 active:translate-y-0 active:shadow-sm"
            title="Toggle Theme"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          <button
            onClick={onShare}
            style={{ 
              transform: isShareAnimating ? 'scale(0.95) rotate(15deg)' : 'scale(1) rotate(0deg)',
              transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)' 
            }}
            className="flex items-center gap-[6px] bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[8px] px-[10px] md:px-[14px] py-[8px] h-[30px] md:h-[34px] text-[var(--text-primary)] hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 active:translate-y-0 active:shadow-sm"
          >
            <LinkIcon />
            <span className="text-[13px] font-sans font-semibold hidden md:block">Share</span>
          </button>

          <div className="w-[1px] h-[20px] bg-[var(--border-default)] mx-[4px] hidden md:block"></div>

          <button
            onClick={onShowShortcuts}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-[4px] hidden md:block"
            title="Keyboard Shortcuts"
          >
            <HelpIcon />
          </button>

          <a
            href="https://github.com/rauf17/orbit"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-[4px] ml-[2px] hidden md:block"
          >
            <GithubIcon />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default memo(Navbar);
