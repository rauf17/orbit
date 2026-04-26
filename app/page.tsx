"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import SplashScreen from "../components/SplashScreen";
import Navbar from "../components/Navbar";
import CitySearch from "../components/CitySearch";
import OrbitNote from "../components/OrbitNote";
import Toast from "../components/Toast";
import useClock from "../hooks/useClock";
import useTimezones from "../hooks/useTimezones";
import { getOverlapHours, formatTime } from "../lib/timeUtils";
import { cities as allCities } from "../lib/cities";
import { OrbitIcon } from "../components/OrbitIcon";

const Timeline = dynamic(() => import("../components/Timeline"), { ssr: false });

// ── Subtitle typewriter ───────────────────────────────────────────────────────
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

export default function Home() {
  const [appReady, setAppReady]           = useState(false);
  const [toastOpen, setToastOpen]         = useState(false);
  const [meetingPercent, setMeetingPercent] = useState<number | null>(null);
  const [sharedTime, setSharedTime]       = useState<string | null>(null);
  const [sharedNote, setSharedNote]       = useState<string | null>(null);
  const [showNoteBanner, setShowNoteBanner] = useState(true);
  const [goldenBadge, setGoldenBadge]     = useState<string | null>(null);
  const [theme, setTheme]                 = useState<"light" | "dark">("light");

  // Mouse-tracking gradient CSS vars
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
      document.documentElement.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Track theme for heading gradient
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

  const { now } = useClock();
  const {
    selectedCities, addCity, removeCity, reorderCities,
    timeFormat, toggleTimeFormat, maxCities, isInitialized,
    noteText, updateNote,
  } = useTimezones();

  const { displayed: subtitle, done: subtitleDone } = useTypewriter(appReady);

  // Read shared time + note from URL on mount
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
    const params = new URLSearchParams();
    params.set("cities", selectedCities.map((c) => c.id).join(","));
    if (meetingPercent !== null) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      d.setTime(d.getTime() + Math.round((meetingPercent / 100) * 24 * 60) * 60 * 1000);
      params.set("time", `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`);
    }
    if (noteText.trim()) params.set("note", encodeURIComponent(noteText));
    navigator.clipboard.writeText(`${window.location.origin}?${params.toString()}`).then(() => setToastOpen(true));
  }, [selectedCities, meetingPercent, now, noteText]);

  const handleGoldenWindow = () => {
    if (selectedCities.length === 0) return;
    let bestHour = 0, maxAwake = -1, perfect = false;
    for (let i = 0; i < 24; i++) {
      const testDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 0, 0, 0);
      let awakeCount = 0;
      for (const city of selectedCities) {
        const parts = new Intl.DateTimeFormat("en-US", { timeZone: city.timezone, hour: "numeric", hourCycle: "h23" }).formatToParts(testDate);
        const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
        if (h >= 9 && h < 17) awakeCount++;
      }
      if (awakeCount > maxAwake) { maxAwake = awakeCount; bestHour = i; if (awakeCount === selectedCities.length) perfect = true; }
    }
    const targetPercent = (bestHour / 24) * 100;
    const startPercent = meetingPercent !== null ? meetingPercent : ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
    const startTime = performance.now();
    const animate = (t: number) => {
      const progress = Math.min((t - startTime) / 600, 1);
      const ease = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setMeetingPercent(startPercent + (targetPercent - startPercent) * ease);
      if (progress < 1) { requestAnimationFrame(animate); } else {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), bestHour, 0, 0, 0);
        const ts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: timeFormat === "12h" }).format(d);
        setGoldenBadge(perfect ? `✓ Perfect overlap at ${ts} — all cities available` : `✓ ${maxAwake}/${selectedCities.length} cities available at ${ts}`);
        setTimeout(() => setGoldenBadge(null), 4000);
      }
    };
    requestAnimationFrame(animate);
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
    const overlaps = getOverlapHours(selectedCities.map((c) => c.timezone));
    if (overlaps.length === 0) return null;
    const d = new Date();
    const baseShift = (new Date(d.toLocaleString("en-US", { timeZone: selectedCities[0].timezone })).getTime() - new Date(d.toLocaleString("en-US")).getTime()) / 3600000;
    const localOverlaps = overlaps.map((h) => { let lh = h - baseShift; if (lh < 0) lh += 24; if (lh >= 24) lh -= 24; return lh; }).sort((a, b) => a - b);
    const curH = now.getHours() + now.getMinutes() / 60;
    const targetH = localOverlaps.find((h) => h >= curH) ?? localOverlaps[0];
    const td = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    td.setTime(td.getTime() + Math.round(targetH * 3600000));
    if (targetH < curH) td.setDate(td.getDate() + 1);
    return formatTime(td, Intl.DateTimeFormat().resolvedOptions().timeZone, timeFormat);
  }, [selectedCities, now, timeFormat]);

  const atMax = selectedCities.length >= maxCities;
  if (!isInitialized) return null;

  // Heading gradient (use backgroundImage, not background shorthand)
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

        {/* Ambient bg layers */}
        <div className="page-ambient-gradient" aria-hidden="true" />
        <div className="ambient-orbs fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{ width:400, height:400, backgroundImage:"radial-gradient(circle, rgba(94,106,210,0.04), transparent)", filter:"blur(60px)", top:"10%", left:"10%", animation:"drift1 20s infinite alternate linear" }} />
          <div className="absolute rounded-full" style={{ width:300, height:300, backgroundImage:"radial-gradient(circle, rgba(34,211,238,0.03), transparent)", filter:"blur(60px)", bottom:"10%", right:"10%", animation:"drift2 25s infinite alternate linear" }} />
        </div>

        <Navbar timeFormat={timeFormat} toggleTimeFormat={toggleTimeFormat} onShare={handleShare} />

        {/* Shared-time banner */}
        {sharedTime && (
          <div className="relative z-10 w-full bg-[var(--bg-elevated)] border-b border-[var(--border-default)] px-[24px] py-[8px] flex items-center justify-center">
            <span className="text-[12px] font-sans text-[var(--text-secondary)]">Viewing shared time: {sharedTime} UTC</span>
            <button className="absolute right-[24px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={(e) => { e.stopPropagation(); setSharedTime(null); setMeetingPercent(null); }}>×</button>
          </div>
        )}

        {/* Shared-note banner */}
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

          {/* ── Hero ──────────────────────────────────────────────────────────── */}
          <section className="flex flex-col" style={{ position: "relative", zIndex: 100, isolation: "isolate" }}>

            {/* Heading with per-word shimmer (uses backgroundImage, NOT background) */}
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

            {/* Typewriter subtitle */}
            <p
              className="mt-[12px] text-[16px] font-sans text-[var(--text-secondary)] max-w-[480px] min-h-[24px]"
              style={{ opacity: appReady ? 1 : 0, transition: "opacity 200ms ease 580ms" }}
            >
              {subtitle}
              {!subtitleDone && appReady && <span className="cursor-blink">|</span>}
            </p>

            {/* Buttons row */}
            <div
              className="mt-[20px] flex items-center flex-wrap gap-[12px] opacity-0"
              style={{ animation: appReady ? "slideUpFade8 350ms ease 800ms forwards" : "none", position: "relative", zIndex: 9999, isolation: "isolate" }}
            >
              <CitySearch onAddCity={addCity} selectedCities={selectedCities} maxCities={maxCities} now={now} timeFormat={timeFormat} />

              <div className="relative">
                <button
                  onClick={handleGoldenWindow}
                  className="flex items-center gap-[6px] bg-[var(--bg-page)] shadow-sm border border-[var(--border-default)] rounded-[8px] px-[16px] py-[10px] text-[14px] font-sans font-semibold hover:shadow-md hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.98] transition-all duration-150"
                >
                  <span className="text-[var(--text-primary)] flex items-center justify-center"><OrbitIcon size={14} speed={2} /></span> Best Time
                </button>
                {goldenBadge && (
                  <div className="absolute top-full left-0 mt-[8px] whitespace-nowrap text-[12px] font-sans text-[#16a34a] bg-[rgba(22,163,74,0.1)] px-[10px] py-[4px] rounded-[6px]">
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

            {/* Stats row */}
            <div
              className="mt-[16px] flex items-center flex-wrap gap-[8px] text-[12px] font-sans opacity-0"
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
                  <div className="absolute inset-0 rounded-full bg-[var(--success)] opacity-0" style={{ animation: "pulseSlow 2s infinite" }} />
                </div>
                Updated live
              </div>
            </div>

            {/* Glassmorphism note */}
            <div className="opacity-0" style={{ animation: appReady ? "fadeIn 300ms ease 1100ms forwards" : "none" }}>
              <OrbitNote value={noteText} onChange={updateNote} />
            </div>
          </section>

          {/* ── Timeline ──────────────────────────────────────────────────────── */}
          {selectedCities.length > 0 ? (
            <section className="mt-[40px] flex flex-col">
              <div
                className="flex items-end justify-between border-b border-[var(--border-default)] pb-[12px] opacity-0 relative"
                style={{ animation: appReady ? "fadeIn 300ms ease 1100ms forwards" : "none" }}
              >
                <h2 className="text-[14px] font-display font-semibold relative inline-block">
                  Your Timeline
                  <div className="absolute -bottom-[13px] left-0 h-[2px] bg-[var(--text-primary)]"
                    style={{ animation: appReady ? "expandLine 400ms ease 1400ms forwards" : "none", width: 0 }} />
                </h2>
                <div className="text-[12px] font-sans text-[var(--text-secondary)]">
                  {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }).format(now)}{" "}
                  · {formatTime(now, "UTC", timeFormat)} UTC
                </div>
              </div>

              <div className="mt-[16px]">
                <Timeline
                  cities={selectedCities} now={now} timeFormat={timeFormat}
                  onRemoveCity={removeCity} onReorderCities={reorderCities}
                  meetingPercent={meetingPercent} setMeetingPercent={setMeetingPercent}
                />
              </div>

              {/* Legend */}
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
      </div>

      {toastOpen && <Toast message="Link copied!" submessage="Share with your team" onClose={() => setToastOpen(false)} />}
    </>
  );
}
