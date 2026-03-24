import { Tween, Easing, Group } from "@tweenjs/tween.js";
import { useNavigationStore } from "@/stores/navigationStore";
import { shortestDelta } from "@/utils/headingUtils";
import { computeEdgeFollow } from "@/utils/edgeFollow";
import type { CameraMode } from "./index";
import { calcPivotCenter, zoomStepFactor, ACCEL_PHASES, deriveCenter } from "./utils";

const LONG_PRESS_DELAY = 200;
const ZOOM_WHEEL_DURATION = 200;

/** Mode MOVE+TW2: Tween.js + heading-master 方式。heading を Tween で補間し center を毎フレーム導出。 */
export class ModeMoveCameraTw2 implements CameraMode {
  private wheelMode: "pivot" | "native" = "pivot";
  private isAutoZooming = false;
  private zoomActive = false;
  private zoomDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private zoomStepCount = 0;
  private idleListener: google.maps.MapsEventListener | null = null;
  private positionTween: Tween<{ heading: number; t: number }> | null = null;
  private zoomTween: Tween<{ zoom: number }> | null = null;
  private animFrameId: number | null = null;
  private tweenGroup = new Group();

  init(map: google.maps.Map): void {
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
  }

  applyPosition(map: google.maps.Map, pos: { lat: number; lng: number },
    mapHeading: number, followMode: "auto" | "free",
    isDragging: boolean, zoomTarget: number | null): void {
    const dur = (window as any).__followDurationMode === "manual"
      ? ((window as any).__followDuration ?? 900)
      : ((window as any).__measuredInterval ?? 900);
    if (followMode === "auto") {

      const center = map.getCenter();
      const fromHeading = map.getHeading() ?? 0;
      const startCenter = center
        ? { lat: center.lat(), lng: center.lng() }
        : pos;
      const startPos = { ...startCenter }; // 近似: 現在の center ≈ 前の GPS 位置
      const delta = shortestDelta(fromHeading, mapHeading);
      const toHeading = fromHeading + delta;

      this.positionTween?.stop();
      const tweenObj = { heading: fromHeading, t: 0 };
      this.positionTween = new Tween(tweenObj);
      this.tweenGroup.add(this.positionTween);
      this.positionTween
        .to({ heading: toHeading, t: 1 }, dur)
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => {
          if (useNavigationStore.getState().followMode !== "auto") return;
          const c = deriveCenter(
            startCenter, startPos, pos, pos,
            fromHeading, tweenObj.heading, tweenObj.t,
          );
          map.moveCamera({ center: c, heading: tweenObj.heading });
        })
        .start();

      // zoom は別 Tween（v1 と同一）
      if (zoomTarget !== null) {
        this.isAutoZooming = true;
        this.zoomTween?.stop();
        const zoomState = { zoom: map.getZoom() ?? 15 };
        this.zoomTween = new Tween(zoomState);
        this.tweenGroup.add(this.zoomTween);
        this.zoomTween
          .to({ zoom: zoomTarget }, dur)
          .easing(Easing.Quadratic.Out)
          .onUpdate(() => {
            if (useNavigationStore.getState().followMode !== "auto") return;
            map.moveCamera({ zoom: zoomState.zoom });
          })
          .onComplete(() => {
            this.isAutoZooming = false;
          })
          .start();
      }
      this.ensureAnimLoop();
    } else {
      if (isDragging) return;

      const center = map.getCenter();
      const fromHeading = map.getHeading() ?? 0;
      const startCenter = center
        ? { lat: center.lat(), lng: center.lng() }
        : pos;
      const delta = shortestDelta(fromHeading, mapHeading);
      const edgeCenter = computeEdgeFollow(map, pos);

      if (Math.abs(delta) >= 0.01 || edgeCenter || zoomTarget !== null) {
        const toHeading = fromHeading + delta;
        this.positionTween?.stop();
        const tweenObj = { heading: fromHeading, t: 0 };
        this.positionTween = new Tween(tweenObj);
        this.tweenGroup.add(this.positionTween);
        this.positionTween
          .to({ heading: toHeading, t: 1 }, dur)
          .easing(Easing.Quadratic.Out)
          .onUpdate(() => {
            const c = deriveCenter(
              startCenter, pos, pos, pos,
              fromHeading, tweenObj.heading, tweenObj.t,
            );
            // edgeCenter がある場合は回転ピボット + エッジを合成
            let finalCenter = c;
            if (edgeCenter) {
              finalCenter = {
                lat: c.lat + (edgeCenter.lat - startCenter.lat) * tweenObj.t,
                lng: c.lng + (edgeCenter.lng - startCenter.lng) * tweenObj.t,
              };
            }
            map.moveCamera({ center: finalCenter, heading: tweenObj.heading });
          })
          .start();
        if (zoomTarget !== null) {
          this.isAutoZooming = true;
          this.zoomTween?.stop();
          const zoomState = { zoom: map.getZoom() ?? 15 };
          this.zoomTween = new Tween(zoomState);
          this.tweenGroup.add(this.zoomTween);
          this.zoomTween
            .to({ zoom: zoomTarget }, dur)
            .easing(Easing.Quadratic.Out)
            .onUpdate(() => {
              map.moveCamera({ zoom: zoomState.zoom });
            })
            .onComplete(() => {
              this.isAutoZooming = false;
            })
            .start();
        }
        this.ensureAnimLoop();
      }
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
      const tween = new Tween(tweenObj);
      this.tweenGroup.add(tween);
      tween
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

  onDragStart(): void {
    this.positionTween?.stop();
    this.zoomTween?.stop();
  }

  onMapZoomChanged(): boolean {
    return this.isAutoZooming;
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
    this.tweenGroup.removeAll();
  }

  private ensureAnimLoop(): void {
    if (this.animFrameId !== null) return;
    const loop = (time: number) => {
      this.tweenGroup.update(time);
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
      const tween = new Tween(tweenObj);
      this.tweenGroup.add(tween);
      tween
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
