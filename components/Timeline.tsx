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
import { Sparkline } from "./Sparkline";
import AvailabilitySparkline from "./AvailabilitySparkline";
import { getHolidayForCity } from "../lib/getHoliday";
import { useTheme } from "./ThemeProvider";

function getSunGradient(localHour: number, isDarkMode: boolean): string {
  if (isDarkMode) {
    if (localHour >= 5 && localHour < 8)
      return 'linear-gradient(90deg, transparent 0%, rgba(251,146,60,0.08) 30%, transparent 60%)';
    if (localHour >= 17 && localHour < 20)
      return 'linear-gradient(90deg, transparent 40%, rgba(239,68,68,0.06) 70%, transparent 100%)';
    if (localHour >= 11 && localHour < 15)
      return 'linear-gradient(90deg, transparent 30%, rgba(250,204,21,0.04) 50%, transparent 70%)';
    return 'none';
  } else {
    if (localHour >= 5 && localHour < 8)
      return 'linear-gradient(90deg, transparent 0%, rgba(251,146,60,0.06) 30%, transparent 60%)';
    if (localHour >= 17 && localHour < 20)
      return 'linear-gradient(90deg, transparent 40%, rgba(239,68,68,0.05) 70%, transparent 100%)';
    if (localHour >= 11 && localHour < 15)
      return 'linear-gradient(90deg, transparent 30%, rgba(250,204,21,0.04) 50%, transparent 70%)';
    return 'none';
  }
}

