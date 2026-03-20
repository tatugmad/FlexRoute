import { useSensorStore } from "@/stores/sensorStore";

type RealValues = {
  position: { lat: number; lng: number } | null;
  heading: number;
  speed: number;
  accuracy: number | null;
};

/**
 * real 値と sim 値をチャンネルモードに基づいてマージして返す。
 * debugEnabled === false の場合は real 値をそのまま返す。
 */
export function resolveValues(real: RealValues): {
  position: { lat: number; lng: number } | null;
  heading: number;
  speed: number;
  accuracy: number | null;
  positionQuality: 'active' | 'lost' | 'denied' | null;
} {
  const state = useSensorStore.getState();

  if (!state.debugEnabled) {
    return { ...real, positionQuality: null };
  }

  const modes = state.channelModes;
  const sim = state.simValues;

  return {
    position: modes.position === 'sim' ? sim.position : real.position,
    heading: modes.heading === 'sim' ? sim.heading : real.heading,
    speed: modes.speed === 'sim' ? sim.speed : real.speed,
    accuracy: modes.position === 'sim' ? sim.accuracy : real.accuracy,
    positionQuality: modes.position === 'sim' ? sim.positionQuality : null,
  };
}
