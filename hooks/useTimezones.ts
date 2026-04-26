"use client";

import { useState, useEffect, useCallback } from 'react';
import { City, cities as allCities } from '../lib/cities';

const MAX_CITIES = 6;
const DEFAULT_CITIES = ['karachi', 'london', 'new-york', 'tokyo'];

export default function useTimezones() {
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [isInitialized, setIsInitialized] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Initialize state on mount
  useEffect(() => {
    let initialCityIds: string[] = [];
    const params = new URLSearchParams(window.location.search);
    const citiesParam = params.get('cities');

    if (citiesParam) {
      initialCityIds = citiesParam.split(',').filter(Boolean);
    } else {
      const stored = localStorage.getItem('orbit-cities');
      if (stored) {
        try { initialCityIds = JSON.parse(stored); } catch { /* ignore */ }
      }
    }

    if (!initialCityIds || initialCityIds.length === 0) {
      initialCityIds = DEFAULT_CITIES;
    }

    const resolvedCities = initialCityIds
      .map((id) => allCities.find((c) => c.id === id))
      .filter((c): c is City => c !== undefined)
      .slice(0, MAX_CITIES);

    const uniqueCities = Array.from(new Map(resolvedCities.map((c) => [c.id, c])).values());
    setSelectedCities(uniqueCities);

    const storedFormat = localStorage.getItem('orbit-timeformat');
    if (storedFormat === '12h' || storedFormat === '24h') {
      setTimeFormat(storedFormat);
    }

    // Read note from URL
    const urlNote = params.get('note');
    if (urlNote) {
      try { setNoteText(decodeURIComponent(urlNote)); } catch { setNoteText(urlNote); }
    }

    setIsInitialized(true);
  }, []);

  // Sync cities to localStorage + URL
  useEffect(() => {
    if (!isInitialized) return;
    const cityIds = selectedCities.map((c) => c.id);
    localStorage.setItem('orbit-cities', JSON.stringify(cityIds));
    const url = new URL(window.location.href);
    if (cityIds.length > 0) {
      url.searchParams.set('cities', cityIds.join(','));
    } else {
      url.searchParams.delete('cities');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedCities, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('orbit-timeformat', timeFormat);
  }, [timeFormat, isInitialized]);

  const updateNote = useCallback((text: string) => {
    const trimmed = text.slice(0, 120);
    setNoteText(trimmed);
    const params = new URLSearchParams(window.location.search);
    if (trimmed.trim()) {
      params.set('note', encodeURIComponent(trimmed));
    } else {
      params.delete('note');
    }
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, []);

  const addCity = useCallback((city: City) => {
    setSelectedCities((prev) => {
      if (prev.length >= MAX_CITIES) return prev;
      if (prev.some((c) => c.id === city.id)) return prev;
      return [...prev, city];
    });
  }, []);

  const removeCity = useCallback((cityId: string) => {
    setSelectedCities((prev) => prev.filter((c) => c.id !== cityId));
  }, []);

  const reorderCities = useCallback((fromIndex: number, toIndex: number) => {
    setSelectedCities((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const toggleTimeFormat = useCallback(() => {
    setTimeFormat((prev) => (prev === '12h' ? '24h' : '12h'));
  }, []);

  const setCitiesByIds = useCallback((ids: string[]) => {
    const resolved = ids
      .map((id) => allCities.find((c) => c.id === id))
      .filter((c): c is City => c !== undefined);
    setSelectedCities(resolved);
  }, []);

  return {
    selectedCities,
    addCity,
    removeCity,
    reorderCities,
    timeFormat,
    toggleTimeFormat,
    maxCities: MAX_CITIES,
    isInitialized,
    noteText,
    updateNote,
    setCitiesByIds,
  };
}
