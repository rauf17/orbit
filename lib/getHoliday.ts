import { HOLIDAYS } from "./holidays";

export function getHolidayForCity(
  countryCode: string, 
  dateStr: string  // "YYYY-MM-DD"
): string | null {
  const list = HOLIDAYS[countryCode] ?? [];
  return list.find(h => h.date === dateStr)?.name ?? null;
}
