import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import type { PositionQuality } from "@/types";

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

  const [lostSeconds, setLostSeconds] = useState(0);
  useEffect(() => {
    if (quality !== "lost" || !lostSince) { setLostSeconds(0); return; }
    const calc = () => Math.floor((Date.now() - new Date(lostSince).getTime()) / 1000);
    setLostSeconds(calc());
    const id = setInterval(() => setLostSeconds(calc()), 1000);
    return () => clearInterval(id);
  }, [quality, lostSince]);

  useEffect(() => {
    if (!document.getElementById("gps-status-blink-style")) {
      const style = document.createElement("style");
      style.id = "gps-status-blink-style";
      style.textContent = `
        @keyframes statusBlink {
          0%, 49.9% { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const valueText = quality === "active"
    ? (accuracy === null ? "--" : Math.round(accuracy) > 99 ? "99+" : `${Math.round(accuracy)}m`)
    : quality === "lost"
    ? (lostSeconds > 99 ? "99+" : `${lostSeconds}s`)
    : "拒否";

  const color = quality === "active" ? "#059669"
    : quality === "lost" ? "#d97706"
    : "#dc2626";
  const bgColor = quality === "active" ? "rgba(16,185,129,0.12)"
    : quality === "lost" ? "rgba(245,158,11,0.12)"
    : "rgba(239,68,68,0.1)";
  const borderColor = quality === "active" ? "rgba(16,185,129,0.5)"
    : quality === "lost" ? "rgba(245,158,11,0.5)"
    : "rgba(239,68,68,0.45)";

  const shouldBlink = quality === "lost" || quality === "denied";

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
        <div style={{
          width: 40, height: 40,
          borderRadius: "50%",
          background: bgColor,
          border: `1.5px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="36" height="36" viewBox="0 0 60 60" fill="none">
            {/* 衛星（固定、点滅しない） */}
            <g transform="translate(15,11.5)">
              <g transform="rotate(-45) scale(0.383)" stroke={color}>
                <ellipse cx="0" cy="0" rx="5" ry="8" strokeWidth="1.5" fill="none"/>
                <line x1="-5" y1="0" x2="-8" y2="0" strokeWidth="1.5"/>
                <rect x="-26" y="-6" width="18" height="12" rx="0.5" strokeWidth="1.5" fill="none"/>
                <line x1="-17" y1="-6" x2="-17" y2="6" strokeWidth="1.5"/>
                <line x1="5" y1="0" x2="8" y2="0" strokeWidth="1.5"/>
                <rect x="8" y="-6" width="18" height="12" rx="0.5" strokeWidth="1.5" fill="none"/>
                <line x1="17" y1="-6" x2="17" y2="6" strokeWidth="1.5"/>
                <line x1="0" y1="8" x2="0" y2="18" strokeWidth="1.5"/>
              </g>
            </g>
            {/* GPS テキスト（固定、点滅しない） */}
            <text x="37" y="14.5" textAnchor="middle" dominantBaseline="central"
              fill={color} fontSize="13" fontWeight="500" fontFamily="sans-serif">GPS</text>
            {/* 値テキスト + ライン（lost/denied で点滅） */}
            <g style={shouldBlink ? { animation: "statusBlink 1s step-end infinite" } : undefined}>
              <text x="30" y="34" textAnchor="middle" dominantBaseline="central"
                fill={color} fontSize="27" fontWeight="500" fontFamily="sans-serif">{valueText}</text>
              {/* active: 双方向矢印 */}
              {quality === "active" && (
                <>
                  <line x1="11" y1="51" x2="49" y2="51" stroke={color} strokeWidth="1"/>
                  <path d="M10 51l3-2.5v5z" fill={color}/>
                  <path d="M50 51l-3-2.5v5z" fill={color}/>
                </>
              )}
              {/* lost: 実線→破線→右矢印 */}
              {quality === "lost" && (
                <>
                  <line x1="11" y1="51" x2="24" y2="51" stroke={color} strokeWidth="1"/>
                  <line x1="27" y1="51" x2="31" y2="51" stroke={color} strokeWidth="1"/>
                  <line x1="34" y1="51" x2="37" y2="51" stroke={color} strokeWidth="1"/>
                  <line x1="39" y1="51" x2="41" y2="51" stroke={color} strokeWidth="1"/>
                  <line x1="43" y1="51" x2="44.5" y2="51" stroke={color} strokeWidth="1"/>
                  <line x1="46" y1="51" x2="47" y2="51" stroke={color} strokeWidth="1"/>
                  <path d="M50 51l-3-2.5v5z" fill={color}/>
                </>
              )}
              {/* denied: ラインなし */}
            </g>
          </svg>
        </div>
      </button>
      {open && popoverText && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg p-3 text-sm text-slate-700 w-64 z-50">
          {popoverText}
        </div>
      )}
    </div>
  );
}
