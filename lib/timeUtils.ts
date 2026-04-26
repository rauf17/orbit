export function getCurrentTimeInZone(timezone: string, date: Date = new Date()): Date {
  const str = date.toLocaleString("en-US", { timeZone: timezone });
  return new Date(str);
}

export function formatTime(
  date: Date,
  timezone: string,
  format: "12h" | "24h"
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: format === "12h",
  }).format(date);
}

export function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getHourInZone(timezone: string, date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  
  const hourPart = parts.find((p) => p.type === "hour");
  return hourPart ? parseInt(hourPart.value, 10) : 0;
}

export function getOffsetString(timezone: string, date: Date = new Date()): string {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = date.toLocaleString("en-US", { timeZone: timezone });
  
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  
  const diffMs = tzDate.getTime() - utcDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours === 0) return "UTC";

  const sign = diffHours > 0 ? "+" : "-";
  const absHours = Math.abs(diffHours);
  const hours = Math.floor(absHours);
  const minutes = Math.round((absHours - hours) * 60);

  if (minutes === 0) return `UTC${sign}${hours}`;
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function getOffsetForDate(timezone: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZoneName: 'shortOffset',
      timeZone: timezone,
    }).formatToParts(date);
    return parts.find(p => p.type === 'timeZoneName')?.value ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isWorkingHour(hour: number): boolean {
  return hour >= 9 && hour < 17;
}

export function isDSTActive(timezone: string, date: Date = new Date()): boolean {
  const year = date.getFullYear();
  const jan = new Date(year, 0, 1);
  const jul = new Date(year, 6, 1);

  function getOffset(d: Date) {
    const utcDate = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(d.toLocaleString("en-US", { timeZone: timezone }));
    return tzDate.getTime() - utcDate.getTime();
  }

  const offsetNow = getOffset(date);
  const offsetJan = getOffset(jan);
  const offsetJul = getOffset(jul);

  if (offsetJan === offsetJul) return false;

  const standardOffset = Math.min(offsetJan, offsetJul);
  return offsetNow > standardOffset;
}

export function getOverlapHours(timezones: string[], date: Date = new Date()): number[] {
  if (!timezones || timezones.length === 0) return [];

  const overlaps: number[] = [];
  
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  const startUtc = d.getTime();

  for (let i = 0; i < 24; i++) {
    const testTime = new Date(startUtc + i * 60 * 60 * 1000);

    let allWorking = true;
    let baseHour = 0;

    for (let j = 0; j < timezones.length; j++) {
      const tz = timezones[j];
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        hourCycle: "h23",
      }).formatToParts(testTime);
      const hStr = parts.find((p) => p.type === "hour")?.value || "0";
      const h = parseInt(hStr, 10);

      if (j === 0) baseHour = h;

      if (!isWorkingHour(h)) {
        allWorking = false;
        break;
      }
    }

    if (allWorking && !overlaps.includes(baseHour)) {
      overlaps.push(baseHour);
    }
  }

  return overlaps.sort((a, b) => a - b);
}

export function hourToPercent(hour: number, minutes: number): number {
  const totalMinutes = hour * 60 + minutes;
  const percent = (totalMinutes / (24 * 60)) * 100;
  return Math.min(100, Math.max(0, percent));
}

export function getTimeAtPercent(percent: number, timezone: string, date: Date = new Date()): string {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

  const totalMinutes = Math.round((percent / 100) * 24 * 60);
  const targetDate = new Date(startOfDay.getTime() + totalMinutes * 60 * 1000);

  return formatTime(targetDate, timezone, "12h");
}
