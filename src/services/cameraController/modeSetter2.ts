import { useNavigationStore } from "@/stores/navigationStore";
import { computeEdgeFollow } from "@/utils/edgeFollow";
import type { CameraMode } from "./index";
import { calcPivotCenter, zoomStepFactor, ACCEL_PHASES, deriveCenter } from "./utils";

const LONG_PRESS_DELAY = 200;

/** Mode SETTER2: setter 系 + heading_changed イベントで heading-master 方式。 */
export class ModeSetter2 implements CameraMode {
  private wheelMode: "pivot" | "native" = "pivot";
  private prevHeading = 0;
  private isAutoZooming = false;
  private wheelStopTimer: ReturnType<typeof setTimeout> | null = null;
  private zoomActive = false;
  private zoomDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private zoomStepCount = 0;
  private idleListener: google.maps.MapsEventListener | null = null;
  private headingListener: google.maps.MapsEventListener | null = null;
  private lockRotationAnchor: {
    startCenter: { lat: number; lng: number };
    markerPos: { lat: number; lng: number };
    startHeading: number;
  } | null = null;

  init(map: google.maps.Map): void {
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
    this.prevHeading = map.getHeading() ?? 0;
  }

  applyPosition(map: google.maps.Map, pos: { lat: number; lng: number },
    mapHeading: number, followMode: "auto" | "free",
    isDragging: boolean, zoomTarget: number | null): void {
    if (followMode === "auto") {
      const prevH = this.prevHeading;
      this.prevHeading = mapHeading;
      // heading-master: set heading then derive center
      map.setHeading(mapHeading);
      const center = map.getCenter();
      const curCenter = center ? { lat: center.lat(), lng: center.lng() } : pos;
      const c = deriveCenter(curCenter, curCenter, pos, pos, prevH, mapHeading, 1.0);
      map.setCenter(c);
      if (zoomTarget !== null) {
        this.isAutoZooming = true;
        map.setZoom(zoomTarget);
      }
    } else {
      if (isDragging) return;
      const prevH = this.prevHeading;
      this.prevHeading = mapHeading;
      const headingDelta = mapHeading - prevH;
      if (Math.abs(headingDelta) >= 0.01) {
        // heading_changed リスナーで中間フレーム補正
        const center = map.getCenter()!;
        this.lockRotationAnchor = {
          startCenter: { lat: center.lat(), lng: center.lng() },
          markerPos: pos,
          startHeading: map.getHeading() ?? 0,
        };
        if (this.headingListener) google.maps.event.removeListener(this.headingListener);
        this.headingListener = map.addListener("heading_changed", () => {
          if (!this.lockRotationAnchor) return;
          const currentHeading = map.getHeading() ?? 0;
          const a = this.lockRotationAnchor;
          const c = deriveCenter(
            a.startCenter, a.markerPos, a.markerPos, a.markerPos,
            a.startHeading, currentHeading, 1.0,
          );
          map.setCenter(c);
        });
      }
      map.setHeading(mapHeading);
      const edgeCenter = computeEdgeFollow(map, pos);
      if (edgeCenter) map.setCenter(edgeCenter);
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
      map.setZoom(next);
      map.setCenter(nc);
    } else {
      map.setZoom(next);
    }
    if (this.wheelStopTimer) clearTimeout(this.wheelStopTimer);
    this.wheelStopTimer = setTimeout(() => {
      const z = map.getZoom();
      const c = map.getCenter();
      if (z != null && c) { map.setZoom(z); map.setCenter(c); }
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

  onDragStart(): void {}

  toggleWheelMode(map: google.maps.Map): "pivot" | "native" {
    this.wheelMode = this.wheelMode === "pivot" ? "native" : "pivot";
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
    return this.wheelMode;
  }

  getWheelMode(): "pivot" | "native" { return this.wheelMode; }

  dispose(): void {
    if (this.headingListener) { google.maps.event.removeListener(this.headingListener); this.headingListener = null; }
    this.lockRotationAnchor = null;
    if (this.wheelStopTimer) { clearTimeout(this.wheelStopTimer); this.wheelStopTimer = null; }
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
      map.setZoom(next);
      map.setCenter(nc);
    } else {
      map.setZoom(next);
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
