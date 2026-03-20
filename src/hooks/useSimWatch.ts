import { useEffect, type MutableRefObject } from "react";
import { useSensorStore } from "@/stores/sensorStore";
import { useNavigationStore } from "@/stores/navigationStore";
import type { SensorChannelModes } from "@/types";

type StartWatchFn = () => void;
type SetLostFn = () => void;

const hasAnySimChannel = (modes: SensorChannelModes) =>
  modes.position === "sim" || modes.heading === "sim" || modes.speed === "sim";

/**
 * wrapperCallback: sim 起動中のみ watchPosition に登録される callback。
 * sensorStore のチャンネルモードを参照し、real と sim の値を混ぜて handlePosition に渡す。
 */
export function createWrapperCallback(
  handlePosition: (pos: GeolocationPosition) => void,
): (pos: GeolocationPosition) => void {
  return (pos: GeolocationPosition) => {
    const { channelModes, simValues: sim } = useSensorStore.getState();

    // position が sim で quality が lost/denied → handlePosition を呼ばない（GPS 不在を模擬）
    if (channelModes.position === "sim" && sim.positionQuality !== "active") {
      return;
    }

    const mixed = {
      coords: {
        latitude:
          channelModes.position === "sim" && sim.position
            ? sim.position.lat
            : pos.coords.latitude,
        longitude:
          channelModes.position === "sim" && sim.position
            ? sim.position.lng
            : pos.coords.longitude,
        heading: channelModes.heading === "sim" ? sim.heading : pos.coords.heading,
        speed: channelModes.speed === "sim" ? sim.speed : pos.coords.speed,
        accuracy:
          channelModes.position === "sim" ? sim.accuracy : pos.coords.accuracy,
        altitude: pos.coords.altitude,
        altitudeAccuracy: pos.coords.altitudeAccuracy,
      },
      timestamp: pos.timestamp,
    } as GeolocationPosition;

    handlePosition(mixed);
  };
}

/**
 * sensorStore の変更を監視し、callback 切替と sim 値即時反映を行う。
 */
export function useSimSubscription(
  handlePositionRef: MutableRefObject<((pos: GeolocationPosition) => void) | null>,
  startWatchReal: StartWatchFn,
  startWatchSim: StartWatchFn,
  setLost: SetLostFn,
) {
  useEffect(() => {
    let isSimActive = false;

    const unsubscribe = useSensorStore.subscribe((newState, prevState) => {
      // --- 責務A: callback 切替 ---
      if (newState.channelModes !== prevState.channelModes) {
        const shouldBeSim = hasAnySimChannel(newState.channelModes);
        if (shouldBeSim && !isSimActive) {
          startWatchSim();
          isSimActive = true;
        } else if (!shouldBeSim && isSimActive) {
          startWatchReal();
          isSimActive = false;
        }
      }

      // --- 責務B: sim 値変更時に即座に反映 ---
      if (!isSimActive) return;
      if (
        newState.simValues === prevState.simValues &&
        newState.channelModes === prevState.channelModes
      ) {
        return;
      }

      const sim = newState.simValues;

      // quality が lost/denied → handlePosition を呼ばない
      if (newState.channelModes.position === "sim") {
        if (sim.positionQuality === "lost") {
          setLost();
          return;
        }
        if (sim.positionQuality === "denied") {
          useNavigationStore.setState({ positionQuality: "denied", lostSince: null });
          return;
        }
      }

      // active → handlePosition を偽データで呼ぶ
      const fakePos = {
        coords: {
          latitude: sim.position?.lat ?? 35.6812,
          longitude: sim.position?.lng ?? 139.7671,
          heading: sim.heading,
          speed: sim.speed,
          accuracy: sim.accuracy,
          altitude: null,
          altitudeAccuracy: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      handlePositionRef.current?.(fakePos);
    });

    return () => {
      unsubscribe();
    };
  }, [handlePositionRef, startWatchReal, startWatchSim, setLost]);
}
