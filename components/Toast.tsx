"use client";
import { useEffect, useState } from "react";

export default function Toast({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !visible) return null;

  return (
    <div
      className={`fixed bottom-[24px] right-[24px] z-[9999] transition-all duration-300
        ${visible ? "translate-y-0 opacity-100" : "translate-y-[16px] opacity-0"}
      `}
    >
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div className="relative bg-white shadow-lg rounded-[10px] px-[16px] py-[14px] border border-[rgba(34,42,53,0.08)] overflow-hidden flex items-center gap-[12px] min-w-[220px]">
        <div className="text-[#16a34a]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-sans font-semibold text-[#242424] leading-tight">
            Link copied!
          </span>
          <span className="text-[11px] font-sans text-[#898989] leading-tight mt-0.5">
            Share with your team
          </span>
        </div>
        
        {/* Progress Bar */}
        <div 
          className="absolute bottom-0 left-0 h-[3px] bg-[#16a34a]" 
          style={{ animation: visible ? 'toastProgress 2.5s linear forwards' : 'none' }}
        />
      </div>
    </div>
  );
}
