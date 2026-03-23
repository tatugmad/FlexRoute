import { useNavigationStore } from "@/stores/navigationStore";
import { shortestDelta } from "@/utils/headingUtils";
import { computeEdgeFollow } from "@/utils/edgeFollow";
import type { CameraMode } from "./index";
import { calcPivotCenter, zoomStepFactor, ACCEL_PHASES } from "./utils";

const AUTO_ZOOM_THRESHOLD = 0.3;
const LONG_PRESS_DELAY = 200;

/** Mode ORG: v1.6.92 の動作を完全再現する CameraMode 実装。 */
export class ModeOrg implements CameraMode {
  private wheelMode: "pivot" | "native" = "pivot";
  private isAutoZooming = false;
  private wheelStopTimer: ReturnType<typeof setTimeout> | null = null;
  private zoomActive = false;
  private zoomDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private zoomStepCount = 0;
  private idleListener: google.maps.MapsEventListener | null = null;

  init(map: google.maps.Map): void {
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
  }

  applyPosition(map: google.maps.Map, pos: { lat: number; lng: number },
    mapHeading: number, followMode: "auto" | "free",
    isDragging: boolean, zoomTarget: number | null): void {
    if (followMode === "auto") {
      let zoomValue: number | undefined;
      if (zoomTarget !== null) {
        const cur = map.getZoom() ?? 15;
        if (Math.abs(cur - zoomTarget) >= AUTO_ZOOM_THRESHOLD) {
          this.isAutoZooming = true;
          zoomValue = zoomTarget;
        }
      }
      const curHeading = map.getHeading() ?? 0;
      if (Math.abs(shortestDelta(curHeading, mapHeading)) < 1 && zoomValue === undefined) {
        map.panTo(pos);
      } else {
        const opts: google.maps.CameraOptions = { center: pos, heading: mapHeading };
        if (zoomValue !== undefined) opts.zoom = zoomValue;
        map.moveCamera(opts);
      }
    } else {
      if (isDragging) return;
      const opts: google.maps.CameraOptions = { heading: mapHeading };
      const edgeCenter = computeEdgeFollow(map, pos);
      if (edgeCenter) opts.center = edgeCenter;
      if (opts.heading !== undefined || opts.center !== undefined) map.moveCamera(opts);
    }
  }

  applyWheel(map: google.maps.Map, step: number): boolean {
    const state = useNavigationStore.getState();
    if (state.followMode !== "auto" || this.wheelMode === "native") return false;
    const cur = map.getZoom() ?? 15;
    const next = Math.max(1, Math.min(22, cur + step));
    if (next === cur) return true;
    const marker = state.currentPosition;
    if (marker) this.pivotZoom(map, marker, next);
    else map.setZoom(next);
    // Debounce: snap camera after 150ms idle
    if (this.wheelStopTimer) clearTimeout(this.wheelStopTimer);
    this.wheelStopTimer = setTimeout(() => {
      const z = map.getZoom();
      const c = map.getCenter();
      if (z != null && c) map.moveCamera({ zoom: z, center: c });
      this.wheelStopTimer = null;
    }, 150);
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

  toggleWheelMode(map: google.maps.Map): "pivot" | "native" {
    this.wheelMode = this.wheelMode === "pivot" ? "native" : "pivot";
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
    return this.wheelMode;
  }

  getWheelMode(): "pivot" | "native" { return this.wheelMode; }

  dispose(): void {
    if (this.wheelStopTimer) { clearTimeout(this.wheelStopTimer); this.wheelStopTimer = null; }
    if (this.zoomDelayTimer) { clearTimeout(this.zoomDelayTimer); this.zoomDelayTimer = null; }
    this.zoomActive = false;
    if (this.idleListener) { google.maps.event.removeListener(this.idleListener); this.idleListener = null; }
  }

  // --- Private helpers ---
  private pivotZoom(map: google.maps.Map, marker: { lat: number; lng: number }, newZoom: number): void {
    const curZoom = map.getZoom() ?? 15;
    const center = map.getCenter();
    if (!center) { map.setZoom(newZoom); return; }
    const nc = calcPivotCenter({ lat: center.lat(), lng: center.lng() }, marker, curZoom, newZoom);
    map.setZoom(newZoom);
    map.setCenter(nc);
  }

  private applyZoomStep(map: google.maps.Map, direction: 1 | -1, baseStep: number): void {
    const curZoom = map.getZoom() ?? 15;
    const step = baseStep * zoomStepFactor(curZoom, direction);
    const next = Math.max(1, Math.min(22, curZoom + direction * step));
    if (next === curZoom) return;
    const marker = useNavigationStore.getState().currentPosition;
    if (this.wheelMode === "pivot" && marker) this.pivotZoom(map, marker, next);
    else map.setZoom(next);
  }

  private startIdleChain(map: google.maps.Map, direction: 1 | -1): void {
    if (!this.zoomActive) return;
    this.zoomStepCount++;
    const phase = ACCEL_PHASES.find(p => this.zoomStepCount <= p.until) ?? ACCEL_PHASES[ACCEL_PHASES.length - 1]!;
    this.applyZoomStep(map, direction, phase.baseStep);
    this.idleListener = google.maps.event.addListenerOnce(map, "idle", () => this.startIdleChain(map, direction));
  }
}
