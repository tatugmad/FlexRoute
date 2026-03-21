import { useSensorStore } from '@/stores/sensorStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { getLastKnownPosition } from '@/services/geolocation';
import type { SensorMode, SensorChannelModes } from '@/types';

const CHANNEL_NAME = 'flexroute-sensor-bridge';
let channel: BroadcastChannel | null = null;

/** ポップアップとの通信チャンネルを開く */
export function openSimChannel(): void {
  if (channel) return;
  channel = new BroadcastChannel(CHANNEL_NAME);

  channel.onmessage = (event) => {
    const msg = event.data;
    if (!msg || typeof msg.type !== 'string') return;

    const store = useSensorStore.getState();

    switch (msg.type) {
      case 'remote-ready':
        syncStateToRemote();
        break;

      case 'set-channel-mode':
        if (msg.channel && msg.mode) {
          const ch = msg.channel as keyof SensorChannelModes;
          const mode = msg.mode as SensorMode;
          if (ch === 'position' && mode === 'sim') {
            const currentPos = useNavigationStore.getState().currentPosition;
            const initialPosition = currentPos
              ?? getLastKnownPosition()
              ?? { lat: 35.6812, lng: 139.7671 };
            store.setChannelMode(ch, mode, initialPosition);
          } else {
            store.setChannelMode(ch, mode);
          }
          syncStateToRemote();
        }
        break;

      case 'set-sim-position':
        if (msg.lat != null && msg.lng != null) {
          store.setSimPosition(msg.lat, msg.lng);
        }
        break;

      case 'set-sim-heading':
        if (msg.value != null) store.setSimHeading(msg.value);
        break;

      case 'set-sim-speed':
        if (msg.value != null) store.setSimSpeed(msg.value);
        break;

      case 'set-sim-accuracy':
        if (msg.value != null) store.setSimAccuracy(msg.value);
        break;

      case 'set-sim-interval':
        if (msg.value != null) store.setSimCallbackInterval(msg.value);
        break;

      case 'set-sim-denied':
        if (typeof msg.value === 'boolean') store.setSimDenied(msg.value);
        break;

      case 'set-position-callback-mode':
        if (msg.value) store.setPositionCallbackMode(msg.value);
        break;

      case 'set-heading-sync':
        if (typeof msg.value === 'boolean') store.setHeadingSync(msg.value);
        break;

      case 'set-speed-sync':
        if (typeof msg.value === 'boolean') store.setSpeedSync(msg.value);
        break;

      case 'remote-close':
        store.resetAllToReal();
        break;
    }
  };
}

/** 現在の sensorStore 状態をポップアップに送信 */
export function syncStateToRemote(): void {
  if (!channel) return;
  const { channelModes, simValues } = useSensorStore.getState();
  channel.postMessage({
    type: 'state-sync',
    channelModes,
    simValues,
  });
}

/** 通信チャンネルを閉じる */
export function closeSimChannel(): void {
  if (channel) {
    channel.close();
    channel = null;
  }
}
