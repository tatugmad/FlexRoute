import { APP_VERSION } from "@/constants/appVersion";
import { APP_NAME } from "@/constants/appConfig";
import { RouteList } from "@/components/top/RouteList";
import { LabelList } from "@/components/top/LabelList";
import { PlaceList } from "@/components/top/PlaceList";
import { QrCodePopover } from "@/components/ui/QrCodePopover";
import { LabelEditModal } from "@/components/ui/LabelEditModal";
import { PlaceDetailModal } from "@/components/places/PlaceDetailModal";
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
      <header className="bg-indigo-600 text-white px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">{APP_NAME}</h1>
          <span className="text-xs text-indigo-300 font-mono">v{APP_VERSION} ({__DEV_VERSION__})</span>
          <QrCodePopover />
        </div>
      </header>

      <TabBar current={topTab} onChange={setTopTab} />

      <div className="flex-1 overflow-y-auto bg-slate-50">
        {topTab === "routes" && <RouteList />}
        {topTab === "labels" && <LabelList />}
        {topTab === "places" && <PlaceList />}
      </div>

      <LabelEditModal />
      <PlaceDetailModal />
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
  return (
    <div className="flex bg-white border-b border-slate-300">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 py-3 text-base font-bold transition-colors relative ${
            current === tab.key
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-600"
          }`}
        >
          {tab.label}
          {current === tab.key && (
            <span className="absolute bottom-0 left-0 right-0 h-[4px] bg-indigo-600 rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}
