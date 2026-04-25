"use client";

import { useState, useEffect } from 'react';

export default function useClock() {
  const [now, setNow] = useState(new Date());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { now, tick };
}
