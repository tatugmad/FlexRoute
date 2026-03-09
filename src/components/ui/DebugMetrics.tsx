import type { PerformanceMetric } from "@/types";

type Props = {
  metrics: Record<string, PerformanceMetric>;
};

export function DebugMetrics({ metrics }: Props) {
  const entries = Object.entries(metrics);

  if (entries.length === 0) {
    return <p className="text-slate-500">メトリクスがありません</p>;
  }

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="text-slate-400 border-b border-slate-700">
          <th className="pb-1 pr-2">Label</th>
          <th className="pb-1 pr-2 text-right">Count</th>
          <th className="pb-1 pr-2 text-right">Avg</th>
          <th className="pb-1 pr-2 text-right">Min</th>
          <th className="pb-1 text-right">Max</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([label, m]) => (
          <tr key={label} className="border-b border-slate-800">
            <td className="py-0.5 pr-2 text-indigo-400 truncate max-w-32">
              {label}
            </td>
            <td className="py-0.5 pr-2 text-right text-slate-300">
              {m.count}
            </td>
            <td className="py-0.5 pr-2 text-right text-slate-300">
              {m.avg}ms
            </td>
            <td className="py-0.5 pr-2 text-right text-slate-300">
              {m.min}ms
            </td>
            <td className="py-0.5 text-right text-slate-300">
              {m.max}ms
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
