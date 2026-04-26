"use client";

import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from "react";
import { City } from "../lib/cities";
import { 
  formatTime, 
  getOffsetString, 
  isDSTActive, 
  getOverlapHours, 
  hourToPercent, 
  getOffsetForDate 
} from "../lib/timeUtils";
import { OrbitIcon } from "./OrbitIcon";
import AnalogClock from "./AnalogClock";
import { useToast } from "../hooks/useToast";

interface TimelineProps {
  cities: City[];
  now: Date;
  selectedDate: Date;
  timeFormat: "12h" | "24h";
  onRemoveCity: (id: string) => void;
  onReorderCities: (from: number, to: number) => void;
  meetingPercent: number | null;
  setMeetingPercent: (p: number | null) => void;
}

const DragHandleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="21" x2="8" y2="3"></line>
    <line x1="16" y1="21" x2="16" y2="3"></line>
  </svg>
);

const RemoveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"></path>
  </svg>
);

function getLocalHourAtUTC(utcHour: number, tz: string, date: Date): number {
  try {
    const d = new Date(date);
    d.setUTCHours(utcHour, 0, 0, 0);
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: tz,
    }).formatToParts(d);
    const h = parseInt(
      parts.find(p => p.type === 'hour')?.value ?? '0', 10
    );
    return isNaN(h) ? 0 : h === 24 ? 0 : h;
  } catch { return 0; }
}

function getHealth(sliderPct: number, cities: City[], date: Date) {
  const utcH = Math.round((sliderPct / 100) * 23);
  const available = cities.filter(c => {
    const h = getLocalHourAtUTC(utcH, c.timezone, date);
    return h >= 9 && h < 17;
  });
  const a = available.length;
  const t = cities.length;
  const r = t === 0 ? 0 : a / t;
  if (r === 1)   return { label: `✓ Perfect — all ${t} available`,   color: '#16a34a', bg: 'rgba(22,163,74,0.1)', ratio: 1   };
  if (r >= 0.75) return { label: `Good — ${a}/${t} available`,        color: '#ca8a04', bg: 'rgba(202,138,4,0.1)', ratio: r  };
  if (r >= 0.5)  return { label: `Fair — ${a}/${t} available`,        color: '#d97706', bg: 'rgba(217,119,6,0.1)', ratio: r  };
  return               { label: `Poor — only ${a}/${t} in hours`,    color: '#dc2626', bg: 'rgba(220,38,38,0.1)', ratio: r  };
}

