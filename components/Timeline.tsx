"use client";

import React, { useState, useRef, useMemo, memo } from "react";
import { City } from "../lib/cities";
import {
  hourToPercent,
  getOverlapHours,
  formatTime,
  getOffsetString,
  isDSTActive,
} from "../lib/timeUtils";

interface TimelineProps {
  cities: City[];
  now: Date;
  timeFormat: "12h" | "24h";
  onRemoveCity: (cityId: string) => void;
  onReorderCities: (from: number, to: number) => void;
  meetingPercent: number | null;
  setMeetingPercent: (p: number | null) => void;
}

const DragHandleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 3C4.5 3.55228 4.05228 4 3.5 4C2.94772 4 2.5 3.55228 2.5 3C2.5 2.44772 2.94772 2 3.5 2C4.05228 2 4.5 2.44772 4.5 3Z" />
    <path d="M4.5 7C4.5 7.55228 4.05228 8 3.5 8C2.94772 8 2.5 7.55228 2.5 7C2.5 6.44772 2.94772 6 3.5 6C4.05228 6 4.5 6.44772 4.5 7Z" />
    <path d="M4.5 11C4.5 11.5523 4.05228 12 3.5 12C2.94772 12 2.5 11.5523 2.5 11C2.5 10.4477 2.94772 10 3.5 10C4.05228 10 4.5 10.4477 4.5 11Z" />
    <path d="M10.5 3C10.5 3.55228 10.0523 4 9.5 4C8.94772 4 8.5 3.55228 8.5 3C8.5 2.44772 8.94772 2 9.5 2C10.0523 2 10.5 2.44772 10.5 3Z" />
    <path d="M10.5 7C10.5 7.55228 10.0523 8 9.5 8C8.94772 8 8.5 7.55228 8.5 7C8.5 6.44772 8.94772 6 9.5 6C10.0523 6 10.5 6.44772 10.5 7Z" />
    <path d="M10.5 11C10.5 11.5523 10.0523 12 9.5 12C8.94772 12 8.5 11.5523 8.5 11C8.5 10.4477 8.94772 10 9.5 10C10.0523 10 10.5 10.4477 10.5 11Z" />
  </svg>
);

const RemoveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const getCityTimeShift = (timezone: string) => {
  const d = new Date();
  const cityTime = new Date(d.toLocaleString("en-US", { timeZone: timezone })).getTime();
  const localTime = new Date(d.toLocaleString("en-US")).getTime();
  return (cityTime - localTime) / 3600000;
};

function getLocalHourAtUTC(utcHour: number, timezone: string): number {
  const date = new Date();
  date.setUTCHours(utcHour, 0, 0, 0);
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  return h === 24 ? 0 : h;
}

