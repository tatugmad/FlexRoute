import { useEffect, type MutableRefObject } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useSensorStore } from "@/stores/sensorStore";
import { resolveValues } from "@/services/sensorBridge";

/**
 * sim モード時: sensorStore の simValues 変更を監視して navigationStore に反映。
 * Geolocation API が発火しない環境（デスクトップ PC 等）でも sim 値を流す。
 */
export function useSimSubscription(
  lastPositionRef: MutableRefObject<{ lat: number; lng: number } | null>,
  setCurrentPosition: (
    position: { lat: number; lng: number },
    heading: number,
    speed: number,
    quality: 'active' | 'lost' | 'denied',
    accuracy: number | null,
  ) => void,
  setActive: () => void,
  setLost: () => void,
  clearLostTimer: () => void,
) {
  useEffect(() => {
    const state = useSensorStore.getState();
    if (!state.debugEnabled) return;

    const unsubscribe = useSensorStore.subscribe((newState, prevState) => {
      if (
        newState.simValues === prevState.simValues &&
        newState.channelModes === prevState.channelModes
      ) return;

      // sim チャンネルが1つもなければスキップ
      const hasSimChannel =
        newState.channelModes.position === 'sim' ||
        newState.channelModes.heading === 'sim' ||
        newState.channelModes.speed === 'sim';
      if (!hasSimChannel) return;

      const realValues = {
        position: lastPositionRef.current,
        heading: 0,
        speed: 0,
        accuracy: null as number | null,
      };

      const resolved = resolveValues(realValues);
      if (!resolved.position) return;

      lastPositionRef.current = resolved.position;
      const quality = resolved.positionQuality ?? "active";
      setCurrentPosition(resolved.position, resolved.heading, resolved.speed, quality, resolved.accuracy);

      if (resolved.positionQuality !== null) {
        if (resolved.positionQuality === "active") {
          setActive();
        } else if (resolved.positionQuality === "lost") {
          setLost();
        } else if (resolved.positionQuality === "denied") {
          useNavigationStore.setState({ positionQuality: "denied", lostSince: null });
        }
        clearLostTimer();
      }
    });

    return () => unsubscribe();
  }, [setCurrentPosition]);
}
