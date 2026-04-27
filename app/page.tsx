"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import SplashScreen from "../components/SplashScreen";
import Navbar from "../components/Navbar";
import CitySearch from "../components/CitySearch";
import OrbitNote from "../components/OrbitNote";
import useClock from "../hooks/useClock";
import useTimezones from "../hooks/useTimezones";
import { useTeamPresets } from "../hooks/useTeamPresets";
import { useTheme } from "../components/ThemeProvider";
import { useToast } from "../hooks/useToast";
import { getOverlapHours, formatTime } from "../lib/timeUtils";
import { cities as allCities, City } from "../lib/cities";
import { OrbitIcon } from "../components/OrbitIcon";

const Timeline = dynamic(() => import("../components/Timeline"), { ssr: false });

const SUBTITLE = "Add your cities. Find the perfect overlap. Share with your team.";

function useTypewriter(active: boolean) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(SUBTITLE.slice(0, i));
      if (i >= SUBTITLE.length) { clearInterval(id); setDone(true); }
    }, 25);
    return () => clearInterval(id);
  }, [active]);
  return { displayed, done };
}

function getLocalHourAtUTC(utcHour: number, tz: string, date: Date): number {
  try {
    const d = new Date(date);
    d.setUTCHours(utcHour, 0, 0, 0);
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: tz,
    }).formatToParts(d);
    const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    return isNaN(h) ? 0 : h === 24 ? 0 : h;
  } catch { return 0; }
}

function getOverlapWindow(timezones: string[], date: Date): string {
  const hours = getOverlapHours(timezones, date);
  if (hours.length === 0) return '';

  const formatH = (h: number) => {
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    return h > 12 ? `${h - 12}pm` : `${h}am`;
  };

  const first = Math.min(...hours);
  const last = Math.max(...hours);
  return `${formatH(first)}\u2013${formatH(last + 1)} UTC (${hours.length}h)`;
}