function getMeetingHealth(sliderPercent: number, cities: City[]) {
  const utcHour = Math.floor((sliderPercent / 100) * 24);
  const available = cities.filter(c => {
    const h = getLocalHourAtUTC(utcHour, c.timezone);
    return h >= 9 && h < 17;
  });
  const a = available.length;
  const t = cities.length;
  const ratio = a / t;
  if (ratio === 1)   return { label: `✓ Perfect — all ${t} teams available`, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' };
  if (ratio >= 0.75) return { label: `Good — ${a}/${t} teams available`,      color: '#ca8a04', bg: 'rgba(202,138,4,0.1)' };
  if (ratio >= 0.5)  return { label: `Fair — ${a}/${t} teams available`,       color: '#d97706', bg: 'rgba(217,119,6,0.1)' };
  return               { label: `Poor — only ${a}/${t} in working hours`,      color: '#dc2626', bg: 'rgba(220,38,38,0.1)' };
}

const TimelineBar = ({ city }: { city: City }) => {
  const shift = useMemo(() => getCityTimeShift(city.timezone), [city.timezone]);

  const renderSegment = (start: number, end: number, bgColor: string, borderColor?: string, boxShadow?: string) => {
    return [-1, 0, 1].map((day) => {
      const localStart = start - shift + day * 24;
      const localEnd = end - shift + day * 24;
      if (localEnd <= 0 || localStart >= 24) return null;

      const left = Math.max(0, localStart) / 24 * 100;
      const right = Math.min(24, localEnd) / 24 * 100;
      const width = right - left;
      if (width <= 0) return null;

      return (
        <div
          key={`${day}-${start}`}
          className={`absolute top-0 bottom-0 timeline-segment`}
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
        />
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
      
      {[3, 6, 9, 12, 15, 18, 21].map(h => (
        <div 
          key={`tick-${h}`}
          className="absolute bottom-0 w-[1px] h-[6px] bg-[rgba(34,42,53,0.15)] dark:bg-[rgba(255,255,255,0.15)] tick-mark z-[3]"
          style={{ left: `${(h/24)*100}%` }}
        />
      ))}
    </div>
  );
};

const AnalogClock = ({ timezone, now, meetingDate }: { timezone: string, now: Date, meetingDate: Date | null }) => {
  const displayDate = meetingDate || now;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(displayDate);
  
  const hStr = parts.find((p) => p.type === "hour")?.value || "0";
  const mStr = parts.find((p) => p.type === "minute")?.value || "0";
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);

  const hourAngle = (hours % 12) * 30 + (minutes / 60) * 30;
  const minuteAngle = minutes * 6;

  return (
    <div className="w-[18px] h-[18px] rounded-full border border-[var(--border-default)] bg-[var(--bg-page)] relative flex items-center justify-center flex-shrink-0">
      <div 
        className="absolute w-[1.5px] h-[4px] bg-[var(--text-primary)] rounded-full origin-bottom"
        style={{ transform: `translateY(-2px) rotate(${hourAngle}deg)` }}
      />
      <div 
        className="absolute w-[1px] h-[6px] bg-[var(--text-primary)] rounded-full origin-bottom"
        style={{ transform: `translateY(-3px) rotate(${minuteAngle}deg)` }}
      />
      <div className="w-[2px] h-[2px] rounded-full bg-[var(--text-primary)] z-10" />
    </div>
  );
};

const Timeline = ({
  cities,
  now,
  timeFormat,
  onRemoveCity,
  onReorderCities,
  meetingPercent,
  setMeetingPercent,
}: TimelineProps) => {
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState({ left: 0, top: 20 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
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
  };

  const handleMouseLeave = () => setHoverPercent(null);

  const handleRemove = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onRemoveCity(id);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  };

  const blocks = useMemo(() => {
    if (cities.length === 0) return [];
    const overlaps = getOverlapHours(cities.map((c) => c.timezone));
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
  }, [cities]);

  const baseShift = cities.length > 0 ? getCityTimeShift(cities[0].timezone) : 0;
  const nowPercent = hourToPercent(now.getHours(), now.getMinutes());
  
  const currentSliderPercent = meetingPercent !== null ? meetingPercent : nowPercent;

  const hoverDate = useMemo(() => {
    if (hoverPercent === null) return now;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const totalMinutes = Math.round((hoverPercent / 100) * 24 * 60);
    return new Date(d.getTime() + totalMinutes * 60 * 1000);
  }, [hoverPercent, now]);
  
  const getMeetingDateStr = (timezone: string) => {
    if (meetingPercent === null) return "";
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const totalMinutes = Math.round((meetingPercent / 100) * 24 * 60);
    const targetDate = new Date(d.getTime() + totalMinutes * 60 * 1000);
    
    return formatTime(targetDate, timezone, timeFormat);
  };

  const getDayIndicator = (timezone: string) => {
    const targetDate = meetingPercent !== null 
      ? new Date(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime() + Math.round((meetingPercent / 100) * 24 * 60) * 60000)
      : now;
      
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
  };

  const markers = [0, 3, 6, 9, 12, 15, 18, 21];

  const [copied, setCopied] = useState(false);
  const handleCopyTimes = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const baseHourStr = formatTime(hoverDate, "UTC", timeFormat);
    const title = `${baseHourStr} UTC\n`;
    
    const txt = title + cities.map(c => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const tm = Math.round(((meetingPercent ?? hoverPercent ?? nowPercent) / 100) * 24 * 60);
      const td = new Date(d.getTime() + tm * 60 * 1000);
      return `${c.name}: ${formatTime(td, c.timezone, "12h")}`;
    }).join('\n');
    
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleCreateEvent = () => {
    if (meetingPercent === null) return;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const totalMinutes = Math.round((meetingPercent / 100) * 24 * 60);
    d.setTime(d.getTime() + totalMinutes * 60 * 1000);
    
    const startUTC = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endD = new Date(d.getTime() + 60 * 60 * 1000);
    const endUTC = endD.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const cityTimes = cities.map(c => {
      return `${c.name}: ${formatTime(d, c.timezone, "12h")}`;
    }).join('\\n');
    
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Orbit//Timezone Planner//EN
BEGIN:VEVENT
DTSTART:${startUTC}
DTEND:${endUTC}
SUMMARY:Meeting — Orbit
DESCRIPTION:${cityTimes}
LOCATION:Remote / Online
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orbit-meeting.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const healthScore = useMemo(() => {
    if (cities.length === 0) return null;
    return getMeetingHealth(currentSliderPercent, cities);
  }, [currentSliderPercent, cities]);

  const meetingDateObj = meetingPercent !== null 
    ? new Date(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime() + Math.round((meetingPercent / 100) * 24 * 60) * 60000)
    : null;

  return (
    <div className="relative w-full pb-[40px]">
      <style>{`
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
        
        .pulse-time {
          animation: pulseTime 1s infinite;
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
        .meeting-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--text-primary);
          border: 2px solid var(--bg-page);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          cursor: pointer;
        }
        
        [data-theme="dark"] .tick-mark {
          background-color: rgba(255,255,255,0.15) !important;
        }
      `}</style>

      <div className="relative w-full flex justify-end h-6 items-center mb-2">
        {meetingPercent !== null && (
          <button 
            onClick={() => setMeetingPercent(null)}
            className="text-[11px] font-sans font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 absolute right-0 -top-6 bg-transparent"
          >
            ↺ Now
          </button>
        )}
      </div>

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

          {/* Now Indicator & Needle */}
          <div className="absolute top-0 bottom-0 right-0 w-full md:w-[calc(100%-200px)] pointer-events-none z-20">
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-[var(--text-primary)] transition-all duration-[50ms] ease-linear now-indicator-line"
              style={{ left: `${currentSliderPercent}%` }}
            >
              <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] bg-[var(--text-primary)] rounded-full now-indicator-dot" />
              
              {/* Timestamp Label below rows */}
              <div 
                className="absolute top-full mt-[8px] left-1/2 -translate-x-1/2 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[6px] px-[8px] py-[2px] text-[11px] font-semibold font-sans text-[var(--text-primary)] whitespace-nowrap time-display"
                style={{ 
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {meetingPercent !== null ? getMeetingDateStr(Intl.DateTimeFormat().resolvedOptions().timeZone) : formatTime(now, Intl.DateTimeFormat().resolvedOptions().timeZone, timeFormat)}
              </div>

              {/* Scrubber Connector Line */}
              {meetingPercent !== null && (
                <div className="absolute top-[calc(100%+32px)] left-1/2 -translate-x-1/2 w-[1px] h-[24px] border-l border-dashed border-[var(--border-strong)] pointer-events-none" />
              )}
            </div>
          </div>

          {/* Hover Tooltip & Line */}
          <div className="absolute top-0 bottom-0 right-0 w-full md:w-[calc(100%-200px)] pointer-events-none z-30 hidden md:block overflow-visible">
            {hoverPercent !== null && meetingPercent === null && (
              <>
                <div
                  className="absolute top-0 bottom-0 w-px border-l border-dashed border-[var(--text-muted)]"
                  style={{ left: `${hoverPercent}%` }}
                />
                <div
                  className="absolute z-40 bg-[var(--bg-elevated)] shadow-lg rounded-[10px] min-w-[180px] pointer-events-auto border border-[var(--border-default)] flex flex-col"
                  style={{
                    left: `calc(${hoverPercent}% + 16px)`,
                    top: hoverPos.top - 20 > 0 ? hoverPos.top - 20 : 20,
                    transform: hoverPercent > 70 ? "translateX(-100%)" : "none",
                    marginLeft: hoverPercent > 70 ? "-32px" : "0",
                    transition: "left 80ms ease, top 80ms ease",
                    animation: hoverPercent > 70 ? 'popInRight 100ms ease forwards' : 'popInLeft 100ms ease forwards'
                  }}
                  onMouseMove={(e) => e.stopPropagation()}
                >
                  <div className="px-3.5 pt-3 pb-2">
                    <div className="text-[12px] font-semibold text-[var(--text-secondary)] mb-2 font-sans flex justify-between items-center">
                      <span className="time-display">UTC · {formatTime(hoverDate, "UTC", timeFormat)}</span>
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      {cities.map((c) => {
                        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                        const tm = Math.round((hoverPercent / 100) * 24 * 60);
                        const td = new Date(d.getTime() + tm * 60 * 1000);
                        return (
                          <div key={c.id} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{c.emoji}</span>
                              <span className="text-[12px] font-display font-semibold text-[var(--text-primary)]">
                                {c.name}
                              </span>
                            </div>
                            <span className="text-[13px] font-semibold text-[var(--text-primary)] font-sans time-display">
                              {formatTime(td, c.timezone, "12h").replace(/ (AM|PM)/i, (m) => m.toLowerCase())}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyTimes}
                    className="w-full py-[10px] text-[11px] font-sans font-semibold text-[#898989] border-t border-[var(--border-default)] hover:text-[#242424] hover:bg-[var(--bg-surface)] transition-colors rounded-b-[10px]"
                  >
                    {copied ? "✓ Copied" : "Copy all times"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Rows */}
          <div className="relative bg-[var(--bg-page)]">
            {cities.map((city, idx) => {
              const activeDST = isDSTActive(city.timezone);
              const dayInd = getDayIndicator(city.timezone);
              
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
                  onDragStart={(e) => {
                    setDraggedIdx(idx);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(idx);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIdx !== null && draggedIdx !== idx) {
                      onReorderCities(draggedIdx, idx);
                    }
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                >
                  {/* Left Sidebar - Typographic Hierarchy */}
                  <div className="w-[200px] min-w-[200px] max-w-[200px] shrink-0 h-auto md:h-full pr-[16px] relative flex flex-col justify-center gap-[2px] bg-[var(--bg-surface)] py-2 md:py-0 px-3 md:px-0 rounded-md md:rounded-none md:bg-transparent">
                    <div className="hidden md:block absolute left-0 opacity-0 group-hover:opacity-100 cursor-grab text-[var(--text-muted)] p-2 -ml-5">
                      <DragHandleIcon />
                    </div>

                    {/* Row 1 */}
                    <div className="flex items-center gap-1.5 md:pl-2">
                      <span className="w-[24px] text-[16px] leading-none text-center flex-shrink-0">{city.emoji}</span>
                      <span className="text-[14px] font-display font-semibold text-[var(--text-primary)] leading-none max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {city.name}
                      </span>
                    </div>
                    
                    {/* Row 2 */}
                    <div className="pl-[30px] md:pl-[38px] text-[11px] font-sans text-[var(--text-secondary)] leading-none max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
                      {city.country}
                    </div>

                    {/* Row 3 */}
                    <div className="pl-[30px] md:pl-[38px] flex items-center gap-2 mt-[6px]">
                      <AnalogClock timezone={city.timezone} now={now} meetingDate={meetingDateObj} />
                      <div className="transition-all duration-[120ms] ease-in-out badge-container">
                        <span 
                          key={meetingPercent !== null ? Math.floor(meetingDateObj?.getTime()! / 1000) : now.getSeconds()}
                          className={`inline-block text-[20px] font-sans font-bold text-[var(--text-primary)] leading-none tracking-tight time-display ${meetingPercent === null ? "pulse-time" : ""}`}
                          style={{ animation: 'fadeTime 0.15s ease' }}
                        >
                          {meetingPercent !== null ? getMeetingDateStr(city.timezone) : formatTime(now, city.timezone, timeFormat)}
                        </span>
                      </div>
                    </div>

                    {/* Row 4 */}
                    <div className="pl-[30px] md:pl-[38px] flex flex-wrap items-center gap-1 mt-[4px]">
                      <div className="text-[10px] font-sans text-[var(--text-muted)] font-medium leading-none bg-transparent">
                        {getOffsetString(city.timezone)}
                      </div>
                      {activeDST && (
                        <div className="text-[9px] font-sans text-[#d97706] bg-[rgba(217,119,6,0.08)] rounded-[3px] px-[4px] py-[1px] leading-none border-none">
                          DST
                        </div>
                      )}
                      {dayInd && (
                        <div className="text-[9px] font-sans text-[#d97706] bg-[rgba(217,119,6,0.08)] rounded-[3px] px-[4px] py-[1px] leading-none border-none">
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

                  {/* Right Area (Timeline Bar) */}
                  <div className="flex-1 w-full min-w-0 relative flex items-center h-[48px] md:h-full">
                    <TimelineBar city={city} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meeting Time Finder Slider */}
      {cities.length > 0 && (
        <div className="mt-[24px] flex flex-col items-center w-full md:pl-[200px] relative z-20">
           <div className="flex items-center gap-3 mb-3">
             <div className="text-[12px] font-sans text-[var(--text-secondary)]">
               Drag to find the best meeting time
             </div>
             {healthScore && (
               <div 
                 className="px-[14px] py-[10px] rounded-full text-[12px] font-sans font-semibold shadow-sm"
                 style={{ 
                   backgroundColor: healthScore.bg, 
                   color: healthScore.color,
                   transition: 'background-color 250ms ease, color 250ms ease, border-color 250ms ease'
                 }}
               >
                 {healthScore.label}
               </div>
             )}
           </div>
           
           <div className="relative w-full h-[20px] flex items-center group">
             {/* Custom Track */}
             <div className="absolute left-0 right-0 h-[4px] bg-[var(--border-strong)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--text-primary)] transition-all duration-75" 
                  style={{ width: `${currentSliderPercent}%` }} 
                />
             </div>
             {/* Slider Input */}
             <input 
               type="range" 
               min="0" 
               max="100" 
               step="0.1" 
               value={currentSliderPercent}
               onChange={(e) => setMeetingPercent(parseFloat(e.target.value))}
               className="meeting-slider absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
             />
             <div 
               className="absolute w-[20px] h-[20px] rounded-full bg-[var(--text-primary)] border-[2px] border-[var(--bg-page)] shadow-md pointer-events-none transition-all duration-75 group-hover:scale-110 z-20"
               style={{ left: `calc(${currentSliderPercent}% - 10px)` }}
             />
           </div>
           
           <div className="flex items-center gap-[12px] mt-6">
             {meetingPercent !== null && (
               <>
                 <button 
                   onClick={() => setMeetingPercent(null)}
                   className="text-[12px] font-sans font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors"
                 >
                   Reset to live time
                 </button>
                 <button
                   onClick={handleCreateEvent}
                   className="flex items-center gap-[6px] shadow-sm border border-[var(--border-default)] rounded-[8px] px-[14px] py-[10px] text-[13px] font-sans font-semibold text-[var(--text-primary)] bg-[var(--bg-page)] hover:shadow-md hover:-translate-y-[1px] transition-all duration-150"
                 >
                   📅 Add to Calendar
                 </button>
               </>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

export default memo(Timeline);
