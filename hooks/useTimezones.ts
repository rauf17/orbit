"use client";

import { useState, useEffect, useCallback } from 'react';
import { City, cities as allCities } from '../lib/cities';

const MAX_CITIES = 6;
const DEFAULT_CITIES = ['karachi', 'london', 'new-york', 'tokyo'];

export default function useTimezones() {
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state on mount
  useEffect(() => {
    let initialCityIds: string[] = [];

    // 1. Check URL params
    const params = new URLSearchParams(window.location.search);
    const citiesParam = params.get('cities');

    if (citiesParam) {
      initialCityIds = citiesParam.split(',').filter(Boolean);
    } else {
      // 2. Check localStorage
      const stored = localStorage.getItem('orbit-cities');
      if (stored) {
        try {
          initialCityIds = JSON.parse(stored);
        } catch (e) {
          // ignore parsing errors
        }
      }
    }

    // 3. Fallback to defaults
    if (!initialCityIds || initialCityIds.length === 0) {
      initialCityIds = DEFAULT_CITIES;
    }

    // Resolve IDs to City objects
    const resolvedCities = initialCityIds
      .map((id) => allCities.find((c) => c.id === id))
      .filter((c): c is City => c !== undefined)
      .slice(0, MAX_CITIES);

    // Remove duplicates
    const uniqueCities = Array.from(new Map(resolvedCities.map((c) => [c.id, c])).values());

    setSelectedCities(uniqueCities);

    // Initialize time format
    const storedFormat = localStorage.getItem('orbit-timeformat');
    if (storedFormat === '12h' || storedFormat === '24h') {
      setTimeFormat(storedFormat);
    }

    setIsInitialized(true);
  }, []);

  // Update localStorage and URL whenever selectedCities changes
  useEffect(() => {
    if (!isInitialized) return;

    const cityIds = selectedCities.map((c) => c.id);

    // Save to localStorage
    localStorage.setItem('orbit-cities', JSON.stringify(cityIds));

    // Update URL without reloading the page
    const url = new URL(window.location.href);
    if (cityIds.length > 0) {
      url.searchParams.set('cities', cityIds.join(','));
    } else {
      url.searchParams.delete('cities');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedCities, isInitialized]);

  // Update timeFormat in localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('orbit-timeformat', timeFormat);
  }, [timeFormat, isInitialized]);

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

  return {
    selectedCities,
    addCity,
    removeCity,
    reorderCities,
    timeFormat,
    toggleTimeFormat,
    maxCities: MAX_CITIES,
    isInitialized,
  };
}
