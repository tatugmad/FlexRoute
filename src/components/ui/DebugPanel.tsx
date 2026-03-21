import { useState, useCallback } from "react";
import { createLogConfig } from "@/services/logConfig";
import { flightRecorder } from "@/services/flightRecorder";
import { toLevelName, toCategoryName } from "@/services/logFormatters";
import { LOG_LEVELS } from "@/types/log";
import type { LogLevelName } from "@/types/log";

export function DebugPanel() {
  const config = createLogConfig();
  if (!config.isDebugPanelEnabled) return null;
  return <DebugPanelInner />;
}

const LEVEL_NAMES: LogLevelName[] = ["trace", "debug", "info", "warn", "error"];

const LEVEL_COLORS: Record<string, string> = {
  trace: "text-gray-500",
  debug: "text-gray-400",
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

function DebugPanelInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState(0);
  const [, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const handleCopy = useCallback(async () => {
    const entries = flightRecorder.dump();
    await navigator.clipboard.writeText(JSON.stringify(entries, null, 2));
  }, []);

  const handleClear = useCallback(() => {
    flightRecorder.clear();
    refresh();
  }, [refresh]);

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); refresh(); }}
        className="fixed bottom-4 right-4 z-50 bg-slate-900/95 text-white text-xs font-mono px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
      >
        Debug
      </button>
    );
  }

  const entries = flightRecorder.getRecent(200);
  const filtered = entries.filter((e) => e.level >= levelFilter);
  const startWall = flightRecorder.getStartWall();

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-96 bg-slate-900/95 text-white rounded-xl shadow-2xl flex flex-col font-mono text-xs overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <div className="flex gap-1">
          {LEVEL_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => { setLevelFilter(LOG_LEVELS[name]); refresh(); }}
              className={`px-2 py-0.5 rounded ${levelFilter === LOG_LEVELS[name] ? "bg-indigo-600" : "hover:bg-slate-700"}`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={handleCopy} className="px-2 py-0.5 hover:bg-slate-700 rounded">Copy</button>
          <button onClick={handleClear} className="px-2 py-0.5 hover:bg-slate-700 rounded">Clear</button>
          <button onClick={() => setIsOpen(false)} className="px-2 py-0.5 hover:bg-slate-700 rounded">x</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-0.5">
        {[...filtered].reverse().map((entry, i) => {
          const levelName = toLevelName(entry.level);
          const catName = toCategoryName(entry.cat);
          const wall = new Date(startWall + entry.t);
          const hh = String(wall.getHours()).padStart(2, "0");
          const mm = String(wall.getMinutes()).padStart(2, "0");
          const ss = String(wall.getSeconds()).padStart(2, "0");
          const dataStr = entry.data != null
            ? " " + JSON.stringify(entry.data).slice(0, 50)
            : "";
          return (
            <div key={i} className={LEVEL_COLORS[levelName] ?? "text-gray-400"}>
              [{hh}:{mm}:{ss}] {levelName.toUpperCase()} [{catName}] {entry.tag}{dataStr}
            </div>
          );
        })}
      </div>
    </div>
  );
}
