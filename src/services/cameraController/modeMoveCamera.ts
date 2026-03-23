import { useNavigationStore } from "@/stores/navigationStore";
import { computeEdgeFollow } from "@/utils/edgeFollow";
import type { CameraMode } from "./index";
import { calcPivotCenter, calcRotationPivotCenter, zoomStepFactor, ACCEL_PHASES } from "./utils";

const LONG_PRESS_DELAY = 200;

/** Mode MOVE: moveCamera のみ使用。アニメーション完全ゼロ。 */
export class ModeMoveCamera implements CameraMode {
  private wheelMode: "pivot" | "native" = "pivot";
  private prevHeading = 0;
  private isAutoZooming = false;
  private zoomActive = false;
  private zoomDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private zoomStepCount = 0;
  private idleListener: google.maps.MapsEventListener | null = null;

  init(map: google.maps.Map): void {
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
    this.prevHeading = map.getHeading() ?? 0;
  }

  applyPosition(map: google.maps.Map, pos: { lat: number; lng: number },
    mapHeading: number, followMode: "auto" | "free",
    isDragging: boolean, zoomTarget: number | null): void {
    if (followMode === "auto") {
      this.prevHeading = mapHeading;
      const opts: google.maps.CameraOptions = { center: pos, heading: mapHeading };
      if (zoomTarget !== null) {
        this.isAutoZooming = true;
        opts.zoom = zoomTarget;
      }
      map.moveCamera(opts);
    } else {
      if (isDragging) return;
      const headingDelta = mapHeading - this.prevHeading;
      this.prevHeading = mapHeading;
      const center = map.getCenter();
      let newCenter: { lat: number; lng: number } | undefined;
      if (center && Math.abs(headingDelta) >= 0.01) {
        newCenter = calcRotationPivotCenter(
          { lat: center.lat(), lng: center.lng() }, pos, headingDelta,
        );
      }
      const edgeCenter = computeEdgeFollow(map, pos);
      const opts: google.maps.CameraOptions = { heading: mapHeading };
      if (edgeCenter) {
        opts.center = edgeCenter;
      } else if (newCenter) {
        opts.center = newCenter;
      }
      map.moveCamera(opts);
    }
  }

  applyWheel(map: google.maps.Map, step: number): boolean {
    const state = useNavigationStore.getState();
    if (state.followMode !== "auto" || this.wheelMode === "native") return false;
    const cur = map.getZoom() ?? 15;
    const next = Math.max(1, Math.min(22, cur + step));
    if (next === cur) return true;
    const marker = state.currentPosition;
    if (marker) {
      const nc = calcPivotCenter(
        { lat: map.getCenter()!.lat(), lng: map.getCenter()!.lng() },
        marker, cur, next,
      );
      map.moveCamera({ center: nc, zoom: next });
    } else {
      map.moveCamera({ zoom: next });
    }
    return true;
  }

  onZoomButtonDown(map: google.maps.Map, direction: 1 | -1): void {
    this.applyZoomStep(map, direction, 0.25);
    this.zoomActive = true;
    this.zoomStepCount = 0;
    this.zoomDelayTimer = setTimeout(() => {
      if (this.zoomActive) this.startIdleChain(map, direction);
    }, LONG_PRESS_DELAY);
  }

  onZoomButtonUp(_map: google.maps.Map): void {
    this.zoomActive = false;
    if (this.zoomDelayTimer) { clearTimeout(this.zoomDelayTimer); this.zoomDelayTimer = null; }
    if (this.idleListener) { google.maps.event.removeListener(this.idleListener); this.idleListener = null; }
  }

  onMapZoomChanged(): boolean {
    if (this.isAutoZooming) { this.isAutoZooming = false; return true; }
    return false;
  }

  onDragStart(): void {
    // アニメーションなし。処理不要。
  }

  toggleWheelMode(map: google.maps.Map): "pivot" | "native" {
    this.wheelMode = this.wheelMode === "pivot" ? "native" : "pivot";
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
    return this.wheelMode;
  }

  getWheelMode(): "pivot" | "native" { return this.wheelMode; }

  dispose(): void {
    if (this.zoomDelayTimer) { clearTimeout(this.zoomDelayTimer); this.zoomDelayTimer = null; }
    this.zoomActive = false;
    if (this.idleListener) { google.maps.event.removeListener(this.idleListener); this.idleListener = null; }
  }

  private applyZoomStep(map: google.maps.Map, direction: 1 | -1, baseStep: number): void {
    const curZoom = map.getZoom() ?? 15;
    const step = baseStep * zoomStepFactor(curZoom, direction);
    const next = Math.max(1, Math.min(22, curZoom + direction * step));
    if (next === curZoom) return;
    const marker = useNavigationStore.getState().currentPosition;
    if (this.wheelMode === "pivot" && marker) {
      const nc = calcPivotCenter(
        { lat: map.getCenter()!.lat(), lng: map.getCenter()!.lng() },
        marker, curZoom, next,
      );
      map.moveCamera({ center: nc, zoom: next });
    } else {
      map.moveCamera({ zoom: next });
    }
  }

  private startIdleChain(map: google.maps.Map, direction: 1 | -1): void {
    if (!this.zoomActive) return;
    this.zoomStepCount++;
    const phase = ACCEL_PHASES.find(p => this.zoomStepCount <= p.until) ?? ACCEL_PHASES[ACCEL_PHASES.length - 1]!;
    this.applyZoomStep(map, direction, phase.baseStep);
    this.idleListener = google.maps.event.addListenerOnce(map, "idle", () => this.startIdleChain(map, direction));
  }
}
