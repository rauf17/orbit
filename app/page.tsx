"use client";

import { useState, useMemo } from "react";
import SplashScreen from "../components/SplashScreen";
import Navbar from "../components/Navbar";
import CitySearch from "../components/CitySearch";
import Timeline from "../components/Timeline";
import useClock from "../hooks/useClock";
import useTimezones from "../hooks/useTimezones";
import { getOverlapHours, formatTime } from "../lib/timeUtils";
import { cities as allCities } from "../lib/cities";

export default function Home() {
  const [appReady, setAppReady] = useState(false);
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

  const nextOverlap = useMemo(() => {
    if (selectedCities.length === 0) return null;
    const overlaps = getOverlapHours(selectedCities.map((c) => c.timezone));
    if (overlaps.length === 0) return null;

    // Calculate shift to local device time
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
      {!appReady && <SplashScreen onComplete={() => setAppReady(true)} />}

      <div
        className={`min-h-screen bg-[#ffffff] transition-opacity duration-400 ${
          appReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <Navbar timeFormat={timeFormat} toggleTimeFormat={toggleTimeFormat} />

        <main className="w-full max-w-[1100px] mx-auto px-[24px] pt-[40px] pb-[80px]">
          {/* Hero Section */}
          <section className="flex flex-col">
            <h1 className="text-[48px] font-display font-semibold text-[#242424] leading-[1.1] tracking-[-0.5px]">
              Plan Across<br />Time Zones.
            </h1>
            <p className="mt-[12px] text-[16px] font-sans text-[#898989] max-w-[480px]">
              Add your cities. Find the perfect overlap. Share with your team.
            </p>

            <div className="mt-[20px] flex items-center flex-wrap gap-[12px]">
              <CitySearch
                onAddCity={addCity}
                selectedCities={selectedCities}
                maxCities={maxCities}
                now={now}
                timeFormat={timeFormat}
              />
              <div className="flex items-center gap-[8px]">
                <span className="text-[14px] font-sans text-[#898989] ml-[4px]">
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
                      className="px-[12px] py-[6px] rounded-[6px] bg-white border border-[rgba(34,42,53,0.08)] shadow-sm text-[11px] font-sans text-[#242424] hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 active:translate-y-0 active:shadow-sm"
                    >
                      {city.emoji} {city.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-[16px] flex items-center gap-[8px] text-[12px] font-sans text-[#898989]">
              <span>{selectedCities.length} cities active</span>
              <span>·</span>
              <span>
                {nextOverlap ? `Next overlap: ${nextOverlap}` : "No overlapping hours"}
              </span>
              <span>·</span>
              <div className="flex items-center gap-[6px]">
                <style>{`
                  @keyframes pulseDot {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                  }
                `}</style>
                <div
                  className="w-[6px] h-[6px] rounded-full bg-[#16a34a]"
                  style={{ animation: "pulseDot 1.5s infinite" }}
                />
                Updated live
              </div>
            </div>
          </section>

          {/* Timeline Section */}
          {selectedCities.length > 0 ? (
            <section className="mt-[40px] flex flex-col">
              <div className="flex items-end justify-between border-b border-[rgba(34,42,53,0.05)] pb-[12px]">
                <h2 className="text-[14px] font-display font-semibold text-[#242424]">
                  Your Timeline
                </h2>
                <div className="text-[12px] font-sans text-[#898989]">
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
                />
              </div>

              {/* Legend Row */}
              <div className="mt-[16px] flex items-center gap-[24px]">
                <div className="flex items-center gap-[4px]">
                  <div className="w-[10px] h-[10px] bg-[#f0f0f0] border border-[rgba(34,42,53,0.08)] rounded-[2px]" />
                  <span className="text-[10px] font-sans text-[#898989]">
                    Deep night
                  </span>
                </div>
                <div className="flex items-center gap-[4px]">
                  <div className="w-[10px] h-[10px] bg-[#e8eeff] border border-[rgba(34,42,53,0.08)] rounded-[2px]" />
                  <span className="text-[10px] font-sans text-[#898989]">
                    Morning/Evening
                  </span>
                </div>
                <div className="flex items-center gap-[4px]">
                  <div className="w-[10px] h-[10px] bg-[#ffffff] border border-[rgba(34,42,53,0.08)] rounded-[2px]" />
                  <span className="text-[10px] font-sans text-[#898989]">
                    Working hours
                  </span>
                </div>
                <div className="flex items-center gap-[4px]">
                  <div className="w-[10px] h-[10px] bg-[rgba(22,163,74,0.12)] border border-[rgba(22,163,74,0.3)] rounded-[2px]" />
                  <span className="text-[10px] font-sans text-[#898989]">
                    Best overlap
                  </span>
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-[80px] flex flex-col items-center justify-center text-center">
              <div className="text-[48px] mb-[16px]">🌍</div>
              <h3 className="text-[20px] font-display font-semibold text-[#242424]">
                Add your first city
              </h3>
              <p className="mt-[8px] text-[14px] font-sans text-[#898989]">
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
    </>
  );
}
