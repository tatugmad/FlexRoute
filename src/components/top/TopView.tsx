import { RouteList } from "@/components/top/RouteList";
import { useUiStore } from "@/stores/uiStore";
import type { TopTab } from "@/types";

const TABS: { key: TopTab; label: string }[] = [
  { key: "routes", label: "ルート" },
  { key: "labels", label: "ラベル" },
  { key: "places", label: "場所" },
];

export function TopView() {
  const topTab = useUiStore((s) => s.topTab);
  const setTopTab = useUiStore((s) => s.setTopTab);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50">
      <header className="bg-indigo-600 text-white px-4 pt-5 pb-4">
        <h1 className="text-xl font-bold tracking-tight mb-4">FlexRoute</h1>
        <TabBar current={topTab} onChange={setTopTab} />
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        {topTab === "routes" && <RouteList />}
        {topTab === "labels" && <PlaceholderTab label="ラベル" />}
        {topTab === "places" && <PlaceholderTab label="場所" />}
      </div>
    </div>
  );
}

function TabBar({
  current,
  onChange,
}: {
  current: TopTab;
  onChange: (tab: TopTab) => void;
}) {
  const active = "bg-white text-indigo-600 shadow-sm";
  const inactive = "text-slate-500 hover:text-slate-700";

  return (
    <div className="flex bg-slate-200/70 p-1 rounded-xl shadow-inner">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
            current === tab.key ? active : inactive
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <p className="text-sm">{label}機能は準備中です</p>
    </div>
  );
}
