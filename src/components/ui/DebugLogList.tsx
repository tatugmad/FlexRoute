import type { LogEntry, UserAction } from "@/types";

const LEVEL_COLORS: Record<string, string> = {
  debug: "text-gray-400",
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

type Props =
  | { entries: LogEntry[]; actions?: never }
  | { entries?: never; actions: UserAction[] };

export function DebugLogList({ entries, actions }: Props) {
  if (entries) {
    if (entries.length === 0) {
      return <p className="text-slate-500">ログがありません</p>;
    }
    return (
      <div className="space-y-0.5">
        {entries.map((e, i) => (
          <div key={i} className="flex gap-1.5">
            <span className="text-slate-500 shrink-0">
              {e.timestamp.slice(11, 19)}
            </span>
            <span className={`shrink-0 ${LEVEL_COLORS[e.level] ?? ""}`}>
              {e.level.toUpperCase().padEnd(5)}
            </span>
            <span className="text-indigo-400 shrink-0">[{e.category}]</span>
            <span className="text-slate-200 truncate">{e.message}</span>
          </div>
        ))}
      </div>
    );
  }

  if (actions) {
    if (actions.length === 0) {
      return <p className="text-slate-500">操作履歴がありません</p>;
    }
    return (
      <div className="space-y-0.5">
        {actions.map((a, i) => (
          <div key={i} className="flex gap-1.5">
            <span className="text-slate-500 shrink-0">
              {a.timestamp.slice(11, 19)}
            </span>
            <span className="text-emerald-400 shrink-0">{a.action}</span>
            {a.detail !== undefined && (
              <span className="text-slate-400 truncate">
                {JSON.stringify(a.detail)}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
