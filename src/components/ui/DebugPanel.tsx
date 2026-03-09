import { useState, useCallback } from "react";
import { logService } from "@/services/logService";
import { userActionTracker } from "@/services/userActionTracker";
import { performanceMonitor } from "@/services/performanceMonitor";
import { DebugLogList } from "./DebugLogList";
import { DebugMetrics } from "./DebugMetrics";

export function DebugPanel() {
  if (!import.meta.env.DEV) return null;

  return <DebugPanelInner />;
}

function DebugPanelInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"logs" | "actions" | "perf">("logs");
  const [, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const handleCopy = useCallback(async () => {
    const data = {
      logs: JSON.parse(logService.exportLogs()),
      actions: JSON.parse(userActionTracker.exportActions()),
      metrics: performanceMonitor.getMetrics(),
    };
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  }, []);

  const handleClear = useCallback(() => {
    logService.clear();
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

  const tabs = [
    { key: "logs" as const, label: "Logs" },
    { key: "actions" as const, label: "Actions" },
    { key: "perf" as const, label: "Perf" },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-96 bg-slate-900/95 text-white rounded-xl shadow-2xl flex flex-col font-mono text-xs overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); refresh(); }}
              className={`px-2 py-0.5 rounded ${tab === t.key ? "bg-indigo-600" : "hover:bg-slate-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={handleCopy} className="px-2 py-0.5 hover:bg-slate-700 rounded">Copy</button>
          <button onClick={handleClear} className="px-2 py-0.5 hover:bg-slate-700 rounded">Clear</button>
          <button onClick={() => setIsOpen(false)} className="px-2 py-0.5 hover:bg-slate-700 rounded">x</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {tab === "logs" && <DebugLogList entries={logService.getRecentLogs(100)} />}
        {tab === "actions" && <DebugLogList actions={userActionTracker.getRecentActions(100)} />}
        {tab === "perf" && <DebugMetrics metrics={performanceMonitor.getMetrics()} />}
      </div>
    </div>
  );
}
