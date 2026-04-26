'use client';
import { useState } from 'react';

interface OrbitNoteProps {
  value: string;
  onChange: (val: string) => void;
}

export default function OrbitNote({ value, onChange }: OrbitNoteProps) {
  const [open, setOpen] = useState(!!value);
  const MAX = 120;

  return (
    <div style={{ marginTop: 12, position: 'relative', zIndex: 10 }}>
      <style>{`
        @keyframes noteEntrance {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        [data-theme="dark"] .orbit-note-glass {
          background: rgba(28,28,32,0.85) !important;
          border-color: rgba(255,255,255,0.08) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06) !important;
        }
      `}</style>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--text-muted)', padding: 0,
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'color 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ✏️{' '}
          <span>
            {value
              ? `Note: "${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`
              : 'Add meeting note'}
          </span>
        </button>
      )}

      {open && (
        <div
          className="orbit-note-glass"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.85)',
            borderRadius: 12,
            padding: '12px 14px',
            maxWidth: 400,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            animation: 'noteEntrance 200ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
            marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Meeting Note
          </div>
          <textarea
            autoFocus
            value={value}
            onChange={e => onChange(e.target.value.slice(0, MAX))}
            placeholder="e.g. Sprint planning call — Project Orbit"
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              outline: 'none', resize: 'none', fontSize: 13,
              color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif',
              lineHeight: 1.5,
            }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 6, borderTop: '1px solid var(--border-default)', paddingTop: 6,
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{value.length}/{MAX}</span>
            <button
              onClick={() => setOpen(false)}
              style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
