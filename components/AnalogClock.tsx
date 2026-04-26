'use client';
import React, { useEffect, useState, memo } from 'react';

interface AnalogClockProps {
  timezone: string;
  size?: number;
  selectedDate?: Date;
}

const AnalogClock = ({ timezone, size = 22, selectedDate }: AnalogClockProps) => {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  
  useEffect(() => {
    const isToday = !selectedDate || selectedDate.toDateString() === new Date().toDateString();
    
    const update = () => {
      const now = isToday ? new Date() : new Date(selectedDate!.setHours(12, 0, 0, 0));
      const parts = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false, timeZone: timezone
      }).formatToParts(now);
      const get = (type: string) => 
        parseInt(parts.find(p => p.type === type)?.value ?? '0', 10);
      setTime({ 
        h: get('hour') % 12, 
        m: get('minute'), 
        s: get('second') 
      });
    };
    
    update();
    if (isToday) {
      const t = setInterval(update, 1000);
      return () => clearInterval(t);
    }
  }, [timezone, selectedDate]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;
  
  const hourAngle = (time.h / 12 + time.m / 720) * 360 - 90;
  const minAngle = (time.m / 60 + time.s / 3600) * 360 - 90;
  
  const toXY = (angle: number, length: number) => ({
    x: cx + length * Math.cos((angle * Math.PI) / 180),
    y: cy + length * Math.sin((angle * Math.PI) / 180),
  });
  
  const hEnd = toXY(hourAngle, r * 0.5);
  const mEnd = toXY(minAngle, r * 0.7);

  return (
    <svg 
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
      suppressHydrationWarning
    >
      <circle cx={cx} cy={cy} r={r} 
        fill="var(--bg-page)" 
        stroke="var(--border-default)" 
        strokeWidth="1"
      />
      {/* Hour hand */}
      <line 
        x1={cx} y1={cy} x2={hEnd.x} y2={hEnd.y}
        stroke="var(--text-primary)" strokeWidth="1.5" 
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line 
        x1={cx} y1={cy} x2={mEnd.x} y2={mEnd.y}
        stroke="var(--text-primary)" strokeWidth="1" 
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={1.5} fill="var(--text-primary)" />
    </svg>
  );
};

export default memo(AnalogClock);
