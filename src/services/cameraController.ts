import { useNavigationStore } from "@/stores/navigationStore";
import { shortestDelta } from "@/utils/headingUtils";
import { computeEdgeFollow } from "@/utils/edgeFollow";

const AUTO_ZOOM_THRESHOLD = 0.3;

/** D-037: Google Maps カメラ API の唯一のインターフェース */
class CameraControllerImpl {
  private map: google.maps.Map | null = null;
  private wheelMode: "pivot" | "native" = "pivot";
  private prevHeading = 0;
  private isDragging = false;
  private isAutoZooming = false;

  init(map: google.maps.Map): void {
    this.map = map;
    this.prevHeading = 0;
    this.isDragging = false;
    this.isAutoZooming = false;
  }
  dispose(): void { this.map = null; }

  /** auto モード: center + heading + zoom を一括制御 (D-032) */
  updateAutoCamera(pos: { lat: number; lng: number }, rawHeading: number, targetZoom: number | null): void {
    if (!this.map) return;
    const mapHeading = this.interpolateHeading(rawHeading);
    let zoomTarget: number | undefined;
    if (targetZoom !== null) {
      const cur = this.map.getZoom() ?? 15;
      if (Math.abs(cur - targetZoom) >= AUTO_ZOOM_THRESHOLD) {
        this.isAutoZooming = true;
        zoomTarget = targetZoom;
      }
    }
    // heading 不変 + zoom 変更なし → panTo（滑らかアニメーション）
    const curHeading = this.map.getHeading() ?? 0;
    if (Math.abs(shortestDelta(curHeading, mapHeading)) < 1 && zoomTarget === undefined) {
      this.map.panTo(pos);
    } else {
      const opts: google.maps.CameraOptions = { center: pos, heading: mapHeading };
      if (zoomTarget !== undefined) opts.zoom = zoomTarget;
      this.map.moveCamera(opts);
    }
  }

  /** free モード: heading 回転 + エッジ追従 (D-036) */
  updateFreeCamera(pos: { lat: number; lng: number }, rawHeading: number): void {
    if (!this.map || this.isDragging) return;
    const mapHeading = this.interpolateHeading(rawHeading);
    const opts: google.maps.CameraOptions = { heading: mapHeading };
    const edgeCenter = computeEdgeFollow(this.map, pos);
    if (edgeCenter) opts.center = edgeCenter;
    if (opts.heading !== undefined || opts.center !== undefined) {
      this.map.moveCamera(opts);
    }
  }

  /** ホイールズーム。true = handled (D-035) */
  wheelZoom(normalizedPixelY: number): boolean {
    if (!this.map) return false;
    const state = useNavigationStore.getState();
    if (state.followMode !== "auto" || this.wheelMode === "native") return false;
    const cur = this.map.getZoom() ?? 15;
    const step = Math.max(-1, Math.min(1, -normalizedPixelY / 400));
    const next = Math.max(1, Math.min(22, cur + step));
    if (next === cur) return true;
    const marker = state.currentPosition;
    if (marker) { this.pivotZoom(marker, next); } else { this.map.setZoom(next); }
    return true;
  }

  /** +/- ボタンからのズーム */
  zoomStep(direction: 1 | -1, step = 0.25): void {
    if (!this.map) return;
    const cur = this.map.getZoom() ?? 15;
    const next = Math.max(1, Math.min(22, cur + direction * step));
    if (next === cur) return;
    const marker = useNavigationStore.getState().currentPosition;
    if (this.wheelMode === "pivot" && marker) { this.pivotZoom(marker, next); }
    else { this.map.setZoom(next); }
  }

  /** ホイール停止後の余韻カット */
  snapCamera(): void {
    if (!this.map) return;
    const z = this.map.getZoom();
    const c = this.map.getCenter();
    if (z != null && c) this.map.moveCamera({ zoom: z, center: c });
  }

  updateScrollwheel(): void {
    if (!this.map) return;
    const auto = useNavigationStore.getState().followMode === "auto";
    this.map.setOptions({ scrollwheel: !auto || this.wheelMode === "native" });
  }

  toggleWheelMode(): "pivot" | "native" {
    this.wheelMode = this.wheelMode === "pivot" ? "native" : "pivot";
    this.updateScrollwheel();
    return this.wheelMode;
  }
  getWheelMode(): "pivot" | "native" { return this.wheelMode; }

  onDragStart(): void { this.isDragging = true; }
  onDragEnd(): void { this.isDragging = false; }

  consumeAutoZoomFlag(): boolean {
    if (this.isAutoZooming) { this.isAutoZooming = false; return true; }
    return false;
  }

  syncHeadingFromMap(): void {
    if (!this.map) return;
    const actual = this.map.getHeading() ?? 0;
    if (Math.abs(shortestDelta(this.prevHeading, actual)) > 10) {
      this.prevHeading = actual;
    }
  }

  private interpolateHeading(rawHeading: number): number {
    const delta = shortestDelta(this.prevHeading, rawHeading);
    this.prevHeading += delta;
    return this.prevHeading;
  }

  private pivotZoom(marker: { lat: number; lng: number }, newZoom: number): void {
    if (!this.map) return;
    const curZoom = this.map.getZoom() ?? 15;
    const center = this.map.getCenter();
    if (!center) { this.map.setZoom(newZoom); return; }
    const scale = Math.pow(2, curZoom - newZoom);
    this.map.setZoom(newZoom);
    this.map.setCenter({
      lat: marker.lat + (center.lat() - marker.lat) * scale,
      lng: marker.lng + (center.lng() - marker.lng) * scale,
    });
  }
}

export const cameraController = new CameraControllerImpl();
