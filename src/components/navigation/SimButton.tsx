import { useRef, useCallback, useEffect } from 'react';
import { useSensorStore } from '@/stores/sensorStore';
import { openSimChannel, closeSimChannel } from '@/services/simChannel';

const BTN = "bg-slate-500/15 rounded-full shadow-lg border border-slate-400/50 hover:bg-white/20 transition-all active:scale-95 pointer-events-auto flex items-center justify-center w-14 h-14";

const POPUP_STORAGE_KEY = 'flexroute:simPopupBounds';
const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 620;

function loadPopupBounds(): string {
  try {
    const raw = localStorage.getItem(POPUP_STORAGE_KEY);
    if (!raw) return `width=${DEFAULT_WIDTH},height=${DEFAULT_HEIGHT},resizable=yes,scrollbars=yes`;
    const b = JSON.parse(raw);
    return `width=${b.width},height=${b.height},left=${b.left},top=${b.top},resizable=yes,scrollbars=yes`;
  } catch {
    return `width=${DEFAULT_WIDTH},height=${DEFAULT_HEIGHT},resizable=yes,scrollbars=yes`;
  }
}

export function SimButton() {
  const debugEnabled = useSensorStore((s) => s.debugEnabled);
  const popupRef = useRef<Window | null>(null);
  const listenersAttached = useRef(false);

  const focusPopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
    }
  }, []);

  const attachFocusListeners = useCallback(() => {
    if (listenersAttached.current) return;
    window.addEventListener('focus', focusPopup);
    document.addEventListener('pointerdown', focusPopup, true);
    listenersAttached.current = true;
  }, [focusPopup]);

  const detachFocusListeners = useCallback(() => {
    if (!listenersAttached.current) return;
    window.removeEventListener('focus', focusPopup);
    document.removeEventListener('pointerdown', focusPopup, true);
    listenersAttached.current = false;
  }, [focusPopup]);

  useEffect(() => {
    return () => detachFocusListeners();
  }, [detachFocusListeners]);

  if (!debugEnabled) return null;

  const handleClick = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }

    openSimChannel();

    const basePath = import.meta.env.BASE_URL ?? '/';
    const url = `${basePath}sim-remote.html`;
    const features = loadPopupBounds();

    popupRef.current = window.open(
      url,
      'flexroute-sim-remote',
      features,
    );

    attachFocusListeners();

    const checkClosed = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        clearInterval(checkClosed);
        popupRef.current = null;
        detachFocusListeners();
        useSensorStore.getState().resetAllToReal();
        closeSimChannel();
      }
    }, 500);
  };

  return (
    <button className={BTN} onClick={handleClick}>
      <div className="w-12 h-12">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <text
            x="50" y="50"
            fill="#d97706"
            fontFamily="Arial, sans-serif" fontWeight="900" fontSize="28"
            textAnchor="middle" dominantBaseline="central"
          >
            SIM
          </text>
        </svg>
      </div>
    </button>
  );
}