function findBestTime(cities: City[], date: Date): { percent: number; maxScore: number; bestHour: number; perfect: boolean } {
  let bestScore = -1;
  let bestHour = 9;
  
  for (let utcH = 0; utcH < 24; utcH++) {
    let score = 0;
    cities.forEach(city => {
      const localH = getLocalHourAtUTC(utcH, city.timezone, date);
      if (localH >= 10 && localH < 15) score += 3;
      else if (localH >= 9 && localH < 17) score += 2;
      else if (localH === 8 || (localH >= 17 && localH < 19)) score += 1;
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestHour = utcH;
    }
  }
  
  let perfect = true;
  cities.forEach(city => {
    const h = getLocalHourAtUTC(bestHour, city.timezone, date);
    if (h < 9 || h >= 17) perfect = false;
  });

  return { 
    percent: (bestHour / 24) * 100, 
    maxScore: bestScore, 
    bestHour,
    perfect 
  };
}

export default function Home() {
  const [appReady, setAppReady]             = useState(false);
  const [meetingPercent, setMeetingPercent] = useState<number | null>(null);
  const [sharedTime, setSharedTime]         = useState<string | null>(null);
  const [sharedNote, setSharedNote]         = useState<string | null>(null);
  const [showNoteBanner, setShowNoteBanner] = useState(true);
  const [goldenBadge, setGoldenBadge]       = useState<string | null>(null);
  const [shareAnimating, setShareAnimating] = useState(false);
  const [bestAnimating, setBestAnimating]   = useState(false);
  const [selectedDate, setSelectedDate]     = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSavingTeam, setIsSavingTeam]     = useState(false);
  const [teamName, setTeamName]             = useState("");
  const [showShortcuts, setShowShortcuts]   = useState(false);
  const [isPresetLoading, setIsPresetLoading] = useState(false);
  
  const { now } = useClock();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const {
    selectedCities, addCity, removeCity, reorderCities,
    timeFormat, toggleTimeFormat, maxCities, isInitialized,
    noteText, updateNote, setCitiesByIds
  } = useTimezones();

  const { presets, savePreset, loadPreset, deletePreset } = useTeamPresets();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
      document.documentElement.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 3100);
    return () => clearTimeout(t);
  }, []);

  const { displayed: subtitle, done: subtitleDone } = useTypewriter(appReady);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const timeStr = params.get("time");
    if (timeStr) {
      const [h, m] = timeStr.split(":");
      const d = new Date();
      d.setUTCHours(parseInt(h), parseInt(m), 0, 0);
      const pct = ((d.getHours() * 60 + d.getMinutes()) / (24 * 60)) * 100;
      setMeetingPercent(pct);
      const displayStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC", hour: "numeric", minute: "2-digit", hour12: timeFormat === "12h",
      }).format(d);
      setSharedTime(displayStr);
    }
    const note = params.get("note");
    if (note) {
      try { setSharedNote(decodeURIComponent(note)); } catch { setSharedNote(note); }
    }
  }, [timeFormat]);

  const handleQuickAdd = useCallback((id: string) => {
    const city = allCities.find((c) => c.id === id);
    if (city && !selectedCities.some((c) => c.id === id) && selectedCities.length < maxCities) {
      addCity(city);
      showToast({ message: `${city.name} added`, type: "success" });
    }
  }, [selectedCities, maxCities, addCity, showToast]);

  const handleShare = useCallback(() => {
    if (typeof window === "undefined") return;
    setShareAnimating(true);
    setTimeout(() => setShareAnimating(false), 300);
    const params = new URLSearchParams();
    params.set("cities", selectedCities.map((c) => c.id).join(","));
    if (meetingPercent !== null) {
      const d = new Date(selectedDate);
      d.setHours(0, 0, 0, 0);
      d.setTime(d.getTime() + Math.round((meetingPercent / 100) * 24 * 60) * 60 * 1000);
      params.set("time", `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`);
    }
    if (noteText.trim()) params.set("note", encodeURIComponent(noteText));
    navigator.clipboard.writeText(`${window.location.origin}?${params.toString()}`).then(() => {
      showToast({ message: "Link copied!", submessage: "Share with your team", type: "success" });
    });
  }, [selectedCities, meetingPercent, selectedDate, noteText, showToast]);

  const handleGoldenWindow = useCallback(() => {
    if (selectedCities.length === 0) return;
    const { percent: targetPercent, bestHour, perfect } = findBestTime(selectedCities, selectedDate);
    const nowPercent = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
    const start = meetingPercent ?? nowPercent;
    const duration = 800;
    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setMeetingPercent(start + (targetPercent - start) * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const d = new Date(selectedDate);
        d.setUTCHours(bestHour, 0, 0, 0);
        const ts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: timeFormat === "12h", timeZone: 'UTC' }).format(d);
        const available = selectedCities.filter(c => getLocalHourAtUTC(bestHour, c.timezone, selectedDate) >= 9 && getLocalHourAtUTC(bestHour, c.timezone, selectedDate) < 17).length;
        setGoldenBadge(perfect ? `✓ Perfect overlap at ${ts} UTC — everyone available!` : `✓ Best window: ${ts} UTC (${available}/${selectedCities.length} available)`);
        showToast({ message: `Best time: ${ts} UTC`, type: "success" });
        if (perfect && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate([100, 50, 100, 50, 100]); } catch (e) {}
        }
        setTimeout(() => setGoldenBadge(null), 4000);
      }
    };
    requestAnimationFrame(animate);
  }, [selectedCities, selectedDate, now, meetingPercent, timeFormat, showToast]);

  const handleSaveTeam = useCallback(() => {
    if (!teamName.trim()) { setIsSavingTeam(false); return; }
    savePreset(teamName, selectedCities.map(c => c.id));
    setTeamName("");
    setIsSavingTeam(false);
    showToast({ message: `Team "${teamName}" saved`, type: "success" });
  }, [teamName, selectedCities, savePreset, showToast]);

  const handleRemoveCity = useCallback((id: string) => {
    const city = selectedCities.find(c => c.id === id);
    removeCity(id);
    if (city) showToast({ message: `${city.name} removed`, type: "info" });
  }, [selectedCities, removeCity, showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === "a") { e.preventDefault(); (document.querySelector('button[title="Add City"]') as HTMLButtonElement || document.querySelector('.CitySearch button'))?.click(); }
      else if (key === "s") { e.preventDefault(); handleShare(); }
      else if (key === "t") { e.preventDefault(); toggleTimeFormat(); }
      else if (key === "b") { e.preventDefault(); handleGoldenWindow(); }
      else if (key === "d") { e.preventDefault(); toggleTheme(); }
      else if (e.key === "?") { e.preventDefault(); setShowShortcuts(prev => !prev); }
      else if (e.key === "Escape") { setShowShortcuts(false); setShowDatePicker(false); setIsSavingTeam(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleShare, toggleTimeFormat, handleGoldenWindow, toggleTheme]);

  const isFuture = selectedDate.toDateString() !== new Date().toDateString();
  const nowPercent = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;

  // Single source of truth for overlap — used by both stats row and health badge
  const overlapHours = useMemo(
    () => getOverlapHours(selectedCities.map(c => c.timezone), selectedDate),
    [selectedCities, selectedDate]
  );
  const hasOverlap = overlapHours.length > 0;

  const headerStat = useMemo(() => {
    if (selectedCities.length === 0) return null;
    if (hasOverlap) {
      const win = getOverlapWindow(selectedCities.map(c => c.timezone), selectedDate);
      return { text: `Overlap: ${win}`, color: '#16a34a', bold: true };
    }
    return { text: 'No overlapping hours', color: 'var(--text-muted)', bold: false };
  }, [selectedCities, hasOverlap, selectedDate]);

  const atMax = selectedCities.length >= maxCities;
  const currentCitiesMatchPreset = presets.some(p => p.cityIds.join(',') === selectedCities.map(c => c.id).join(','));

  if (!isInitialized) return null;

  return (
    <>
      {!appReady && <SplashScreen />}

      <div
        className="min-h-screen"
        style={{ opacity: appReady ? 1 : 0, transition: "opacity 400ms ease", color: "var(--text-primary)", background: "transparent", position: "relative" }}
        onClick={() => { if (sharedTime) { setSharedTime(null); setMeetingPercent(null); } }}
      >
        <style>{`
          @keyframes slideUpFade   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes slideUpFade8  { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }
          @keyframes fadeIn        { from { opacity:0; } to { opacity:1; } }
          @keyframes expandLine    { from { width:0; } to { width:40px; } }
          @keyframes pulseSlow     { 0% { transform:scale(1); opacity:1; } 100% { transform:scale(2.5); opacity:0; } }
          @keyframes drift1        { from { transform:translate(0,0); } to { transform:translate(30px,30px); } }
          @keyframes drift2        { from { transform:translate(0,0); } to { transform:translate(-20px,-20px); } }
          @keyframes noteBannerIn  { from { transform:translateY(-100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
          [data-theme="dark"] .ambient-orbs { display:none !important; }
          .page-ambient-gradient {
            position:fixed; inset:0; z-index:0; pointer-events:none;
            background: radial-gradient(ellipse 800px 600px at var(--mx,50%) var(--my,30%), rgba(94,106,210,0.05) 0%, transparent 70%);
          }
          [data-theme="dark"] .page-ambient-gradient {
            background: radial-gradient(ellipse 800px 600px at var(--mx,50%) var(--my,30%), rgba(94,106,210,0.1) 0%, transparent 70%);
          }
          .solar-system-wrapper {
             position:fixed; inset:0; z-index:0; pointer-events:none;
             display: flex; align-items: center; justify-content: center;
             transition: all 500ms ease;
          }
          @media (max-width: 768px) {
            .solar-system-wrapper { transform: scale(0.6); opacity: 0.5; }
          }
        `}</style>

        <div className="page-ambient-gradient" aria-hidden="true" />

        <Navbar 
          timeFormat={timeFormat} 
          toggleTimeFormat={toggleTimeFormat} 
          onShare={handleShare} 
          isShareAnimating={shareAnimating}
          onShowShortcuts={() => setShowShortcuts(true)}
        />

        {isFuture && (
          <div className="relative z-10 w-full flex items-center justify-between border-b border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)] px-6 py-2" style={{ animation: 'noteBannerIn 300ms ease forwards' }}>
            <span className="text-[11px] font-sans text-[#d97706] font-semibold">Viewing: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} — DST may differ</span>
            <button className="text-[#d97706] hover:opacity-70 text-lg" onClick={() => setSelectedDate(new Date())}>×</button>
          </div>
        )}

        {sharedTime && (
          <div className="relative z-10 w-full bg-[var(--bg-elevated)] border-b border-[var(--border-default)] px-[24px] py-[8px] flex items-center justify-center">
            <span className="text-[12px] font-sans text-[var(--text-secondary)]">Viewing shared time: {sharedTime} UTC</span>
            <button className="absolute right-[24px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={(e) => { e.stopPropagation(); setSharedTime(null); setMeetingPercent(null); }}>×</button>
          </div>
        )}

        <main className="relative z-10 w-full max-w-[1100px] mx-auto px-[24px] pt-[40px] pb-[80px]">
          <section className="flex flex-col" style={{ position: "relative", zIndex: 100, isolation: "isolate" }}>
            <h1 className="text-[32px] md:text-[48px] font-display font-semibold leading-[1.1] tracking-[-0.5px] hero-heading">
              {["Plan", "Across\n", "Time", "Zones."].map((word, i) => {
                const label = word.replace("\n", "");
                return (
                  <span key={i}>
                    <span className="inline-block opacity-0" style={{
                      backgroundImage: `linear-gradient(90deg, ${theme === "dark" ? "#f0f0f0" : "#242424"} 0%, ${theme === "dark" ? "#f0f0f0" : "#242424"} 40%, #5e6ad2 50%, ${theme === "dark" ? "#f0f0f0" : "#242424"} 60%, ${theme === "dark" ? "#f0f0f0" : "#242424"} 100%)`,
                      backgroundSize: "300% 100%", backgroundRepeat: "no-repeat", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                      animation: appReady ? `slideUpFade 600ms cubic-bezier(0.16,1,0.3,1) ${200 + i * 100}ms forwards, headingShimmer 4s ease infinite ${2 + i * 0.2}s` : "none",
                    } as React.CSSProperties}>{label}</span>
                    {word.includes("\n") ? <br /> : <>&nbsp;</>}
                  </span>
                );
              })}
            </h1>

            <p className="mt-[12px] text-[16px] font-sans text-[var(--text-secondary)] max-w-[480px] min-h-[24px] hero-subtext" style={{ opacity: appReady ? 1 : 0, transition: "opacity 200ms ease 580ms" }}>
              {subtitle}{!subtitleDone && appReady && <span className="cursor-blink">|</span>}
            </p>

            <div className="mt-[20px] flex flex-col md:flex-row items-stretch md:items-center gap-[12px] opacity-0 hero-buttons" style={{ animation: appReady ? "slideUpFade8 350ms ease 800ms forwards" : "none", position: "relative", zIndex: 1000, isolation: "isolate" }}>
              <CitySearch onAddCity={addCity} selectedCities={selectedCities} maxCities={maxCities} now={now} timeFormat={timeFormat} />
              
              <div className="relative group/best-wrapper">
                <button 
                  onClick={() => { setBestAnimating(true); setTimeout(() => setBestAnimating(false), 800); handleGoldenWindow(); }}
                  style={{ transform: bestAnimating ? 'scale(1.05)' : 'scale(1)', transition: 'transform 300ms ease' }}
                  className="w-full flex items-center justify-center gap-[6px] bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[8px] px-[16px] py-[10px] text-[14px] font-sans font-semibold hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                >
                  <span className="text-[var(--text-primary)] flex items-center justify-center"><OrbitIcon size={14} speed={bestAnimating ? 1 : 3} /></span> Best Time
                </button>
                {goldenBadge && (
                  <div 
                    className="absolute top-[calc(100%+8px)] left-0 whitespace-nowrap text-[12px] font-sans font-medium text-[#16a34a] bg-[rgba(22,163,74,0.1)] px-[12px] py-[6px] rounded-[8px] z-50 shadow-sm border border-[rgba(22,163,74,0.2)]" 
                    style={{ animation: 'popInLeft 200ms ease' }}
                  >
                    {goldenBadge}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-[16px] flex items-center flex-wrap gap-[8px] text-[11px] md:text-[12px] font-sans opacity-0 group" style={{ animation: appReady ? "fadeIn 300ms ease 1000ms forwards" : "none", color: "var(--text-secondary)" }}>
              <span><span style={{ color: atMax ? "#dc2626" : "var(--text-primary)", fontWeight: 600 }}>{selectedCities.length}</span><span style={{ color: "var(--text-secondary)" }}>/6 cities</span></span>
              {headerStat && <><span>·</span><span key={headerStat.text} style={{ color: headerStat.color, fontWeight: headerStat.bold ? 600 : 400, transition: 'color 300ms ease', animation: 'fadeIn 300ms ease' }}>{headerStat.text}</span></>}
              <span>·</span><div className="flex items-center gap-[6px]"><div className="relative w-[6px] h-[6px] rounded-full bg-[var(--success)]">{!isFuture && <div className="absolute inset-0 rounded-full bg-[var(--success)] opacity-0" style={{ animation: "pulseSlow 2s infinite" }} />}</div>{isFuture ? "Static view" : "Updated live"}</div>
              {selectedCities.length > 0 && !currentCitiesMatchPreset && <><span className="mx-1 opacity-0 group-hover:opacity-100 transition-opacity">·</span><button onClick={() => setIsSavingTeam(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-2">Save as team preset</button></>}
            </div>

            {(presets.length > 0 || isSavingTeam) && (
              <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar opacity-0" style={{ animation: "fadeIn 300ms ease 1100ms forwards" }}>
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setIsPresetLoading(true);
                      setCitiesByIds(preset.cityIds);
                      setTimeout(() => setIsPresetLoading(false), 300);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 min-h-[32px] rounded-full border text-[11px] font-sans font-semibold transition-all cursor-pointer whitespace-nowrap group/pill ${preset.cityIds.join(',') === selectedCities.map(c => c.id).join(',') ? 'border-[var(--border-strong)] bg-[var(--bg-surface)]' : 'border-[var(--border-default)] bg-transparent hover:bg-[var(--bg-surface)]'}`}
                    style={{ transition: 'opacity 300ms ease' }}
                  >
                    <span>{preset.name}</span><button onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }} className="opacity-0 group-hover/pill:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[#dc2626]">×</button>
                  </div>
                ))}
                {isSavingTeam ? <div className="flex items-center gap-2"><input autoFocus type="text" maxLength={20} value={teamName} onChange={(e) => setTeamName(e.target.value)} onBlur={handleSaveTeam} onKeyDown={(e) => e.key === 'Enter' && handleSaveTeam()} placeholder="Team name..." className="px-3 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[11px] font-sans outline-none w-[120px]" /></div> : presets.length < 5 && <button onClick={() => setIsSavingTeam(true)} className="px-3 py-1.5 rounded-full border border-dashed border-[var(--border-default)] text-[11px] font-sans text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-all whitespace-nowrap">+ Save as preset</button>}
              </div>
            )}
            <div className="opacity-0" style={{ animation: appReady ? "fadeIn 300ms ease 1100ms forwards" : "none" }}><OrbitNote value={noteText} onChange={updateNote} /></div>
          </section>

          {selectedCities.length > 0 ? (
            <section className="mt-[40px] flex flex-col">
              <div className="flex items-end justify-between border-b border-[var(--border-default)] pb-[12px] opacity-0 relative" style={{ animation: appReady ? "fadeIn 300ms ease 1100ms forwards" : "none" }}>
                <h2 className="text-[14px] font-display font-semibold relative inline-block">Your Timeline<div className="absolute -bottom-[13px] left-0 h-[1px] bg-[var(--border-strong)]" style={{ animation: appReady ? "expandLine 400ms ease 1400ms forwards" : "none", width: 0 }} /></h2>
                <div className="flex items-center gap-4">
                   <div className="relative">
                      {!showDatePicker
                        ? <button onClick={() => setShowDatePicker(true)} className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[6px] shadow-sm text-[11px] font-sans font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">📅 {isFuture ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Today"}</button>
                        : <input
                            type="date"
                            autoFocus
                            value={selectedDate.toISOString().split('T')[0]}
                            onChange={(e) => {
                              if (e.target.value) {
                                const [year, month, day] = e.target.value.split('-').map(Number);
                                const d = new Date(year, month - 1, day);
                                if (!isNaN(d.getTime())) setSelectedDate(d);
                              } else {
                                // Fallback to today if cleared to prevent crash
                                setSelectedDate(new Date());
                              }
                            }}
                            onBlur={() => setShowDatePicker(false)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setShowDatePicker(false); }}
                            className="px-2.5 py-1.5 bg-[var(--bg-page)] border border-[var(--border-strong)] rounded-[6px] shadow-sm text-[11px] font-sans font-semibold outline-none min-w-[140px]"
                          />
                      }
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div className="text-[12px] font-sans text-[var(--text-secondary)] time-display">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }).format(selectedDate)} · {formatTime(isFuture ? new Date(selectedDate.setHours(12,0,0,0)) : now, "UTC", timeFormat)} UTC</div>
                    {meetingPercent !== null && <button onClick={() => setMeetingPercent(null)} style={{ fontSize: 11, color: '#898989', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 150ms ease' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')} onMouseLeave={e => (e.currentTarget.style.color = '#898989')}>↺ Now</button>}
                  </div>
                </div>
              </div>
              <div className="mt-[16px]"><Timeline cities={selectedCities} now={now} selectedDate={selectedDate} timeFormat={timeFormat} onRemoveCity={handleRemoveCity} onReorderCities={reorderCities} meetingPercent={meetingPercent} setMeetingPercent={setMeetingPercent} isPresetLoading={isPresetLoading} /></div>
              <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
                {[{ color: "var(--timeline-night)", label: "Deep night" }, { color: "var(--timeline-shoulder)", label: "Morning / Evening" }, { color: "var(--timeline-working)", label: "Working hours", border: true }, { color: "var(--timeline-overlap)", label: "Best overlap" }].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: item.border ? "1px solid var(--border-strong)" : "1px solid var(--border-default)", flexShrink: 0 }} /><span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>{item.label}</span></div>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-[80px] flex flex-col items-center justify-center text-center">
              <div className="text-[48px] mb-[16px]">🌍</div><h3 className="text-[20px] font-display font-semibold">Add your first city</h3><p className="mt-[8px] text-[14px] font-sans text-[var(--text-secondary)]">Track time zones across the globe</p>
              <div className="mt-[20px]" style={{ position: "relative", zIndex: 9999, isolation: "isolate" }}><CitySearch onAddCity={addCity} selectedCities={selectedCities} maxCities={maxCities} now={now} timeFormat={timeFormat} /></div>
            </section>
          )}
        </main>

        <footer style={{ marginTop: 60, paddingTop: 24, paddingBottom: 40, borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, maxWidth: 1100, margin: '60px auto 0', padding: '24px 24px 40px' }}>
          <div><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><OrbitIcon size={14} speed={4} /><span style={{ fontSize: 13, fontFamily: 'var(--font-display, Cal Sans, sans-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>Orbit</span></div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>Every timezone. One orbit.</div></div>
          <div className="hidden md:block" style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>Made for remote teams everywhere 🌍</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}><span>Built with Next.js</span><span>·</span><a href="https://github.com/rauf17/orbit" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 150ms ease' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Open source ↗</a></div>
        </footer>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          <div className="relative w-full max-w-[360px] bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[12px] shadow-xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-display font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">×</button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { key: "A", desc: "Open Add City search" },
                { key: "S", desc: "Copy share link" },
                { key: "T", desc: "Toggle 12h/24h" },
                { key: "B", desc: "Find best time" },
                { key: "D", desc: "Toggle dark/light mode" },
                { key: "?", desc: "Show/hide this modal" },
                { key: "Esc", desc: "Close any open panel" }
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-[13px] font-sans text-[var(--text-secondary)]">{s.desc}</span>
                  <kbd style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'ui-monospace, monospace',
                    minWidth: 24,
                    textAlign: 'center',
                    display: 'inline-block',
                  }}>{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
