"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import SplashScreen from "../components/SplashScreen";
import Navbar from "../components/Navbar";
import CitySearch from "../components/CitySearch";
import Toast from "../components/Toast";
import useClock from "../hooks/useClock";
import useTimezones from "../hooks/useTimezones";
import { getOverlapHours, formatTime } from "../lib/timeUtils";
import { cities as allCities } from "../lib/cities";
import { OrbitIcon } from "../components/OrbitIcon";

const Timeline = dynamic(() => import("../components/Timeline"), { ssr: false });

export default function Home() {
  const [appReady, setAppReady] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [meetingPercent, setMeetingPercent] = useState<number | null>(null);
  const [sharedTime, setSharedTime] = useState<string | null>(null);
  const [goldenBadge, setGoldenBadge] = useState<string | null>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 3100);
    return () => clearTimeout(timer);
  }, []);

  const { now } = useClock();
  
  const {
    selectedCities,
    addCity,
    removeCity,
    reorderCities,
    timeFormat,
    toggleTimeFormat,
    maxCities,
    isInitialized,
  } = useTimezones();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const timeStr = params.get("time");
      if (timeStr) {
        const [h, m] = timeStr.split(":");
        const utcHour = parseInt(h);
        const utcMin = parseInt(m);
        const d = new Date();
        d.setUTCHours(utcHour, utcMin, 0, 0);
        const localHour = d.getHours();
        const localMin = d.getMinutes();
        const percent = ((localHour * 60 + localMin) / (24 * 60)) * 100;
        setMeetingPercent(percent);
        
        const displayD = new Date();
        displayD.setUTCHours(utcHour, utcMin, 0, 0);
        const displayStr = new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          hour: "numeric",
          minute: "2-digit",
          hour12: timeFormat === "12h"
        }).format(displayD);
        
        setSharedTime(displayStr);
      }
    }
  }, [timeFormat]);

  const handleQuickAdd = (id: string) => {
    const city = allCities.find((c) => c.id === id);
    if (
      city &&
      !selectedCities.some((c) => c.id === id) &&
      selectedCities.length < maxCities
    ) {
      addCity(city);
    }
  };

  const handleShare = useCallback(() => {
    if (typeof window !== "undefined") {
      const ids = selectedCities.map(c => c.id).join(",");
      let url = `${window.location.origin}?cities=${ids}`;
      
      if (meetingPercent !== null) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const totalMinutes = Math.round((meetingPercent / 100) * 24 * 60);
        d.setTime(d.getTime() + totalMinutes * 60 * 1000);
        
        const utcHour = d.getUTCHours().toString().padStart(2, '0');
        const utcMin = d.getUTCMinutes().toString().padStart(2, '0');
        url += `&time=${utcHour}:${utcMin}`;
      }
      
      navigator.clipboard.writeText(url).then(() => {
        setToastOpen(true);
      });
    }
  }, [selectedCities, meetingPercent, now]);

  const handleGoldenWindow = () => {
    if (selectedCities.length === 0) return;
    
    let bestHour = 0;
    let maxAwake = -1;
    let perfect = false;

    for (let i = 0; i < 24; i++) {
      const testDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 0, 0, 0);
      
      let awakeCount = 0;
      for (const city of selectedCities) {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: city.timezone,
          hour: "numeric",
          hourCycle: "h23",
        }).formatToParts(testDate);
        const hStr = parts.find((p) => p.type === "hour")?.value || "0";
        const h = parseInt(hStr, 10);
        if (h >= 9 && h < 17) {
          awakeCount++;
        }
      }

      if (awakeCount > maxAwake) {
        maxAwake = awakeCount;
        bestHour = i;
        if (awakeCount === selectedCities.length) {
          perfect = true;
        }
      }
    }

    const targetPercent = (bestHour / 24) * 100;
    const startPercent = meetingPercent !== null ? meetingPercent : ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
    const startTime = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / 600, 1);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const current = startPercent + (targetPercent - startPercent) * ease;
      setMeetingPercent(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), bestHour, 0, 0, 0);
        const timeStr = new Intl.DateTimeFormat("en-US", {
          hour: "numeric", minute: "2-digit", hour12: timeFormat === "12h"
        }).format(d);
        
        if (perfect) {
          setGoldenBadge(`✓ Perfect overlap at ${timeStr} — all cities available`);
        } else {
          setGoldenBadge(`✓ ${maxAwake}/${selectedCities.length} cities available at ${timeStr}`);
        }
        setTimeout(() => setGoldenBadge(null), 4000);
      }
    };
    requestAnimationFrame(animate);
  };

  // Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch(e.key.toLowerCase()) {
        case 'a':
          e.preventDefault();
          const addBtn = document.querySelector('button[title="Max 6 cities"]') as HTMLButtonElement || 
                         Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Add City'));
          if (addBtn && !addBtn.disabled) {
            addBtn.click();
          }
          break;
        case 's':
          e.preventDefault();
          handleShare();
          break;
        case 't':
          e.preventDefault();
          toggleTimeFormat();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleShare, toggleTimeFormat]);

  const nextOverlap = useMemo(() => {
    if (selectedCities.length === 0) return null;
    const overlaps = getOverlapHours(selectedCities.map((c) => c.timezone));
    if (overlaps.length === 0) return null;

    const d = new Date();
    const cityTime = new Date(
      d.toLocaleString("en-US", { timeZone: selectedCities[0].timezone })
    ).getTime();
    const localTime = new Date(d.toLocaleString("en-US")).getTime();
    const baseShift = (cityTime - localTime) / 3600000;

    const localOverlaps = overlaps
      .map((h) => {
        let localH = h - baseShift;
        if (localH < 0) localH += 24;
        if (localH >= 24) localH -= 24;
        return localH;
      })
      .sort((a, b) => a - b);

    const currentHour = now.getHours() + now.getMinutes() / 60;
    const nextHour = localOverlaps.find((h) => h >= currentHour);
    const targetHour = nextHour !== undefined ? nextHour : localOverlaps[0];

    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    targetDate.setTime(
      targetDate.getTime() + Math.round(targetHour * 60 * 60 * 1000)
    );

    if (targetHour < currentHour) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    return formatTime(
      targetDate,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      timeFormat
    );
  }, [selectedCities, now, timeFormat]);

  if (!isInitialized) return null;

  return (
    <>
      {!appReady && <SplashScreen />}

      <div
        className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]"
        style={{ opacity: appReady ? 1 : 0, transition: 'opacity 400ms ease', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
        onClick={() => {
          if (sharedTime) {
            setSharedTime(null);
            setMeetingPercent(null);
          }
        }}
      >
        <style>{`
          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUpFade10 {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUpFade8 {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes expandLine {
            from { width: 0; }
            to { width: 40px; }
          }
          [data-theme="dark"] .ambient-orbs-container { display: none !important; }
          @keyframes drift1 {
            from { transform: translate(0, 0); }
            to { transform: translate(30px, 30px); }
          }
          @keyframes drift2 {
            from { transform: translate(0, 0); }
            to { transform: translate(-20px, -20px); }
          }
        `}</style>
        
        {/* Ambient Orbs */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden ambient-orbs-container" style={{ display: 'block' }}>
          <div 
            className="absolute rounded-full" 
            style={{ width: 400, height: 400, background: 'rgba(94,106,210,0.04)', filter: 'blur(60px)', top: '10%', left: '10%', animation: 'drift1 20s infinite alternate linear' }} 
          />
          <div 
            className="absolute rounded-full" 
            style={{ width: 300, height: 300, background: 'rgba(34,211,238,0.03)', filter: 'blur(60px)', bottom: '10%', right: '10%', animation: 'drift2 25s infinite alternate linear' }} 
          />
        </div>
        <Navbar 
          timeFormat={timeFormat} 
          toggleTimeFormat={toggleTimeFormat} 
          onShare={handleShare}
        />

        {sharedTime && (
          <div className="w-full bg-[var(--bg-elevated)] border-b border-[var(--border-default)] px-[24px] py-[8px] flex items-center justify-center relative">
            <span className="text-[12px] font-sans text-[var(--text-secondary)]">
              Viewing shared time: {sharedTime} UTC
            </span>
            <button 
              className="absolute right-[24px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={(e) => {
                e.stopPropagation();
                setSharedTime(null);
                setMeetingPercent(null);
              }}
            >
              ×
            </button>
          </div>
        )}

        <main className="w-full max-w-[1100px] mx-auto px-[24px] pt-[40px] pb-[80px] relative z-10">
          {/* Hero Section */}
          <section className="flex flex-col">
            <h1 className="text-[32px] md:text-[48px] font-display font-semibold leading-[1.1] tracking-[-0.5px]">
              <span className="inline-block opacity-0 translate-y-[20px]" style={{ animation: appReady ? 'slideUpFade 500ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards' : 'none' }}>Plan</span>&nbsp;
              <span className="inline-block opacity-0 translate-y-[20px]" style={{ animation: appReady ? 'slideUpFade 500ms cubic-bezier(0.16, 1, 0.3, 1) 280ms forwards' : 'none' }}>Across</span><br />
              <span className="inline-block opacity-0 translate-y-[20px]" style={{ animation: appReady ? 'slideUpFade 500ms cubic-bezier(0.16, 1, 0.3, 1) 360ms forwards' : 'none' }}>Time</span>&nbsp;
              <span className="inline-block opacity-0 translate-y-[20px]" style={{ animation: appReady ? 'slideUpFade 500ms cubic-bezier(0.16, 1, 0.3, 1) 440ms forwards' : 'none' }}>Zones.</span>
            </h1>
            <p 
              className="mt-[12px] text-[16px] font-sans text-[var(--text-secondary)] max-w-[480px] opacity-0"
              style={{
                animation: appReady ? 'slideUpFade10 400ms ease 600ms forwards' : 'none',
                transform: 'translateY(10px)'
              }}
            >
              Add your cities. Find the perfect overlap. Share with your team.
            </p>

            <div 
              className="mt-[20px] flex items-center flex-wrap gap-[12px] opacity-0 translate-y-[8px]"
              style={{ animation: appReady ? 'slideUpFade8 350ms ease 800ms forwards' : 'none' }}
            >
              <CitySearch
                onAddCity={addCity}
                selectedCities={selectedCities}
                maxCities={maxCities}
                now={now}
                timeFormat={timeFormat}
              />
              
              <div className="relative">
                <button
                  onClick={handleGoldenWindow}
                  className="flex items-center gap-[6px] bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[8px] px-[16px] py-[10px] text-[14px] font-sans font-semibold hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 active:translate-y-0 active:shadow-sm"
                >
                  <span className="text-[var(--text-primary)] flex items-center justify-center"><OrbitIcon size={14} speed={2} /></span> Best Time
                </button>
                {goldenBadge && (
                  <div className="absolute top-full left-0 mt-[8px] whitespace-nowrap text-[12px] font-sans text-[#16a34a] bg-[rgba(22,163,74,0.1)] px-[10px] py-[4px] rounded-[6px] animate-in fade-in slide-in-from-top-1 duration-300">
                    {goldenBadge}
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center gap-[8px]">
                <span className="text-[14px] font-sans text-[var(--text-secondary)] ml-[4px]">
                  or try:
                </span>
                {["tokyo", "new-york", "london"].map((id) => {
                  const city = allCities.find((c) => c.id === id);
                  if (!city) return null;
                  const isAdded = selectedCities.some((c) => c.id === id);
                  if (isAdded) return null;

                  return (
                    <button
                      key={id}
                      onClick={() => handleQuickAdd(id)}
                      className="px-[12px] py-[6px] rounded-[6px] bg-[var(--bg-page)] border border-[var(--border-default)] shadow-sm text-[11px] font-sans hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 active:translate-y-0 active:shadow-sm"
                    >
                      {city.emoji} {city.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div 
              className="mt-[16px] flex items-center flex-wrap gap-[8px] text-[12px] font-sans text-[var(--text-secondary)] opacity-0"
              style={{ animation: appReady ? 'fadeIn 300ms ease 1000ms forwards' : 'none' }}
            >
              <span>{selectedCities.length} cities active</span>
              <span>·</span>
              <span>
                {nextOverlap ? `Next overlap: ${nextOverlap}` : "No overlapping hours"}
              </span>
              <span>·</span>
              <div className="flex items-center gap-[6px]">
                <style>{`
                  @keyframes pulseSlow {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(2.5); opacity: 0; }
                  }
                `}</style>
                <div className="relative w-[6px] h-[6px] rounded-full bg-[var(--success)]">
                  <div className="absolute inset-0 rounded-full bg-[var(--success)] opacity-0" style={{ animation: "pulseSlow 2s infinite" }} />
                </div>
                Updated live
              </div>
            </div>
          </section>

          {/* Timeline Section */}
          {selectedCities.length > 0 ? (
            <section className="mt-[40px] flex flex-col">
              <div 
                className="flex items-end justify-between border-b border-[var(--border-default)] pb-[12px] opacity-0 relative"
                style={{ animation: appReady ? 'fadeIn 300ms ease 1100ms forwards' : 'none' }}
              >
                <h2 className="text-[14px] font-display font-semibold relative inline-block">
                  Your Timeline
                  <div 
                    className="absolute -bottom-[13px] left-0 h-[2px] bg-[var(--text-primary)]"
                    style={{ animation: appReady ? 'expandLine 400ms ease 1400ms forwards' : 'none', width: '0' }}
                  />
                </h2>
                <div className="text-[12px] font-sans text-[var(--text-secondary)]">
                  {new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  }).format(now)}{" "}
                  · {formatTime(now, "UTC", timeFormat)} UTC
                </div>
              </div>

              <div className="mt-[16px]">
                <Timeline
                  cities={selectedCities}
                  now={now}
                  timeFormat={timeFormat}
                  onRemoveCity={removeCity}
                  onReorderCities={reorderCities}
                  meetingPercent={meetingPercent}
                  setMeetingPercent={setMeetingPercent}
                />
              </div>

              {/* Legend Row */}
              <div style={{ 
                display: 'flex', 
                gap: 20, 
                alignItems: 'center',
                marginTop: 16,
                flexWrap: 'wrap'
              }}>
                {[
                  { color: 'var(--timeline-night)', label: 'Deep night' },
                  { color: 'var(--timeline-shoulder)', label: 'Morning / Evening' },
                  { color: 'var(--timeline-working)', label: 'Working hours', border: true },
                  { color: 'var(--timeline-overlap)', label: 'Best overlap' },
                ].map(item => (
                  <div key={item.label} style={{ 
                    display: 'flex', alignItems: 'center', gap: 6 
                  }}>
                    <div style={{ 
                      width: 12, height: 12, 
                      borderRadius: 3,
                      background: item.color,
                      border: item.border 
                        ? '1px solid var(--border-strong)' 
                        : '1px solid var(--border-default)',
                      flexShrink: 0
                    }} />
                    <span style={{ 
                      fontSize: 12, 
                      color: 'var(--text-secondary)',
                      fontFamily: 'Inter, sans-serif',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-[80px] flex flex-col items-center justify-center text-center">
              <div className="text-[48px] mb-[16px]">🌍</div>
              <h3 className="text-[20px] font-display font-semibold">
                Add your first city
              </h3>
              <p className="mt-[8px] text-[14px] font-sans text-[var(--text-secondary)]">
                Track time zones across the globe
              </p>
              <div className="mt-[20px]">
                <CitySearch
                  onAddCity={addCity}
                  selectedCities={selectedCities}
                  maxCities={maxCities}
                  now={now}
                  timeFormat={timeFormat}
                />
              </div>
            </section>
          )}
        </main>
      </div>
      
      {toastOpen && <Toast message="Link copied!" submessage="Share with your team" onClose={() => setToastOpen(false)} />}
    </>
  );
}