interface TimelineProps {
  cities: City[];
  now: Date;
  selectedDate: Date;
  timeFormat: "12h" | "24h";
  onRemoveCity: (id: string) => void;
  onReorderCities: (from: number, to: number) => void;
  meetingPercent: number | null;
  setMeetingPercent: (p: number | null) => void;
  isPresetLoading?: boolean;
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

function MiniClock({ hour, minute, isSleeping }: { hour: number; minute: number; isSleeping?: boolean }) {
  const cx = 10, cy = 10, r = 9;
  
  const hourAngle = ((hour % 12) + minute / 60) * 30 - 90;
  const hourRad = (hourAngle * Math.PI) / 180;
  const hourX = cx + 5 * Math.cos(hourRad);
  const hourY = cy + 5 * Math.sin(hourRad);
  
  const minAngle = minute * 6 - 90;
  const minRad = (minAngle * Math.PI) / 180;
  const minX = cx + 7.5 * Math.cos(minRad);
  const minY = cy + 7.5 * Math.sin(minRad);

  return (
    <svg 
      width="20" height="20" viewBox="0 0 20 20" 
      className="flex-shrink-0 transition-opacity duration-500"
      style={{ opacity: isSleeping ? 0.35 : 1, transition: 'opacity 0.4s ease' }}
    >
      <circle cx={cx} cy={cy} r={r} 
        className="fill-none stroke-black/35 dark:stroke-white/20" 
        strokeWidth="1" />
      {[0,90,180,270].map(a => {
        const rad = (a * Math.PI) / 180;
        return <circle key={a} 
          cx={cx + 7 * Math.cos(rad)} 
          cy={cy + 7 * Math.sin(rad)} 
          r="0.8" 
          className="fill-black/45 dark:fill-white/30" />;
      })}
      <line x1={cx} y1={cy} x2={hourX} y2={hourY}
        className="stroke-black/80 dark:stroke-white/70"
        strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={minX} y2={minY}
        className="stroke-black/60 dark:stroke-white/50"
        strokeWidth="1" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="1.2"
        className="fill-black/75 dark:fill-white/60" />
    </svg>
  );
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

const TimelineBar = memo(({ city, isFirstRow, selectedDate, index }: { city: City; isFirstRow: boolean; selectedDate: Date; index: number }) => {
  const today = new Date();
  const offsetToday = getOffsetForDate(city.timezone, today);
  const offsetSelected = getOffsetForDate(city.timezone, selectedDate);
  const dstChanged = offsetToday !== offsetSelected;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Current local hour for golden hour gradient
  const nowHour = new Date().toLocaleTimeString("en-US", { hour: "numeric", hour12: false, timeZone: city.timezone });
  const h = parseInt(nowHour, 10);
  const isCurrentlyWorking = h >= 9 && h < 17;
  const sunGradient = getSunGradient(isNaN(h) ? 12 : h, isDark);

  const Segment = ({ 
    start, end, day, shift, bgColor, borderColor, boxShadow, isCurrentlyWorking, isFirstRow 
  }: { 
    start: number; end: number; day: number; shift: number; 
    bgColor: string; borderColor?: string; boxShadow?: string; 
    isCurrentlyWorking: boolean; isFirstRow: boolean;
  }) => {
    const localStart = start - shift + day * 24;
    const localEnd = end - shift + day * 24;
    if (localEnd <= 0 || localStart >= 24) return null;

    const left = Math.max(0, localStart) / 24 * 100;
    const right = Math.min(24, localEnd) / 24 * 100;
    const width = right - left;
    if (width <= 0) return null;

    const isWorkingSegment = start === 9 && end === 17;
    const segmentRef = useRef<HTMLDivElement>(null);
    const [, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
      <div
        key={`${day}-${start}`}
        ref={segmentRef}
        className={`absolute top-0 bottom-0 timeline-segment timeline-bar-segment ${isWorkingSegment && isCurrentlyWorking ? 'timeline-segment-working' : ''}`}
        style={{ 
          left: `${left}%`, 
          width: `${width}%`,
          background: bgColor,
          boxShadow: boxShadow,
          ...(borderColor ? { 
            borderTop: `1px solid ${borderColor}`, 
            borderBottom: `1px solid ${borderColor}`, 
            borderLeft: start === 9 ? `2px solid ${borderColor}` : undefined, 
            borderRight: end === 17 ? `2px solid ${borderColor}` : undefined 
          } : {})
        }}
      >
        {/* Task 4: Golden Hour Bar Gradients */}
        {segmentRef.current?.closest('.timeline-bar-segment') && (
          <div 
            className="absolute inset-0 pointer-events-none z-10 flex" 
            data-overlay="golden-hour"
            style={{ isolation: 'isolate', position: 'relative' }}
          >
            {Array.from({ length: end - start }).map((_, i) => {
              const h = start + i;
              const overlay = 
                h >= 5 && h < 7 ? "rgba(251, 191, 36, 0.08)" :
                h >= 7 && h < 9 ? "rgba(254, 215, 170, 0.05)" :
                h >= 17 && h < 19 ? "rgba(251, 146, 60, 0.08)" :
                h >= 19 && h < 21 ? "rgba(139, 92, 246, 0.08)" : null;
              
              if (!overlay) return null;
              return (
                <div 
                  key={h} 
                  className="h-full flex-1" 
                  style={{ background: overlay }} 
                />
              );
            })}
          </div>
        )}

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
  };

  const renderSegments = (start: number, end: number, bgColor: string, borderColor?: string, boxShadow?: string) => {
    const utcDate = new Date(selectedDate.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(selectedDate.toLocaleString("en-US", { timeZone: city.timezone }));
    const shift = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);

    return [-1, 0, 1].map((day) => (
      <Segment 
        key={day}
        start={start} end={end} day={day} shift={shift} 
        bgColor={bgColor} borderColor={borderColor} boxShadow={boxShadow} 
        isCurrentlyWorking={isCurrentlyWorking} isFirstRow={isFirstRow} 
      />
    ));
  };

  const holiday = getHolidayForCity(city.countryCode, selectedDate.toISOString().split('T')[0]);

  return (
    <div 
      className={`h-[48px] w-full relative rounded-[8px] overflow-hidden shadow-sm border border-[var(--border-default)] bg-[var(--bg-page)] timeline-bar timeline-bar-animate ${holiday ? 'border-l-2 border-l-amber-400/50' : ''}`} 
      style={{ border: '1px solid var(--border-default)', animationDelay: `${index * 80}ms` }}
    >
      {renderSegments(0, 6, "var(--timeline-night)")}
      {renderSegments(18, 24, "var(--timeline-night)")}
      {renderSegments(6, 9, "var(--timeline-shoulder)")}
      {renderSegments(17, 18, "var(--timeline-shoulder)")}
      {renderSegments(9, 17, "var(--timeline-working)", undefined, "inset 0 0 0 1px var(--timeline-working-border)")}
      {renderSegments(9, 17, "var(--timeline-overlap)", undefined, "inset 0 0 0 1px rgba(22,163,74,0.2)")}

      {/* Sun gradient overlay */}
      {sunGradient !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-[3] rounded-[inherit]"
          style={{ background: sunGradient, transition: 'background 2s ease' }}
        />
      )}

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
  setMeetingPercent,
  isPresetLoading
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
  const [snapPulse, setSnapPulse] = useState<{ x: number; active: boolean }>({ x: 0, active: false });
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

  const handleSnap = useCallback((val: number) => {
    if (cities.length === 0) return;
    const SNAP_THRESHOLD = 3;

    // Collect ALL hours where ratio >= 0.75 (good or perfect)
    const goodHourPcts: number[] = [];
    for (let h = 0; h < 24; h++) {
      const ratio = cities.filter(c => {
        const lh = getLocalHourAtUTC(h, c.timezone, selectedDate);
        return lh >= 9 && lh < 17;
      }).length / cities.length;
      if (ratio >= 0.75) {
        goodHourPcts.push((h / 24) * 100);
      }
    }

    if (goodHourPcts.length === 0) return;

    const nearest = goodHourPcts.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
    );

    if (Math.abs(nearest - val) <= SNAP_THRESHOLD) {
      setMeetingPercent(nearest);
      setSnapPulse({ x: nearest, active: true });
      setTimeout(() => setSnapPulse(prev => ({ ...prev, active: false })), 600);
      try { navigator.vibrate?.(30); } catch { /* ignore */ }
      showToast({ message: 'Snapped to best nearby time', type: 'info' });
    }
  }, [cities, selectedDate, setMeetingPercent, showToast]);
  
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

        @keyframes cityAddFlash {
          0% { background: rgba(22,163,74,0.05); }
          100% { background: transparent; }
        }
        @keyframes cityRowIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes cityRowOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(20px); opacity: 0; }
        }

        @keyframes snapPulse {
          0% { transform: scale(0); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        .snap-pulse-ring {
          animation: snapPulse 600ms ease-out forwards;
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

          {/* Now Indicator & Zenith Needle */}
          <div className="absolute top-0 bottom-0 right-0 w-full md:w-[calc(100%-200px)] pointer-events-none z-20">
            {snapPulse.active && (
              <div 
                className="absolute top-0 bottom-0 w-[1px] flex items-center justify-center pointer-events-none"
                style={{ left: `${snapPulse.x}%` }}
              >
                <div className="w-[10px] h-[10px] rounded-full border-2 border-[var(--text-primary)] snap-pulse-ring" />
              </div>
            )}
            <div
              className="absolute top-0 w-[1px] bg-[var(--text-primary)]"
              style={{ left: `${currentSliderPercent}%`, height: '100%', transition: 'left 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
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
              
              const utcH = Math.round((currentSliderPercent / 100) * 23);
              const localHour = getLocalHourAtUTC(utcH, city.timezone, selectedDate);
              const isSleeping = localHour >= 22 || localHour < 6;

              const isRemoving = removingIds.has(city.id);

              return (
                <div
                  key={city.id}
                  className={`flex flex-col md:flex-row w-full md:h-[100px] items-start md:items-center group relative border-b border-[var(--border-default)] py-4 gap-3 md:gap-0 city-row ${
                    dragOverIdx === idx ? "border-t-[2px] border-t-[var(--text-primary)]" : ""
                  }`}
                  style={{
                    animation: isRemoving 
                      ? 'cityRowOut 200ms ease-in forwards' 
                      : `cityRowIn 300ms cubic-bezier(0.16,1,0.3,1) ${idx * 60}ms forwards, cityAddFlash 1s ease-out ${idx * 60}ms forwards`,
                    maxHeight: isRemoving ? 0 : 500,
                    transition: isRemoving ? 'max-height 150ms ease-in, padding 150ms ease-in, opacity 150ms ease-in' : 'opacity 300ms ease',
                    opacity: isRemoving ? 0 : (isPresetLoading ? 0.5 : (draggedIdx === idx ? 0.4 : (isVisible ? 1 : 0))),
                    overflow: 'hidden',
                    paddingTop: isRemoving ? 0 : undefined,
                    paddingBottom: isRemoving ? 0 : undefined,
                    borderBottomWidth: isRemoving ? 0 : undefined,
                  }}
                  draggable="true"
                  onDragStart={(e) => { setDraggedIdx(idx); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDrop={(e) => { e.preventDefault(); if (draggedIdx !== null && draggedIdx !== idx) onReorderCities(draggedIdx, idx); setDraggedIdx(null); setDragOverIdx(null); }}
                  onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
                >
                  {/* Left Sidebar - Mobile Responsive Stacking */}
                  <div className="w-full md:w-[200px] md:min-w-[200px] md:max-w-[200px] shrink-0 h-auto md:h-full pr-[16px] relative flex flex-col justify-center bg-[var(--bg-surface)] md:bg-transparent py-2 md:py-0 px-3 md:px-0 rounded-md md:rounded-none">
                    <div className="hidden md:block absolute left-0 opacity-0 group-hover:opacity-100 cursor-grab text-[var(--text-muted)] p-2 -ml-5">
                      <DragHandleIcon />
                    </div>

                    <div className="flex flex-col gap-0.5 min-h-[44px] md:pl-2">
                      {/* Top row: Clock + Time */}
                      <div className="flex items-center gap-2">
                        <div className="hidden md:block">
                          <MiniClock 
                            hour={parseInt(meetingTimeStr.split(':')[0]) + (meetingTimeStr.includes('pm') && meetingTimeStr.split(':')[0] !== '12' ? 12 : (meetingTimeStr.includes('am') && meetingTimeStr.split(':')[0] === '12' ? -12 : 0))} 
                            minute={parseInt(meetingTimeStr.split(':')[1])} 
                            isSleeping={isSleeping}
                          />
                        </div>
                        <span 
                          key={meetingTimeStr}
                          className={`text-[18px] md:text-[20px] font-sans font-bold text-[var(--text-primary)] leading-none tracking-tight tabular-nums digit-pulse ${meetingPercent === null && !isFuture ? "pulse-time" : ""}`}
                          style={{ opacity: isSleeping ? 0.35 : 1, transition: 'opacity 600ms ease' }}
                        >
                          {meetingTimeStr}
                        </span>
                      </div>

                      {/* Middle row: Emoji + City Name */}
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="w-[18px] text-[14px] leading-none text-center flex-shrink-0">{city.emoji}</span>
                        <span className="text-sm font-medium leading-tight text-[var(--text-primary)] truncate">
                          {city.name}
                        </span>
                        {getHolidayForCity(city.countryCode, selectedDate.toISOString().split('T')[0]) && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[8px] px-1 py-0.5 rounded-full shrink-0">🎌</div>
                        )}
                      </div>

                      {/* Bottom row: Subtitle */}
                      <div className="flex items-center gap-1 mt-0.5" style={{ opacity: isSleeping ? 0.4 : 0.6, transition: 'opacity 600ms ease' }}>
                        <span className="text-[10px] leading-tight text-black/40 dark:text-white/40 font-medium">
                          {city.countryCode} · {getOffsetString(city.timezone, selectedDate)}
                        </span>
                        {dayInd && <span className="text-[9px] text-amber-600 font-bold ml-1">{dayInd.label}</span>}
                      </div>
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
                    <TimelineBar city={city} isFirstRow={idx === 0} selectedDate={selectedDate} index={idx} />
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
            <AvailabilitySparkline cities={cities} sliderPercent={currentSliderPercent} />
            
            {healthScore && (
              <div 
                className="mt-3 px-[14px] py-[10px] rounded-full text-[12px] font-sans font-semibold shadow-sm"
                style={{ backgroundColor: healthScore.bg, color: healthScore.color, transition: 'background-color 400ms ease, color 400ms ease' }}
              >
                {healthScore.label}
              </div>
            )}
            
            <div className="mt-4 relative w-full h-[20px] md:h-[20px] flex items-center group">
             <div className="absolute left-0 right-0 h-[6px] md:h-[4px] bg-[var(--border-strong)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${currentSliderPercent}%`,
                    backgroundImage: 'linear-gradient(90deg, var(--text-primary) 0%, rgba(var(--text-primary-rgb, 36,36,36),0.5) 100%)',
                  }}
                />
             </div>
             <input 
               type="range" min="0" max="100" step="0.1" 
               value={currentSliderPercent}
               onMouseDown={() => setIsDragging(true)}
               onMouseUp={() => { setIsDragging(false); handleSnap(currentSliderPercent); }}
               onTouchStart={() => setIsDragging(true)}
               onTouchEnd={() => { setIsDragging(false); handleSnap(currentSliderPercent); }}
               onChange={(e) => setMeetingPercent(parseFloat(e.target.value))}
               className="meeting-slider absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
             />
             <div
               className="absolute w-[24px] h-[24px] md:w-[20px] md:h-[20px] rounded-full bg-[var(--text-primary)] border-[2px] border-[var(--bg-page)] shadow-md pointer-events-none group-hover:scale-110 z-20"
               style={{
                 left: `calc(${currentSliderPercent}% - 10px)`,
                 boxShadow: (() => {
                   if (cities.length === 0) return undefined;
                   let minDist = Infinity;
                   for (let hh = 0; hh < 24; hh++) {
                     const ratio = cities.filter(c => {
                       const lh = getLocalHourAtUTC(hh, c.timezone, selectedDate);
                       return lh >= 9 && lh < 17;
                     }).length / cities.length;
                     if (ratio >= 0.75) {
                       const pct = (hh / 24) * 100;
                       minDist = Math.min(minDist, Math.abs(pct - currentSliderPercent));
                     }
                   }
                   return minDist <= 2
                     ? '0 0 0 3px rgba(22,163,74,0.2), 0 0 8px rgba(22,163,74,0.15)'
                     : undefined;
                 })(),
                 transition: 'left 75ms linear, box-shadow 200ms ease, transform 150ms ease',
               }}
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
