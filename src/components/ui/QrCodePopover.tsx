import { useState, useRef, useEffect } from "react";
import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function QrCodePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const url = window.location.href;

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="text-indigo-300 hover:text-white transition-colors"
        aria-label="QRコード表示"
      >
        <QrCode className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl p-4 z-50">
          <QRCodeSVG value={url} size={160} />
          <p className="mt-2 text-xs text-slate-500 max-w-[160px] break-all select-all">
            {url}
          </p>
        </div>
      )}
    </div>
  );
}
