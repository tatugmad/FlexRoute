import { cameraController } from "@/services/cameraController";

export function ZoomInOutButtons() {
  return (
    <div className="absolute left-4 bottom-20 z-10 pointer-events-auto bg-white/90 rounded-xl shadow-lg flex flex-col overflow-hidden">
      <button
        onPointerDown={() => cameraController.onZoomButtonDown(1)}
        onPointerUp={() => cameraController.onZoomButtonUp()}
        onPointerLeave={() => cameraController.onZoomButtonUp()}
        className="w-10 h-10 flex items-center justify-center text-slate-600 text-lg font-bold hover:bg-slate-100 active:bg-slate-200 select-none"
      >+</button>
      <div className="border-t border-slate-200" />
      <button
        onPointerDown={() => cameraController.onZoomButtonDown(-1)}
        onPointerUp={() => cameraController.onZoomButtonUp()}
        onPointerLeave={() => cameraController.onZoomButtonUp()}
        className="w-10 h-10 flex items-center justify-center text-slate-600 text-lg font-bold hover:bg-slate-100 active:bg-slate-200 select-none"
      >-</button>
    </div>
  );
}
