import normalizeWheel from "normalize-wheel";
import { useNavigationStore } from "@/stores/navigationStore";
import { shortestDelta } from "@/utils/headingUtils";
import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import { calcAutoZoomTarget } from "./utils";
import { ModeA } from "./modeA";

const MAX_ZOOM_DELTA = 0.5;
const MIN_UPDATE_INTERVAL_MS = 4500;

/** D-037: CameraMode インターフェース。モード単位で差し替え可能。 */
export interface CameraMode {
  init(map: google.maps.Map): void;
  applyPosition(map: google.maps.Map, pos: { lat: number; lng: number },
    mapHeading: number, followMode: "auto" | "free",
    isDragging: boolean, zoomTarget: number | null): void;
  applyWheel(map: google.maps.Map, step: number): boolean;
  onZoomButtonDown(map: google.maps.Map, direction: 1 | -1): void;
  onZoomButtonUp(map: google.maps.Map): void;
  onMapZoomChanged(): boolean;
  toggleWheelMode(map: google.maps.Map): "pivot" | "native";
  getWheelMode(): "pivot" | "native";
  dispose(): void;
}

/** D-037: Google Maps カメラ API の唯一のインターフェース */
class CameraControllerImpl {
  private map: google.maps.Map | null = null;
  private mode: CameraMode = new ModeA();
  private modeName = "A";
  private prevHeading = 0;
  private isDragging = false;
  private mountedAt = 0;
  private prevAutoZoom: number | null = null;
  private prevAutoZoomTime = 0;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private listeners: google.maps.MapsEventListener[] = [];

  init(map: google.maps.Map): void {
    this.map = map;
    this.prevHeading = 0;
    this.isDragging = false;
    this.mountedAt = Date.now();
    this.prevAutoZoom = null;
    this.prevAutoZoomTime = 0;
    this.wheelHandler = (e: WheelEvent) => this.handleWheel(e);
    map.getDiv().addEventListener("wheel", this.wheelHandler, { passive: false });
    this.listeners.push(
      map.addListener("dragstart", () => {
        this.isDragging = true;
        if (useNavigationStore.getState().followMode === "auto") {
          useNavigationStore.getState().setFollowMode("free");
          fr.debug(C.NAV, "nav.dragToFree", {});
        }
      }),
      map.addListener("dragend", () => { this.isDragging = false; }),
      map.addListener("zoom_changed", () => {
        if (this.mode.onMapZoomChanged()) return;
        if (Date.now() - this.mountedAt < 2000) return;
        if (useNavigationStore.getState().zoomMode === "autoZoom") {
          useNavigationStore.getState().setZoomMode("lockedZoom");
          fr.debug(C.NAV, "nav.zoomToLocked", {});
        }
      }),
    );
    this.mode.init(map);
  }

  dispose(): void {
    if (this.map && this.wheelHandler) {
      this.map.getDiv().removeEventListener("wheel", this.wheelHandler);
      this.map.setOptions({ scrollwheel: true });
    }
    this.wheelHandler = null;
    this.listeners.forEach((l) => google.maps.event.removeListener(l));
    this.listeners = [];
    this.mode.dispose();
    this.map = null;
  }

  onPositionUpdate(pos: { lat: number; lng: number }, heading: number, speed: number): void {
    if (!this.map) return;
    const state = useNavigationStore.getState();
    const rawHeading = state.headingMode === "headingUp" ? heading : 0;
    if (state.followMode === "auto") {
      const actual = this.map.getHeading() ?? 0;
      if (Math.abs(shortestDelta(this.prevHeading, actual)) > 10) this.prevHeading = actual;
    }
    const mapHeading = this.interpolateHeading(rawHeading);
    const zoomTarget = state.zoomMode === "autoZoom"
      ? this.calcAutoZoom(speed, state.distanceToNextStepM, pos.lat) : null;
    this.mode.applyPosition(this.map, pos, mapHeading, state.followMode, this.isDragging, zoomTarget);
  }

  onZoomButtonDown(direction: 1 | -1): void { if (this.map) this.mode.onZoomButtonDown(this.map, direction); }
  onZoomButtonUp(): void { if (this.map) this.mode.onZoomButtonUp(this.map); }
  toggleWheelMode(): "pivot" | "native" {
    return this.map ? this.mode.toggleWheelMode(this.map) : this.mode.getWheelMode();
  }
  getWheelMode(): "pivot" | "native" { return this.mode.getWheelMode(); }
  setMode(name: string): void {
    if (!this.map) { this.modeName = name; return; }
    this.mode.dispose();
    this.modeName = name;
    this.mode = new ModeA();
    this.mode.init(this.map);
  }
  getMode(): string { return this.modeName; }

  private handleWheel(e: WheelEvent): void {
    if (!this.map) return;
    const normalized = normalizeWheel(e);
    const step = Math.max(-1, Math.min(1, -normalized.pixelY / 400));
    if (this.mode.applyWheel(this.map, step)) e.preventDefault();
  }

  private interpolateHeading(rawHeading: number): number {
    const delta = shortestDelta(this.prevHeading, rawHeading);
    this.prevHeading += delta;
    return this.prevHeading;
  }

  private calcAutoZoom(speed: number, distanceToNextStepM: number, lat: number): number | null {
    if (!this.map) return null;
    const now = Date.now();
    if (this.prevAutoZoomTime && now - this.prevAutoZoomTime < MIN_UPDATE_INTERVAL_MS) return this.prevAutoZoom;
    const screenHalfH = this.map.getDiv()?.offsetHeight / 2 || 300;
    let target = calcAutoZoomTarget(speed, distanceToNextStepM, lat, screenHalfH);
    if (distanceToNextStepM > 0 && distanceToNextStepM <= 300) {
      fr.debug(C.NAV, "zoom.turnApproach", {
        distM: Math.round(distanceToNextStepM),
        boost: Math.round((target - calcAutoZoomTarget(speed, 0, lat, screenHalfH)) * 100) / 100,
      });
    }
    if (this.prevAutoZoom !== null) {
      const d = target - this.prevAutoZoom;
      if (Math.abs(d) > MAX_ZOOM_DELTA) target = this.prevAutoZoom + Math.sign(d) * MAX_ZOOM_DELTA;
    }
    target = Math.round(target * 10) / 10;
    fr.trace(C.NAV, "zoom.auto", { target, speedKmh: Math.round(speed * 3.6) });
    this.prevAutoZoom = target;
    this.prevAutoZoomTime = now;
    return target;
  }
}

export const cameraController = new CameraControllerImpl();