const TimelineBar = memo(({ city, isFirstRow, selectedDate }: { city: City; isFirstRow: boolean; selectedDate: Date }) => {
  const today = new Date();
  const offsetToday = getOffsetForDate(city.timezone, today);
  const offsetSelected = getOffsetForDate(city.timezone, selectedDate);
  const dstChanged = offsetToday !== offsetSelected;

  // Sunlight Glow logic
  const nowHour = new Date().toLocaleTimeString("en-US", { hour: "numeric", hour12: false, timeZone: city.timezone });
  const h = parseInt(nowHour, 10);
  const isCurrentlyWorking = h >= 9 && h < 17;

  const renderSegment = (start: number, end: number, bgColor: string, borderColor?: string, boxShadow?: string) => {
    const utcDate = new Date(selectedDate.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(selectedDate.toLocaleString("en-US", { timeZone: city.timezone }));
    const shift = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);

    return [-1, 0, 1].map((day) => {
      const localStart = start - shift + day * 24;
      const localEnd = end - shift + day * 24;
      if (localEnd <= 0 || localStart >= 24) return null;

      const left = Math.max(0, localStart) / 24 * 100;
      const right = Math.min(24, localEnd) / 24 * 100;
      const width = right - left;
      if (width <= 0) return null;

      const isWorkingSegment = start === 9 && end === 17;

      return (
        <div
          key={`${day}-${start}`}
          className={`absolute top-0 bottom-0 timeline-segment ${isWorkingSegment && isCurrentlyWorking ? 'timeline-segment-working' : ''}`}
          style={{ 
            left: `${left}%`, 
            width: `${width}%`,
            background: bgColor,
            boxShadow: boxShadow,
            ...(isWorkingSegment && isCurrentlyWorking ? {} : {}), // Remove inline animation
            ...(borderColor ? { 
              borderTop: `1px solid ${borderColor}`, 
              borderBottom: `1px solid ${borderColor}`, 
              borderLeft: start === 9 ? `2px solid ${borderColor}` : undefined, 
              borderRight: end === 17 ? `2px solid ${borderColor}` : undefined 
            } : {})
          }}
        >
          {isFirstRow && day === 0 && start === 9 && (
            <div 
              style={{
                position: 'absolute',
                top: -16,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 9,
                color: '#b0b0b0',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}
            >
              9am — 5pm
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-[48px] w-full relative rounded-[8px] overflow-hidden shadow-sm border border-[var(--border-default)] bg-[var(--bg-page)] timeline-bar" style={{ border: '1px solid var(--border-default)' }}>
      {renderSegment(0, 6, "var(--timeline-night)")}
      {renderSegment(18, 24, "var(--timeline-night)")}
      {renderSegment(6, 9, "var(--timeline-shoulder)")}
      {renderSegment(17, 18, "var(--timeline-shoulder)")}
      {renderSegment(9, 17, "var(--timeline-working)", undefined, "inset 0 0 0 1px var(--timeline-working-border)")}
      {renderSegment(9, 17, "var(--timeline-overlap)", undefined, "inset 0 0 0 1px rgba(22,163,74,0.2)")}
      
      <div 
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{ background: 'var(--timeline-gradient)' }}
      />

      {dstChanged && (
        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[rgba(245,158,11,0.1)] text-[#d97706] text-[9px] font-bold rounded z-10 opacity-80 pointer-events-none">
          ⚠ DST changes
        </div>
      )}
    </div>
  );
});

const Timeline = ({ 
  cities, 
  now, 
  selectedDate,
  timeFormat, 
  onRemoveCity, 
  onReorderCities,
  meetingPercent,
  setMeetingPercent 
}: TimelineProps) => {
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState({ left: 0, top: 0 });
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const calendarMenuRef = useRef<HTMLDivElement>(null);
  const lastHapticRef = useRef<string>("");
  const { showToast } = useToast();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarMenuRef.current && !calendarMenuRef.current.contains(e.target as Node)) {
        setShowCalendarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const isMobile = window.innerWidth < 768;
    const rightAreaLeft = isMobile ? rect.left : rect.left + 200; 
    const rightAreaWidth = isMobile ? rect.width : rect.width - 200;
    
    const x = clientX - rightAreaLeft;

    if (x >= 0 && x <= rightAreaWidth) {
      const p = (x / rightAreaWidth) * 100;
      setHoverPercent(p);
      setHoverPos({ left: x + (isMobile ? 0 : 200), top: clientY - rect.top });
    } else {
      setHoverPercent(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => setHoverPercent(null), []);

  const handleRemove = useCallback((id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onRemoveCity(id);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  }, [onRemoveCity]);

  const blocks = useMemo(() => {
    if (cities.length === 0) return [];
    const overlaps = getOverlapHours(cities.map((c) => c.timezone), selectedDate);
    const res: { start: number; end: number }[] = [];
    if (overlaps.length > 0) {
      let start = overlaps[0];
      let prev = overlaps[0];
      for (let i = 1; i <= overlaps.length; i++) {
        if (i === overlaps.length || overlaps[i] !== prev + 1) {
          res.push({ start, end: prev + 1 });
          if (i < overlaps.length) {
            start = overlaps[i];
            prev = overlaps[i];
          }
        } else {
          prev = overlaps[i];
        }
      }
    }
    return res;
  }, [cities, selectedDate]);

  const nowPercent = hourToPercent(now.getHours(), now.getMinutes());
  const isFuture = selectedDate.toDateString() !== new Date().toDateString();
  const currentSliderPercent = meetingPercent !== null ? meetingPercent : (isFuture ? 50 : nowPercent);
  
  const hoverDate = useMemo(() => {
    if (hoverPercent === null) return selectedDate;
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
    const totalMinutes = Math.round((hoverPercent / 100) * 24 * 60);
    return new Date(d.getTime() + totalMinutes * 60 * 1000);
  }, [hoverPercent, selectedDate]);
  
  const getMeetingDateStr = useCallback((timezone: string) => {
    if (meetingPercent === null) return "";
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
    const totalMinutes = Math.round((meetingPercent / 100) * 24 * 60);
    const targetDate = new Date(d.getTime() + totalMinutes * 60 * 1000);
    return formatTime(targetDate, timezone, timeFormat);
  }, [meetingPercent, selectedDate, timeFormat]);

  const getDayIndicator = useCallback((timezone: string) => {
    const targetDate = meetingPercent !== null 
      ? new Date(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0).getTime() + Math.round((meetingPercent / 100) * 24 * 60) * 60000)
      : (isFuture ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0, 0) : now);
      
    const utcDateStr = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: 'numeric', month: '2-digit', day: '2-digit' }).format(targetDate);
    const localDateStr = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(targetDate);
    
    if (utcDateStr === localDateStr) return null;
    const uParts = utcDateStr.split('/');
    const lParts = localDateStr.split('/');
    const uInt = parseInt(`${uParts[2]}${uParts[0]}${uParts[1]}`);
    const lInt = parseInt(`${lParts[2]}${lParts[0]}${lParts[1]}`);
    
    if (lInt > uInt) return { label: "+1", title: "Tomorrow" };
    if (lInt < uInt) return { label: "-1", title: "Yesterday" };
    return null;
  }, [meetingPercent, selectedDate, isFuture, now]);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const markers = isMobile ? [0, 6, 12, 18, 24] : [0, 3, 6, 9, 12, 15, 18, 21];

  const [copied, setCopied] = useState(false);

  const handleCopyTimes = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const baseHourStr = formatTime(hoverDate, "UTC", timeFormat);
    const title = `${baseHourStr} UTC\n`;
    const txt = title + cities.map(c => {
      const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
      const tm = Math.round(((hoverPercent ?? currentSliderPercent) / 100) * 24 * 60);
      const td = new Date(d.getTime() + tm * 60 * 1000);
      return `${c.name}: ${formatTime(td, c.timezone, "12h")}`;
    }).join('\n');
    
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [hoverDate, timeFormat, cities, selectedDate, hoverPercent, currentSliderPercent]);

  const buildCalendarUrls = useCallback(() => {
    const utcH = Math.round((currentSliderPercent / 100) * 23);
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
    d.setUTCHours(utcH, 0, 0, 0);
    const endD = new Date(d.getTime() + 60 * 60 * 1000);
    const fmt = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const start = fmt(d);
    const end = fmt(endD);
    const cityTimes = cities.map(c => `${c.name}: ${formatTime(d, c.timezone, "12h")}`).join('\n');
    const encodedDetails = encodeURIComponent(cityTimes);
    const encodedTitle = encodeURIComponent("Meeting — Orbit");
    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${start}/${end}&details=${encodedDetails}&location=Remote+/+Online`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodedTitle}&startdt=${d.toISOString()}&enddt=${endD.toISOString()}&body=${encodedDetails}&location=Remote+/+Online`,
      ics: d
    };
  }, [currentSliderPercent, selectedDate, cities]);

  const handleDownloadICS = useCallback((d: Date) => {
    const startUTC = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endUTC = new Date(d.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const cityTimes = cities.map(c => `${c.name}: ${formatTime(d, c.timezone, "12h")}`).join('\\n');
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Orbit//Timezone Planner//EN\nBEGIN:VEVENT\nDTSTART:${startUTC}\nDTEND:${endUTC}\nSUMMARY:Meeting — Orbit\nDESCRIPTION:${cityTimes}\nLOCATION:Remote / Online\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orbit-meeting.ics';
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: "Calendar file downloaded", type: "calendar" });
  }, [cities, showToast]);

  const healthScore = useMemo(() => {
    if (cities.length === 0) return null;
    const score = getHealth(currentSliderPercent, cities, selectedDate);
    
    // Haptic Feedback (Task 2)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (score.ratio === 1 && lastHapticRef.current !== "perfect") {
          navigator.vibrate([50, 20, 50]);
          lastHapticRef.current = "perfect";
        } else if (score.ratio < 0.25 && lastHapticRef.current !== "poor") {
          navigator.vibrate(30);
          lastHapticRef.current = "poor";
        } else if (score.ratio > 0.25 && score.ratio < 1) {
          lastHapticRef.current = "";
        }
      } catch (e) { /* ignore */ }
    }
    
    return score;
  }, [currentSliderPercent, cities, selectedDate]);

  return (
    <div className="relative w-full pb-[40px]">
      <style>{`
        @keyframes nowRipple {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(16px); }
        }
        @keyframes popInLeft {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes popInRight {
          from { opacity: 0; transform: translateX(-100%) scale(0.95); }
          to { opacity: 1; transform: translateX(-100%) scale(1); }
        }
        @keyframes pulseTime {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @keyframes fadeTime {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
        @keyframes rollDigit {
          0% { transform: translateY(0); opacity: 1; }
          40% { transform: translateY(-4px); opacity: 0.3; }
          60% { transform: translateY(4px); opacity: 0.3; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes workingGlow {
          0%, 100% { 
            box-shadow: inset 0 0 0 rgba(22,163,74,0); 
            background: var(--timeline-working);
          }
          50% { 
            box-shadow: inset 0 2px 8px rgba(22,163,74,0.08);
            background: rgba(240,253,244,0.8);
          }
        }
        [data-theme="dark"] .timeline-segment {
          animation-name: workingGlowDark;
        }
        @keyframes workingGlowDark {
          0%, 100% { background: var(--timeline-working); }
          50% { background: rgba(22,163,74,0.12); }
        }
        
        .pulse-time {
          animation: pulseTime 1s infinite;
        }
        .roll-animation {
          animation: rollDigit 0.15s ease forwards;
        }

        .meeting-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--text-primary);
          border: 2px solid var(--bg-page);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .meeting-slider::-webkit-slider-thumb {
            width: 24px;
            height: 24px;
          }
        }
        .meeting-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--text-primary);
          border: 2px solid var(--bg-page);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          cursor: pointer;
        }
      `}</style>

      <div
        className="w-full relative select-none z-10"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseMove}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex w-full md:pl-[200px]">
          <div className="flex-1 min-w-0 relative h-[28px]">
            {markers.map((h) => {
              const label =
                timeFormat === "24h"
                  ? h.toString().padStart(2, "0")
                  : `${h % 12 || 12}${h >= 12 ? "pm" : "am"}`;
              return (
                <div
                  key={h}
                  className="absolute text-[10px] font-sans text-[var(--text-muted)] -translate-x-1/2 bottom-1"
                  style={{ left: `${(h / 24) * 100}%` }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rows Container */}
        <div className="relative w-full">
          {/* Overlap Zone */}
          <div className="absolute top-0 bottom-0 right-0 w-full md:w-[calc(100%-200px)] pointer-events-none z-10 hidden md:block">
            {blocks.map((block, idx) => {
              return [-1, 0, 1].map((day) => {
                const utcDate = new Date(selectedDate.toLocaleString("en-US", { timeZone: "UTC" }));
                const tzDate = new Date(selectedDate.toLocaleString("en-US", { timeZone: cities[0]?.timezone || "UTC" }));
                const baseShift = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
                const localStart = block.start - baseShift + day * 24;
                const localEnd = block.end - baseShift + day * 24;
                if (localEnd <= 0 || localStart >= 24) return null;
                const left = Math.max(0, localStart) / 24 * 100;
                const right = Math.min(24, localEnd) / 24 * 100;
                const width = right - left;
                if (width <= 0) return null;
                return (
                  <div
                    key={`${idx}-${day}`}
                    className="absolute top-0 bottom-0 bg-[rgba(22,163,74,0.12)] border border-[rgba(22,163,74,0.3)] rounded-[4px]"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {idx === 0 && day === 0 && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[rgba(22,163,74,0.1)] text-[#16a34a] text-[10px] font-semibold font-sans px-[10px] py-[3px] rounded-full whitespace-nowrap">
                        ✓ Best overlap
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>

          {/* Now Indicator & Zenith Needle */}
          <div className="absolute top-0 bottom-0 right-0 w-full md:w-[calc(100%-200px)] pointer-events-none z-20">
            <div
              className="absolute top-0 w-[1px] bg-[var(--text-primary)] transition-all duration-[50ms] ease-linear"
              style={{ left: `${currentSliderPercent}%`, height: '100%' }}
            >
              {!isFuture && meetingPercent === null && (
                <div className="absolute -top-[3px] left-1/2 -translate-x-1/2">
                  <div className="w-[7px] h-[7px] bg-[var(--text-primary)] rounded-full relative">
                    <div className="absolute inset-0 rounded-full" style={{ border: '1px solid var(--text-primary)', animation: 'nowRipple 2s ease-out infinite' }} />
                  </div>
                </div>
              )}
              
              <div 
                className="absolute left-1/2 -translate-x-1/2 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[6px] px-[8px] py-[2px] text-[10px] font-bold font-sans text-[var(--text-primary)] whitespace-nowrap"
                style={{ top: '100%', boxShadow: 'var(--shadow-sm)' }}
              >
                <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid var(--border-default)', position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)' }} />
                {getMeetingDateStr(Intl.DateTimeFormat().resolvedOptions().timeZone) || formatTime(isFuture ? new Date(selectedDate.setHours(12,0,0,0)) : now, Intl.DateTimeFormat().resolvedOptions().timeZone, timeFormat)}
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="relative bg-[var(--bg-page)]">
            {cities.map((city, idx) => {
              const activeDST = isDSTActive(city.timezone, selectedDate);
              const dayInd = getDayIndicator(city.timezone);
              const meetingTimeStr = getMeetingDateStr(city.timezone) || formatTime(isFuture ? new Date(selectedDate.setHours(12,0,0,0)) : now, city.timezone, timeFormat);

              return (
                <div
                  key={city.id}
                  className={`flex flex-col md:flex-row w-full md:h-[84px] items-start md:items-center group relative border-b border-[var(--border-default)] py-4 gap-3 md:gap-0 transition-transform duration-200 ease-in-out hover:translate-x-[4px] ${
                    dragOverIdx === idx ? "border-t-[2px] border-t-[var(--text-primary)]" : ""
                  }`}
                  style={{
                    animation: removingIds.has(city.id)
                      ? "slideOut 200ms ease-out forwards"
                      : (isVisible ? `slideInLeft 350ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 60}ms both` : "none"),
                    opacity: draggedIdx === idx ? 0.4 : (isVisible ? 1 : 0),
                  }}
                  draggable="true"
                  onDragStart={(e) => { setDraggedIdx(idx); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDrop={(e) => { e.preventDefault(); if (draggedIdx !== null && draggedIdx !== idx) onReorderCities(draggedIdx, idx); setDraggedIdx(null); setDragOverIdx(null); }}
                  onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
                >
                  {/* Left Sidebar - Mobile Responsive Stacking */}
                  <div className="w-full md:w-[200px] md:min-w-[200px] md:max-w-[200px] shrink-0 h-auto md:h-full pr-[16px] relative flex flex-col justify-center gap-[2px] bg-[var(--bg-surface)] md:bg-transparent py-2 md:py-0 px-3 md:px-0 rounded-md md:rounded-none">
                    <div className="hidden md:block absolute left-0 opacity-0 group-hover:opacity-100 cursor-grab text-[var(--text-muted)] p-2 -ml-5">
                      <DragHandleIcon />
                    </div>

                    <div className="flex items-center justify-between md:justify-start gap-1.5 md:pl-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-[24px] text-[16px] leading-none text-center flex-shrink-0">{city.emoji}</span>
                        <span className="text-[13px] md:text-[14px] font-display font-semibold text-[var(--text-primary)] leading-none max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {city.name}
                        </span>
                      </div>
                      
                      {/* Mobile-only time display next to name */}
                      <span 
                        key={`${meetingTimeStr}-${isDragging}`}
                        className={`md:hidden text-[18px] font-sans font-bold text-[var(--text-primary)] leading-none tracking-tight tabular-nums ${isDragging ? 'roll-animation' : ''}`}
                      >
                        {meetingTimeStr}
                      </span>
                    </div>
                    
                    <div className="hidden md:block pl-[38px] text-[11px] font-sans text-[var(--text-secondary)] leading-none max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
                      {city.country}
                    </div>

                    <div className="hidden md:block pl-[38px] mt-1.5 mb-1.5">
                      <AnalogClock timezone={city.timezone} size={22} selectedDate={selectedDate} />
                    </div>

                    <div className="hidden md:flex pl-[38px] items-center gap-2">
                      <span 
                        key={`${meetingTimeStr}-${isDragging}`}
                        className={`inline-block text-[20px] font-sans font-bold text-[var(--text-primary)] leading-none tracking-tight tabular-nums ${isDragging ? 'roll-animation' : ''} ${meetingPercent === null && !isFuture ? "pulse-time" : ""}`}
                      >
                        {meetingTimeStr}
                      </span>
                    </div>

                    <div className="pl-[30px] md:pl-[38px] flex flex-wrap items-center gap-1 mt-[4px]">
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, opacity: 0.6 }}>
                        {getOffsetString(city.timezone, selectedDate)}
                      </div>
                      {activeDST && (
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.5, fontWeight: 400 }}>
                          DST
                        </div>
                      )}
                      {dayInd && (
                        <div style={{ fontSize: 9, color: '#d97706', opacity: 0.7 }}>
                          {dayInd.label}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemove(city.id)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 hidden md:block"
                    >
                      <RemoveIcon />
                    </button>
                    <button
                      onClick={() => handleRemove(city.id)}
                      className="md:hidden absolute right-2 top-2 p-2 text-[var(--text-secondary)]"
                    >
                      <RemoveIcon />
                    </button>
                  </div>

                  <div className="flex-1 w-full min-w-0 relative flex items-center h-[48px] md:h-full">
                    <TimelineBar city={city} isFirstRow={idx === 0} selectedDate={selectedDate} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrubber / Slider */}
      {cities.length > 0 && (
        <div className="mt-[24px] flex flex-col items-center w-full md:pl-[200px] relative z-20">
           <div className="flex items-center gap-3 mb-3">
             <div className="text-[12px] font-sans text-[var(--text-secondary)]">Drag to find best time</div>
             {healthScore && (
               <div 
                 className="px-[14px] py-[10px] rounded-full text-[12px] font-sans font-semibold shadow-sm"
                 style={{ backgroundColor: healthScore.bg, color: healthScore.color, transition: 'all 250ms ease' }}
               >
                 {healthScore.label}
               </div>
             )}
           </div>
           
           <div className="relative w-full h-[20px] md:h-[20px] flex items-center group">
             <div className="absolute left-0 right-0 h-[6px] md:h-[4px] bg-[var(--border-strong)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--text-primary)] transition-all duration-75" style={{ width: `${currentSliderPercent}%` }} />
             </div>
             <input 
               type="range" min="0" max="100" step="0.1" 
               value={currentSliderPercent}
               onMouseDown={() => setIsDragging(true)}
               onMouseUp={() => setIsDragging(false)}
               onTouchStart={() => setIsDragging(true)}
               onTouchEnd={() => setIsDragging(false)}
               onChange={(e) => setMeetingPercent(parseFloat(e.target.value))}
               className="meeting-slider absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
             />
             <div 
               className="absolute w-[24px] h-[24px] md:w-[20px] md:h-[20px] rounded-full bg-[var(--text-primary)] border-[2px] border-[var(--bg-page)] shadow-md pointer-events-none transition-all duration-75 group-hover:scale-110 z-20"
               style={{ left: `calc(${currentSliderPercent}% - 10px)` }}
             />
           </div>
           
           {isFuture && (
             <div className="mt-2 text-[10px] text-[var(--text-muted)] font-sans">No live indicator for future dates</div>
           )}

           <div className="flex items-center gap-[12px] mt-6 relative">
             {meetingPercent !== null && (
               <>
                 {!isFuture && (
                   <button 
                     onClick={() => setMeetingPercent(null)}
                     className="text-[12px] font-sans font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors"
                   >
                     Reset to live time
                   </button>
                 )}
                 <div className="relative" ref={calendarMenuRef}>
                    <button
                      onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                      className="flex items-center gap-[6px] shadow-sm border border-[var(--border-default)] rounded-[8px] px-[14px] py-[10px] text-[13px] font-sans font-semibold text-[var(--text-primary)] bg-[var(--bg-page)] hover:shadow-md hover:-translate-y-[1px] transition-all duration-150"
                    >
                      📅 Add to Calendar
                    </button>
                    {showCalendarMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[8px] shadow-lg p-1 z-50">
                        <button 
                          onClick={() => { handleDownloadICS(buildCalendarUrls().ics); setShowCalendarMenu(false); }}
                          className="w-full text-left px-3 py-2 text-[12px] font-sans hover:bg-[var(--bg-surface)] rounded-md transition-colors"
                        >
                          📅 Download .ics
                        </button>
                        <a 
                          href={buildCalendarUrls().google} target="_blank" rel="noopener noreferrer"
                          className="block w-full text-left px-3 py-2 text-[12px] font-sans hover:bg-[var(--bg-surface)] rounded-md transition-colors"
                          onClick={() => { setShowCalendarMenu(false); showToast({ message: "Redirecting to Google Calendar", type: "calendar" }); }}
                        >
                          Google Calendar
                        </a>
                        <a 
                          href={buildCalendarUrls().outlook} target="_blank" rel="noopener noreferrer"
                          className="block w-full text-left px-3 py-2 text-[12px] font-sans hover:bg-[var(--bg-surface)] rounded-md transition-colors"
                          onClick={() => { setShowCalendarMenu(false); showToast({ message: "Redirecting to Outlook Calendar", type: "calendar" }); }}
                        >
                          Outlook Calendar
                        </a>
                      </div>
                    )}
                 </div>
               </>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

export default memo(Timeline);
