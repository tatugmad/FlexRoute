import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import type { PositionQuality } from "@/types";

function ActiveIcon({ accuracy }: { accuracy: number | null }) {
  return (
    <div className="flex items-center gap-1 text-emerald-200 text-xs">
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h.01" />
        <path d="M7 20v-4" />
        <path d="M12 20v-8" />
        <path d="M17 20V8" />
      </svg>
      <span className="font-mono">{accuracy != null ? `${Math.round(accuracy)}m` : "--"}</span>
    </div>
  );
}

function LostIcon({ lostSince }: { lostSince: string | null }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!lostSince) { setSeconds(0); return; }
    const calc = () => Math.round((Date.now() - new Date(lostSince).getTime()) / 1000);
    setSeconds(calc());
    const id = setInterval(() => setSeconds(calc()), 1000);
    return () => clearInterval(id);
  }, [lostSince]);

  return (
    <div className="flex items-center gap-1 text-amber-300 text-xs animate-pulse">
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h.01" />
        <path d="M7 20v-4" />
        <line x1="17" y1="8" x2="12" y2="13" />
        <line x1="12" y1="8" x2="17" y2="13" />
      </svg>
      <span className="font-mono">{seconds}s</span>
    </div>
  );
}

function DeniedIcon() {
  return (
    <div className="flex items-center gap-1 text-rose-300 text-xs">
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h.01" />
        <path d="M7 20v-4" />
        <line x1="22" y1="2" x2="2" y2="22" />
      </svg>
      <span>拒否</span>
    </div>
  );
}

function getPopoverText(quality: PositionQuality, lostSeconds: number): string | null {
  if (quality === "lost") return `GPS信号を受信できません（${lostSeconds}秒経過）`;
  if (quality === "denied") return "位置情報の使用が許可されていません。ブラウザの設定から位置情報を許可し、ナビを再開始してください";
  return null;
}

export function GpsStatusIcon() {
  const quality = useNavigationStore((s) => s.positionQuality);
  const accuracy = useNavigationStore((s) => s.accuracy);
  const lostSince = useNavigationStore((s) => s.lostSince);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const lostSeconds = lostSince ? Math.round((Date.now() - new Date(lostSince).getTime()) / 1000) : 0;
  const popoverText = getPopoverText(quality, lostSeconds);

  const handleOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open, handleOutside]);

  return (
    <div ref={ref} className="relative ml-2">
      <button onClick={() => setOpen((v) => !v)} className="focus:outline-none">
        {quality === "active" && <ActiveIcon accuracy={accuracy} />}
        {quality === "lost" && <LostIcon lostSince={lostSince} />}
        {quality === "denied" && <DeniedIcon />}
      </button>
      {open && popoverText && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg p-3 text-sm text-slate-700 w-64 z-50">
          {popoverText}
        </div>
      )}
    </div>
  );
}
