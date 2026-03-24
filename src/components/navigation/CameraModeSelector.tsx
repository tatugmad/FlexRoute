import { useState } from "react";
import { cameraController } from "@/services/cameraController";

const MODES_ROW1 = ["ORG", "SETTER", "SET+PAN", "MOVE", "MOVE+TW"] as const;
const MODES_ROW2 = ["ORG2", "SETTER2", "SET+PAN2", "MOVE2", "MOVE+TW2"] as const;
const MODES_ROW3 = ["MOVE+TW3"] as const;

export function CameraModeSelector() {
  const [current, setCurrent] = useState(cameraController.getMode());

  const renderButton = (m: string) => (
    <button
      key={m}
      onClick={() => {
        cameraController.setMode(m);
        setCurrent(m);
      }}
      className={`px-2 h-7 flex items-center justify-center font-bold select-none transition-colors whitespace-nowrap ${
        current === m
          ? "bg-indigo-600 text-white"
          : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
      }`}
    >
      {m}
    </button>
  );

  return (
    <div className="absolute left-4 bottom-36 z-10 pointer-events-auto bg-white/90 rounded-lg shadow-lg overflow-hidden text-xs">
      <div className="flex">{MODES_ROW1.map(renderButton)}</div>
      <div className="flex border-t border-slate-200">{MODES_ROW2.map(renderButton)}</div>
      <div className="flex border-t border-slate-200">{MODES_ROW3.map(renderButton)}</div>
    </div>
  );
}
