"use client";

import { useState, useEffect, useCallback } from "react";

export interface TeamPreset {
  id: string;
  name: string;
  cityIds: string[];
  createdAt: number;
}

export function useTeamPresets() {
  const [presets, setPresets] = useState<TeamPreset[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("orbit-teams");
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    }
  }, []);

  const savePreset = useCallback((name: string, cityIds: string[]) => {
    setPresets((prev) => {
      const newPresets = [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: name.slice(0, 20),
          cityIds,
          createdAt: Date.now(),
        },
      ];
      localStorage.setItem("orbit-teams", JSON.stringify(newPresets));
      return newPresets;
    });
  }, []);

  const loadPreset = useCallback((id: string) => {
    const preset = presets.find((p) => p.id === id);
    return preset ? preset.cityIds : [];
  }, [presets]);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => {
      const newPresets = prev.filter((p) => p.id !== id);
      localStorage.setItem("orbit-teams", JSON.stringify(newPresets));
      return newPresets;
    });
  }, []);

  return {
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  };
}
