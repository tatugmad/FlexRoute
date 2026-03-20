import { useSensorStore } from '@/stores/sensorStore';
import { useNavigationStore } from '@/stores/navigationStore';
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
        // ポップアップが準備完了 → 現在の state を送信
        syncStateToRemote();
        break;

      case 'set-channel-mode':
        if (msg.channel && msg.mode) {
          store.setChannelMode(
            msg.channel as keyof SensorChannelModes,
            msg.mode as SensorMode,
          );
          // position を sim に切り替えた時の初期化
          if (msg.channel === 'position' && msg.mode === 'sim') {
            const navState = useNavigationStore.getState();
            const currentPos = navState.currentPosition;
            if (currentPos) {
              store.setSimPosition(currentPos.lat, currentPos.lng);
            } else if (!store.simValues.position) {
              // real の位置もなく sim の位置も未設定の場合のみデフォルト
              store.setSimPosition(35.6812, 139.7671);
            }
            store.setSimPositionQuality('active');
          }
          // position を real に戻した時: GPS 状態をリセット
          if (msg.channel === 'position' && msg.mode === 'real') {
            useNavigationStore.setState({
              positionQuality: 'lost',
              lostSince: new Date().toISOString(),
            });
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

      case 'set-sim-quality':
        if (msg.value) store.setSimPositionQuality(msg.value);
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
