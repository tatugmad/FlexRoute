import { useRef, useCallback, useEffect } from 'react';
import { useSensorStore } from '@/stores/sensorStore';
import { openSimChannel, closeSimChannel } from '@/services/simChannel';

const BTN = "bg-slate-500/15 rounded-full shadow-lg border border-slate-400/50 hover:bg-white/20 transition-all active:scale-95 pointer-events-auto flex items-center justify-center w-14 h-14";

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

  // cleanup on unmount
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

    popupRef.current = window.open(
      url,
      'flexroute-sim-remote',
      'width=380,height=620,resizable=yes,scrollbars=yes',
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
