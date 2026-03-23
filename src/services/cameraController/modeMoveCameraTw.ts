import { Tween, Easing, update as tweenUpdate } from "@tweenjs/tween.js";
import { useNavigationStore } from "@/stores/navigationStore";
import { shortestDelta } from "@/utils/headingUtils";
import { computeEdgeFollow } from "@/utils/edgeFollow";
import type { CameraMode } from "./index";
import { calcPivotCenter, zoomStepFactor, ACCEL_PHASES } from "./utils";

const LONG_PRESS_DELAY = 200;
const FOLLOW_DURATION = 900;
const ZOOM_WHEEL_DURATION = 200;

type TweenState = { lat: number; lng: number; heading: number };

/** Mode MOVE+TW: Tween.js で全パラメータをフレーム補間し moveCamera で適用。 */
export class ModeMoveCameraTw implements CameraMode {
  private wheelMode: "pivot" | "native" = "pivot";
  private isAutoZooming = false;
  private zoomActive = false;
  private zoomDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private zoomStepCount = 0;
  private idleListener: google.maps.MapsEventListener | null = null;
  private positionTween: Tween<TweenState> | null = null;
  private zoomTween: Tween<{ zoom: number }> | null = null;
  private animFrameId: number | null = null;
  private tweenState: TweenState = { lat: 0, lng: 0, heading: 0 };

  init(map: google.maps.Map): void {
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
  }

  applyPosition(map: google.maps.Map, pos: { lat: number; lng: number },
    mapHeading: number, followMode: "auto" | "free",
    isDragging: boolean, zoomTarget: number | null): void {
    if (followMode === "auto") {
      const center = map.getCenter();
      const from: TweenState = {
        lat: center?.lat() ?? pos.lat,
        lng: center?.lng() ?? pos.lng,
        heading: map.getHeading() ?? 0,
      };
      const delta = shortestDelta(from.heading, mapHeading);
      const to: TweenState = { lat: pos.lat, lng: pos.lng, heading: from.heading + delta };

      this.positionTween?.stop();
      this.tweenState = { ...from };
      this.positionTween = new Tween(this.tweenState)
        .to(to, FOLLOW_DURATION)
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => {
          map.moveCamera({
            center: { lat: this.tweenState.lat, lng: this.tweenState.lng },
            heading: this.tweenState.heading,
          });
        })
        .start();

      if (zoomTarget !== null) {
        this.isAutoZooming = true;
        this.zoomTween?.stop();
        const zoomState = { zoom: map.getZoom() ?? 15 };
        this.zoomTween = new Tween(zoomState)
          .to({ zoom: zoomTarget }, FOLLOW_DURATION)
          .easing(Easing.Quadratic.Out)
          .onUpdate(() => map.moveCamera({ zoom: zoomState.zoom }))
          .start();
      }
      this.ensureAnimLoop();
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
    if (marker) {
      const center = map.getCenter();
      const nc = calcPivotCenter(
        { lat: center!.lat(), lng: center!.lng() }, marker, cur, next,
      );
      this.positionTween?.stop();
      const tweenObj = { lat: center!.lat(), lng: center!.lng(), zoom: cur };
      new Tween(tweenObj)
        .to({ lat: nc.lat, lng: nc.lng, zoom: next }, ZOOM_WHEEL_DURATION)
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => map.moveCamera({
          center: { lat: tweenObj.lat, lng: tweenObj.lng }, zoom: tweenObj.zoom,
        }))
        .start();
      this.ensureAnimLoop();
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

  toggleWheelMode(map: google.maps.Map): "pivot" | "native" {
    this.wheelMode = this.wheelMode === "pivot" ? "native" : "pivot";
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
    return this.wheelMode;
  }

  getWheelMode(): "pivot" | "native" { return this.wheelMode; }

  dispose(): void {
    this.positionTween?.stop();
    this.zoomTween?.stop();
    if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
    if (this.zoomDelayTimer) { clearTimeout(this.zoomDelayTimer); this.zoomDelayTimer = null; }
    this.zoomActive = false;
    if (this.idleListener) { google.maps.event.removeListener(this.idleListener); this.idleListener = null; }
  }

  private ensureAnimLoop(): void {
    if (this.animFrameId !== null) return;
    const loop = (time: number) => {
      tweenUpdate(time);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private applyZoomStep(map: google.maps.Map, direction: 1 | -1, baseStep: number): void {
    const curZoom = map.getZoom() ?? 15;
    const step = baseStep * zoomStepFactor(curZoom, direction);
    const next = Math.max(1, Math.min(22, curZoom + direction * step));
    if (next === curZoom) return;
    const marker = useNavigationStore.getState().currentPosition;
    if (this.wheelMode === "pivot" && marker) {
      const center = map.getCenter();
      const nc = calcPivotCenter(
        { lat: center!.lat(), lng: center!.lng() }, marker, curZoom, next,
      );
      const tweenObj = { lat: center!.lat(), lng: center!.lng(), zoom: curZoom };
      new Tween(tweenObj)
        .to({ lat: nc.lat, lng: nc.lng, zoom: next }, ZOOM_WHEEL_DURATION)
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => map.moveCamera({
          center: { lat: tweenObj.lat, lng: tweenObj.lng }, zoom: tweenObj.zoom,
        }))
        .start();
      this.ensureAnimLoop();
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
