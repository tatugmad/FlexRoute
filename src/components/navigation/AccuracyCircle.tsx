import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useNavigationStore } from "@/stores/navigationStore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PulseOverlayClass: any = null;

function getPulseOverlayClass() {
  if (PulseOverlayClass) return PulseOverlayClass;

  class PulseOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null;
    private position: google.maps.LatLng;
    private radiusMeters: number;

    constructor(position: google.maps.LatLng, radiusMeters: number) {
      super();
      this.position = position;
      this.radiusMeters = radiusMeters;
    }

    onAdd() {
      this.div = document.createElement("div");
      this.div.style.position = "absolute";
      this.div.style.pointerEvents = "none";

      const ring = document.createElement("div");
      ring.style.position = "absolute";
      ring.style.borderRadius = "50%";
      ring.style.background = "rgba(255, 255, 255, 0.65)";
      ring.style.border = "2.5px solid rgba(96, 165, 250, 0.6)";
      ring.style.animation = "pulseExpand 2s ease-out infinite";
      this.div.appendChild(ring);

      if (!document.getElementById("pulse-ring-style")) {
        const style = document.createElement("style");
        style.id = "pulse-ring-style";
        style.textContent = `
          @keyframes pulseExpand {
            0% { transform: scale(0.25); opacity: 0.7; }
            100% { transform: scale(1); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(this.div);
    }

    draw() {
      if (!this.div) return;
      const projection = this.getProjection();
      if (!projection) return;

      const center = projection.fromLatLngToDivPixel(this.position);
      if (!center) return;

      const earthRadius = 6371000;
      const latRad = (this.position.lat() * Math.PI) / 180;
      const deltaLng =
        (this.radiusMeters / (earthRadius * Math.cos(latRad))) *
        (180 / Math.PI);
      const edgePoint = new google.maps.LatLng(
        this.position.lat(),
        this.position.lng() + deltaLng,
      );
      const edgePixel = projection.fromLatLngToDivPixel(edgePoint);
      if (!edgePixel) return;

      const pixelRadius = Math.abs(edgePixel.x - center.x);
      const diameter = pixelRadius * 2;

      this.div.style.left = center.x - pixelRadius + "px";
      this.div.style.top = center.y - pixelRadius + "px";
      this.div.style.width = diameter + "px";
      this.div.style.height = diameter + "px";

      const ring = this.div.firstChild as HTMLDivElement;
      if (ring) {
        ring.style.width = diameter + "px";
        ring.style.height = diameter + "px";
      }
    }

    onRemove() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    }

    updatePosition(position: google.maps.LatLng) {
      this.position = position;
      this.draw();
    }

    updateRadius(radiusMeters: number) {
      this.radiusMeters = radiusMeters;
      this.draw();
    }
  }

  PulseOverlayClass = PulseOverlay;
  return PulseOverlayClass;
}

export function AccuracyCircle() {
  const map = useMap();
  const accuracy = useNavigationStore((s) => s.accuracy);
  const position = useNavigationStore((s) => s.currentPosition);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !position || !accuracy) {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
      return;
    }

    const latLng = new google.maps.LatLng(position.lat, position.lng);

    if (!overlayRef.current) {
      const Cls = getPulseOverlayClass();
      overlayRef.current = new Cls(latLng, accuracy);
      overlayRef.current.setMap(map);
    } else {
      overlayRef.current.updatePosition(latLng);
      overlayRef.current.updateRadius(accuracy);
    }
  }, [map, position, accuracy]);

  useEffect(() => {
    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, []);

  return null;
}
