import { Tween, Easing, Group } from "@tweenjs/tween.js";
import { useNavigationStore } from "@/stores/navigationStore";
import { shortestDelta } from "@/utils/headingUtils";
import { computeEdgeFollow } from "@/utils/edgeFollow";
import type { CameraMode } from "./index";
import { calcPivotCenter, calcRotationPivotCenter, zoomStepFactor, ACCEL_PHASES } from "./utils";

const LONG_PRESS_DELAY = 200;
const ZOOM_WHEEL_DURATION = 200;

type CenterTweenState = { lat: number; lng: number };

/** Mode MOVE+TW3: center-first / heading-deferred 方式。
 *  center の Tween 中は heading を変えず、次の position 更新時に前回の heading を即時適用する。 */
export class ModeMoveCameraTw3 implements CameraMode {
  private wheelMode: "pivot" | "native" = "pivot";
  private prevHeading = 0;
  private isAutoZooming = false;
  private zoomActive = false;
  private zoomDelayTimer: ReturnType<typeof setTimeout> | null = null;
  private zoomStepCount = 0;
  private idleListener: google.maps.MapsEventListener | null = null;
  private positionTween: Tween<CenterTweenState> | null = null;
  private headingTween: Tween<{ heading: number }> | null = null;
  private zoomTween: Tween<{ zoom: number }> | null = null;
  private animFrameId: number | null = null;
  private tweenState: CenterTweenState = { lat: 0, lng: 0 };
  private tweenGroup = new Group();
  private pendingHeading: number | null = null;

  init(map: google.maps.Map): void {
    const auto = useNavigationStore.getState().followMode === "auto";
    map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
    this.prevHeading = map.getHeading() ?? 0;
  }

  applyPosition(map: google.maps.Map, pos: { lat: number; lng: number },
    mapHeading: number, followMode: "auto" | "free",
    isDragging: boolean, zoomTarget: number | null): void {
    const dur = (window as any).__followDuration ?? 900;

    if (followMode === "auto") {
      // 1. 前回保留していた heading があれば Tween で補間適用
      this.headingTween?.stop();
      if (this.pendingHeading !== null) {
        const fromH = map.getHeading() ?? 0;
        const deltaH = shortestDelta(fromH, this.pendingHeading);
        const hdgObj = { heading: fromH };
        this.headingTween = new Tween(hdgObj);
        this.tweenGroup.add(this.headingTween);
        this.headingTween
          .to({ heading: fromH + deltaH }, dur)
          .easing(Easing.Quadratic.Out)
          .onUpdate(() => {
            if (useNavigationStore.getState().followMode !== "auto") return;
            map.moveCamera({ heading: hdgObj.heading });
          })
          .start();
      }
      // 2. 今回の heading を保留
      this.pendingHeading = mapHeading;
      this.prevHeading = mapHeading;

      // 3. center のみ Tween で移動
      const center = map.getCenter();
      const from: CenterTweenState = {
        lat: center?.lat() ?? pos.lat,
        lng: center?.lng() ?? pos.lng,
      };

      this.positionTween?.stop();
      this.tweenState = { ...from };
      this.positionTween = new Tween(this.tweenState);
      this.tweenGroup.add(this.positionTween);
      this.positionTween
        .to({ lat: pos.lat, lng: pos.lng }, dur)
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => {
          if (useNavigationStore.getState().followMode !== "auto") return;
          map.moveCamera({
            center: { lat: this.tweenState.lat, lng: this.tweenState.lng },
          });
        })
        .start();

      // 4. zoom は別 Tween
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
      const headingDelta = mapHeading - this.prevHeading;
      this.prevHeading = mapHeading;
      const center = map.getCenter();
      const from = {
        lat: center?.lat() ?? pos.lat,
        lng: center?.lng() ?? pos.lng,
        heading: map.getHeading() ?? 0,
      };
      let targetCenter: { lat: number; lng: number };
      const edgeCenter = computeEdgeFollow(map, pos);
      if (edgeCenter) {
        targetCenter = edgeCenter;
      } else if (Math.abs(headingDelta) >= 0.01 && center) {
        targetCenter = calcRotationPivotCenter(
          { lat: center.lat(), lng: center.lng() }, pos, headingDelta,
        );
      } else {
        targetCenter = { lat: from.lat, lng: from.lng };
      }
      const delta = shortestDelta(from.heading, mapHeading);
      const to = {
        lat: targetCenter.lat,
        lng: targetCenter.lng,
        heading: from.heading + delta,
      };
      this.positionTween?.stop();
      const tweenObj = { lat: from.lat, lng: from.lng };
      this.tweenState = { ...tweenObj };
      const headingTweenObj = { heading: from.heading };
      this.positionTween = new Tween(tweenObj);
      this.tweenGroup.add(this.positionTween);
      const headingTween = new Tween(headingTweenObj);
      this.tweenGroup.add(headingTween);
      this.positionTween
        .to({ lat: to.lat, lng: to.lng }, 900)
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => {
          map.moveCamera({
            center: { lat: tweenObj.lat, lng: tweenObj.lng },
            heading: headingTweenObj.heading,
          });
        })
        .start();
      headingTween
        .to({ heading: to.heading }, 900)
        .easing(Easing.Quadratic.Out)
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
    this.headingTween?.stop();
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
    this.headingTween?.stop();
    this.zoomTween?.stop();
    if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
    if (this.zoomDelayTimer) { clearTimeout(this.zoomDelayTimer); this.zoomDelayTimer = null; }
    this.zoomActive = false;
    if (this.idleListener) { google.maps.event.removeListener(this.idleListener); this.idleListener = null; }
    this.tweenGroup.removeAll();
    this.pendingHeading = null;
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
