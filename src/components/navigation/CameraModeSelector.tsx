import { useState } from "react";
import { cameraController } from "@/services/cameraController";

const MODES = ["ORG", "SETTER", "SET+PAN", "MOVE", "MOVE+TW"] as const;

export function CameraModeSelector() {
  const [current, setCurrent] = useState(cameraController.getMode());

  return (
    <div className="absolute left-4 bottom-36 z-10 pointer-events-auto flex bg-white/90 rounded-lg shadow-lg overflow-hidden text-xs">
      {MODES.map((m) => (
        <button
          key={m}
          onClick={() => {
            cameraController.setMode(m);
            setCurrent(m);
          }}
          className={`px-2 h-8 flex items-center justify-center font-bold select-none transition-colors whitespace-nowrap ${
            current === m
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
