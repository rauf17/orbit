'use client';
import { useEffect, useRef, useState } from 'react';

interface ToastProps {
  message: string;
  submessage?: string;
  type?: 'success' | 'calendar' | 'error';
  onClose: () => void;
}

export default function Toast({ message, submessage, type = 'success', onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onClose(), 300);
  };

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    checkTheme();
    const obs = new MutationObserver(checkTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    setTimeout(() => setVisible(true), 10);
    timerRef.current = setTimeout(dismiss, 2500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      obs.disconnect();
    };
  }, []);

  const darkStyle = isDark ? {
    background: 'rgba(28,28,32,0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0f0f0',
  } : {};

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: 'var(--bg-page)', borderRadius: 10, padding: '14px 16px',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-default)',
      transform: visible && !leaving ? 'translateY(0)' : 'translateY(16px)',
      opacity: visible && !leaving ? 1 : 0,
      transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1), opacity 300ms ease',
      minWidth: 220, overflow: 'hidden',
      ...darkStyle,
    }}>
      <button onClick={dismiss} style={{
        position: 'absolute', top: 8, right: 8,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1
      }}>×</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16 }}>
        <span style={{ color: 'var(--success)', fontSize: 16 }}>✓</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{message}</div>
          {submessage && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{submessage}</div>}
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 2,
        background: 'var(--success)', borderRadius: '0 0 10px 10px',
        animation: 'toastProgress 2.5s linear forwards'
      }} />
      <style>{`
        @keyframes toastProgress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}
