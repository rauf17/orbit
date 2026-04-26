"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import SplashScreen from "../components/SplashScreen";
import Navbar from "../components/Navbar";
import CitySearch from "../components/CitySearch";
import OrbitNote from "../components/OrbitNote";
import Toast from "../components/Toast";
import useClock from "../hooks/useClock";
import useTimezones from "../hooks/useTimezones";
import { useTeamPresets } from "../hooks/useTeamPresets";
import { getOverlapHours, formatTime } from "../lib/timeUtils";
import { cities as allCities } from "../lib/cities";
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

// --- Task 5: Enhanced Best Time Algorithm Helpers ---
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

function findBestTime(cities: any[], date: Date): { percent: number; maxScore: number; bestHour: number; perfect: boolean } {
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
  
  // Check if it's "perfect" (everyone in 9-17)
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
  const [toastOpen, setToastOpen]           = useState(false);
  const [meetingPercent, setMeetingPercent] = useState<number | null>(null);
  const [sharedTime, setSharedTime]         = useState<string | null>(null);
  const [sharedNote, setSharedNote]         = useState<string | null>(null);
  const [showNoteBanner, setShowNoteBanner] = useState(true);
  const [goldenBadge, setGoldenBadge]       = useState<string | null>(null);
  const [theme, setTheme]                   = useState<"light" | "dark">("light");
  const [shareAnimating, setShareAnimating] = useState(false);
  const [bestAnimating, setBestAnimating]   = useState(false);
  const [selectedDate, setSelectedDate]     = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSavingTeam, setIsSavingTeam]     = useState(false);
  const [teamName, setTeamName]             = useState("");
  
  const { now } = useClock();
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
    const check = () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
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

  const handleQuickAdd = (id: string) => {
    const city = allCities.find((c) => c.id === id);
    if (city && !selectedCities.some((c) => c.id === id) && selectedCities.length < maxCities) addCity(city);
  };

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
    navigator.clipboard.writeText(`${window.location.origin}?${params.toString()}`).then(() => setToastOpen(true));
  }, [selectedCities, meetingPercent, selectedDate, noteText]);

  const handleGoldenWindow = () => {
    if (selectedCities.length === 0) return;
    
    const { percent: targetPercent, bestHour, perfect } = findBestTime(selectedCities, selectedDate);
    
    const nowPercent = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
    const start = meetingPercent ?? nowPercent;
    const duration = 800; // Task 5: 800ms
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
        
        // Count available
        const available = selectedCities.filter(c => {
          const h = getLocalHourAtUTC(bestHour, c.timezone, selectedDate);
          return h >= 9 && h < 17;
        }).length;

        setGoldenBadge(perfect 
          ? `✓ Perfect overlap at ${ts} UTC — everyone available!` 
          : `✓ Best window: ${ts} UTC (${available}/${selectedCities.length} available)`);
        
        setTimeout(() => setGoldenBadge(null), 4000);
      }
    };
    requestAnimationFrame(animate);
  };

  const handleSaveTeam = () => {
    if (!teamName.trim()) {
      setIsSavingTeam(false);
      return;
    }
    savePreset(teamName, selectedCities.map(c => c.id));
    setTeamName("");
    setIsSavingTeam(false);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "a") { e.preventDefault(); (Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("Add City")) as HTMLButtonElement)?.click(); }
      if (e.key.toLowerCase() === "s") { e.preventDefault(); handleShare(); }
      if (e.key.toLowerCase() === "t") { e.preventDefault(); toggleTimeFormat(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleShare, toggleTimeFormat]);

  const nextOverlap = useMemo(() => {
    if (selectedCities.length === 0) return null;
    const overlaps = getOverlapHours(selectedCities.map((c) => c.timezone), selectedDate);
    if (overlaps.length === 0) return null;
    const d = new Date(selectedDate);
    const baseShift = (new Date(d.toLocaleString("en-US", { timeZone: selectedCities[0].timezone })).getTime() - new Date(d.toLocaleString("en-US")).getTime()) / 3600000;
    const localOverlaps = overlaps.map((h) => { let lh = h - baseShift; if (lh < 0) lh += 24; if (lh >= 24) lh -= 24; return lh; }).sort((a, b) => a - b);
    const curH = (selectedDate.toDateString() === new Date().toDateString()) ? now.getHours() + now.getMinutes() / 60 : 12;
    const targetH = localOverlaps.find((h) => h >= curH) ?? localOverlaps[0];
    const td = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
    td.setTime(td.getTime() + Math.round(targetH * 3600000));
    if (targetH < curH && selectedDate.toDateString() === new Date().toDateString()) td.setDate(td.getDate() + 1);
    return formatTime(td, Intl.DateTimeFormat().resolvedOptions().timeZone, timeFormat);
  }, [selectedCities, now, timeFormat, selectedDate]);

  const atMax = selectedCities.length >= maxCities;
  const isFuture = selectedDate.toDateString() !== new Date().toDateString();
  const currentCitiesMatchPreset = presets.some(p => p.cityIds.join(',') === selectedCities.map(c => c.id).join(','));

  if (!isInitialized) return null;

  const c1 = theme === "dark" ? "#f0f0f0" : "#242424";
  const headingGradientImage = `linear-gradient(90deg, ${c1} 0%, ${c1} 40%, #5e6ad2 50%, ${c1} 60%, ${c1} 100%)`;

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
        `}</style>

        <div className="page-ambient-gradient" aria-hidden="true" />
        <div className="ambient-orbs fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{ width:400, height:400, backgroundImage:"radial-gradient(circle, rgba(94,106,210,0.04), transparent)", filter:"blur(60px)", top:"10%", left:"10%", animation:"drift1 20s infinite alternate linear" }} />
          <div className="absolute rounded-full" style={{ width:300, height:300, backgroundImage:"radial-gradient(circle, rgba(34,211,238,0.03), transparent)", filter:"blur(60px)", bottom:"10%", right:"10%", animation:"drift2 25s infinite alternate linear" }} />
        </div>

        <Navbar 
          timeFormat={timeFormat} 
          toggleTimeFormat={toggleTimeFormat} 
          onShare={handleShare} 
          isShareAnimating={shareAnimating}
        />

        {/* Task 6: Future mode banner */}
        {isFuture && (
          <div 
            className="relative z-10 w-full flex items-center justify-between border-b border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)] px-6 py-2"
            style={{ animation: 'noteBannerIn 300ms ease forwards' }}
          >
            <span className="text-[11px] font-sans text-[#d97706] font-semibold">
              Viewing: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} — DST may differ
            </span>
            <button className="text-[#d97706] hover:opacity-70 text-lg" onClick={() => setSelectedDate(new Date())}>×</button>
          </div>
        )}

        {sharedTime && (
          <div className="relative z-10 w-full bg-[var(--bg-elevated)] border-b border-[var(--border-default)] px-[24px] py-[8px] flex items-center justify-center">
            <span className="text-[12px] font-sans text-[var(--text-secondary)]">Viewing shared time: {sharedTime} UTC</span>
            <button className="absolute right-[24px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={(e) => { e.stopPropagation(); setSharedTime(null); setMeetingPercent(null); }}>×</button>
          </div>
        )}

        {sharedNote && showNoteBanner && (
          <div
            className="relative z-10 w-full border-b border-[var(--border-default)] flex items-center justify-between"
            style={{ background: "var(--bg-surface)", padding: "10px 24px", animation: "noteBannerIn 300ms cubic-bezier(0.16,1,0.3,1) forwards" }}
          >
            <span style={{ fontSize: 13, fontFamily: "Inter, sans-serif", color: "var(--text-primary)" }}>✏️ {sharedNote}</span>
            <button style={{ marginLeft: 16, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }} onClick={() => setShowNoteBanner(false)}>×</button>
          </div>
        )}

        <main className="relative z-10 w-full max-w-[1100px] mx-auto px-[24px] pt-[40px] pb-[80px]">

          <section className="flex flex-col" style={{ position: "relative", zIndex: 100, isolation: "isolate" }}>
            <h1 className="text-[32px] md:text-[48px] font-display font-semibold leading-[1.1] tracking-[-0.5px]">
              {["Plan", "Across\n", "Time", "Zones."].map((word, i) => {
                const isBreak = word.includes("\n");
                const label = word.replace("\n", "");
                return (
                  <span key={i}>
                    <span
                      className="inline-block opacity-0"
                      style={{
                        backgroundImage: headingGradientImage,
                        backgroundSize: "300% 100%",
                        backgroundRepeat: "no-repeat",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        animation: appReady
                          ? `slideUpFade 600ms cubic-bezier(0.16,1,0.3,1) ${200 + i * 100}ms forwards, headingShimmer 4s ease infinite ${2 + i * 0.2}s`
                          : "none",
                      } as React.CSSProperties}
                    >
                      {label}
                    </span>
                    {isBreak ? <br /> : <>&nbsp;</>}
                  </span>
                );
              })}
            </h1>

            <p
              className="mt-[12px] text-[16px] font-sans text-[var(--text-secondary)] max-w-[480px] min-h-[24px]"
              style={{ opacity: appReady ? 1 : 0, transition: "opacity 200ms ease 580ms" }}
            >
              {subtitle}
              {!subtitleDone && appReady && <span className="cursor-blink">|</span>}
            </p>

            <div
              className="mt-[20px] flex items-center flex-wrap gap-[12px] opacity-0"
              style={{ animation: appReady ? "slideUpFade8 350ms ease 800ms forwards" : "none", position: "relative", zIndex: 9999, isolation: "isolate" }}
            >
              <CitySearch onAddCity={addCity} selectedCities={selectedCities} maxCities={maxCities} now={now} timeFormat={timeFormat} />

              <div className="relative">
                <button
                  onClick={() => {
                    setBestAnimating(true);
                    setTimeout(() => setBestAnimating(false), 800);
                    handleGoldenWindow();
                  }}
                  style={{ transform: bestAnimating ? 'scale(1.05)' : 'scale(1)', transition: 'transform 300ms ease' }}
                  className="flex items-center gap-[6px] bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[8px] px-[16px] py-[10px] text-[14px] font-sans font-semibold hover:shadow-md hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.98] transition-all duration-150"
                >
                  <span className="text-[var(--text-primary)] flex items-center justify-center"><OrbitIcon size={14} speed={bestAnimating ? 1 : 3} /></span> Best Time
                </button>
                {goldenBadge && (
                  <div className="absolute top-full left-0 mt-[8px] whitespace-nowrap text-[12px] font-sans text-[#16a34a] bg-[rgba(22,163,74,0.1)] px-[10px] py-[4px] rounded-[6px]" style={{ animation: 'popInLeft 200ms ease' }}>
                    {goldenBadge}
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center gap-[8px]">
                <span className="text-[14px] font-sans text-[var(--text-secondary)] ml-[4px]">or try:</span>
                {["tokyo", "new-york", "london"].map((id) => {
                  const city = allCities.find((c) => c.id === id);
                  if (!city || selectedCities.some((c) => c.id === id)) return null;
                  return (
                    <button key={id} onClick={() => handleQuickAdd(id)}
                      className="px-[12px] py-[6px] rounded-[6px] bg-[var(--bg-page)] border border-[var(--border-default)] shadow-sm text-[11px] font-sans hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] transition-all duration-150">
                      {city.emoji} {city.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="mt-[16px] flex items-center flex-wrap gap-[8px] text-[12px] font-sans opacity-0 group"
              style={{ animation: appReady ? "fadeIn 300ms ease 1000ms forwards" : "none", color: "var(--text-secondary)" }}
            >
              <span>
                <span style={{ color: atMax ? "#dc2626" : "var(--text-primary)", fontWeight: 600 }}>{selectedCities.length}</span>
                <span style={{ color: "var(--text-secondary)" }}>/6 cities</span>
                {atMax && <span style={{ color: "#dc2626", marginLeft: 4 }}>(max)</span>}
              </span>
              <span>·</span>
              <span>{nextOverlap ? `Next overlap: ${nextOverlap}` : "No overlapping hours"}</span>
              <span>·</span>
              <div className="flex items-center gap-[6px]">
                <div className="relative w-[6px] h-[6px] rounded-full bg-[var(--success)]">
                  {!isFuture && <div className="absolute inset-0 rounded-full bg-[var(--success)] opacity-0" style={{ animation: "pulseSlow 2s infinite" }} />}
                </div>
                {isFuture ? "Static view" : "Updated live"}
              </div>

              {/* Task 4: Save as Team preset Link */}
              {selectedCities.length > 0 && !currentCitiesMatchPreset && (
                <>
                  <span className="mx-1 opacity-0 group-hover:opacity-100 transition-opacity">·</span>
                  <button 
                    onClick={() => setIsSavingTeam(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-2"
                  >
                    Save as team preset
                  </button>
                </>
              )}
            </div>

            {/* Task 4: Teams Section */}
            {(presets.length > 0 || isSavingTeam) && (
              <div 
                className="mt-4 flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar opacity-0"
                style={{ animation: "fadeIn 300ms ease 1100ms forwards" }}
              >
                {presets.map(preset => (
                  <div 
                    key={preset.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-sans font-semibold transition-all cursor-pointer whitespace-nowrap group/pill
                      ${preset.cityIds.join(',') === selectedCities.map(c => c.id).join(',') 
                        ? 'border-[var(--border-strong)] bg-[var(--bg-surface)]' 
                        : 'border-[var(--border-default)] bg-transparent hover:bg-[var(--bg-surface)]'}`}
                    onClick={() => setCitiesByIds(preset.cityIds)}
                  >
                    <span>{preset.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                      className="opacity-0 group-hover/pill:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[#dc2626]"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {isSavingTeam ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      type="text"
                      maxLength={20}
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      onBlur={handleSaveTeam}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTeam()}
                      placeholder="Team name..."
                      className="px-3 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[11px] font-sans outline-none w-[120px]"
                    />
                  </div>
                ) : (
                  presets.length < 5 && (
                    <button 
                      onClick={() => setIsSavingTeam(true)}
                      className="px-3 py-1.5 rounded-full border border-dashed border-[var(--border-default)] text-[11px] font-sans text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-all whitespace-nowrap"
                    >
                      + Save as preset
                    </button>
                  )
                )}
                {presets.length >= 5 && !isSavingTeam && (
                   <span className="text-[10px] text-[var(--text-muted)] italic">Max presets (5)</span>
                )}
              </div>
            )}

            <div className="opacity-0" style={{ animation: appReady ? "fadeIn 300ms ease 1100ms forwards" : "none" }}>
              <OrbitNote value={noteText} onChange={updateNote} />
            </div>
          </section>

          {selectedCities.length > 0 ? (
            <section className="mt-[40px] flex flex-col">
              <div
                className="flex items-end justify-between border-b border-[var(--border-default)] pb-[12px] opacity-0 relative"
                style={{ animation: appReady ? "fadeIn 300ms ease 1100ms forwards" : "none" }}
              >
                <h2 className="text-[14px] font-display font-semibold relative inline-block">
                  Your Timeline
                  <div className="absolute -bottom-[13px] left-0 h-[1px] bg-[var(--border-strong)]"
                    style={{ animation: appReady ? "expandLine 400ms ease 1400ms forwards" : "none", width: 0 }} />
                </h2>
                
                <div className="flex items-center gap-4">
                   {/* Task 6: Date Picker */}
                   <div className="relative">
                      {!showDatePicker ? (
                        <button 
                          onClick={() => setShowDatePicker(true)}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-page)] border border-[var(--border-default)] rounded-[6px] shadow-sm text-[11px] font-sans font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                        >
                          📅 {isFuture ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Today"}
                        </button>
                      ) : (
                        <input 
                          type="date"
                          autoFocus
                          value={selectedDate.toISOString().split('T')[0]}
                          onChange={(e) => { setSelectedDate(new Date(e.target.value)); setShowDatePicker(false); }}
                          onBlur={() => setShowDatePicker(false)}
                          className="px-2.5 py-1.5 bg-[var(--bg-page)] border border-[var(--border-strong)] rounded-[6px] shadow-sm text-[11px] font-sans font-semibold outline-none min-w-[140px]"
                        />
                      )}
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div className="text-[12px] font-sans text-[var(--text-secondary)] time-display">
                      {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }).format(selectedDate)}{" "}
                      · {formatTime(isFuture ? new Date(selectedDate.setHours(12,0,0,0)) : now, "UTC", timeFormat)} UTC
                    </div>
                    {meetingPercent !== null && (
                      <button
                        onClick={() => setMeetingPercent(null)}
                        style={{ fontSize: 11, color: '#898989', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 150ms ease' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#898989')}
                      >
                        ↺ Now
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-[16px]">
                <Timeline
                  cities={selectedCities} now={now} selectedDate={selectedDate} timeFormat={timeFormat}
                  onRemoveCity={removeCity} onReorderCities={reorderCities}
                  meetingPercent={meetingPercent} setMeetingPercent={setMeetingPercent}
                />
              </div>

              <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
                {[
                  { color: "var(--timeline-night)", label: "Deep night" },
                  { color: "var(--timeline-shoulder)", label: "Morning / Evening" },
                  { color: "var(--timeline-working)", label: "Working hours", border: true },
                  { color: "var(--timeline-overlap)", label: "Best overlap" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: item.border ? "1px solid var(--border-strong)" : "1px solid var(--border-default)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-[80px] flex flex-col items-center justify-center text-center">
              <div className="text-[48px] mb-[16px]">🌍</div>
              <h3 className="text-[20px] font-display font-semibold">Add your first city</h3>
              <p className="mt-[8px] text-[14px] font-sans text-[var(--text-secondary)]">Track time zones across the globe</p>
              <div className="mt-[20px]" style={{ position: "relative", zIndex: 9999, isolation: "isolate" }}>
                <CitySearch onAddCity={addCity} selectedCities={selectedCities} maxCities={maxCities} now={now} timeFormat={timeFormat} />
              </div>
            </section>
          )}
        </main>

        <footer style={{
          marginTop: 60, paddingTop: 24, paddingBottom: 40,
          borderTop: '1px solid var(--border-default)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
          maxWidth: 1100, margin: '60px auto 0', padding: '24px 24px 40px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <OrbitIcon size={14} speed={4} />
              <span style={{ fontSize: 13, fontFamily: 'var(--font-display, Cal Sans, sans-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>Orbit</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>Every timezone. One orbit.</div>
          </div>
          <div className="hidden md:block" style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
            Made for remote teams everywhere 🌍
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
            <span>Built with Next.js</span>
            <span>·</span>
            <a
              href="https://github.com/rauf17/orbit"
              target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Open source ↗
            </a>
          </div>
        </footer>
      </div>

      {toastOpen && <Toast message="Link copied!" submessage="Share with your team" onClose={() => setToastOpen(false)} />}
    </>
  );
}
