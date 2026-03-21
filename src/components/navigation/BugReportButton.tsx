import { useState } from "react";
import { captureBugReport } from "@/services/bugReportService";

export function BugReportButton() {
  const [capturing, setCapturing] = useState(false);

  const handleClick = async () => {
    setCapturing(true);
    try {
      await captureBugReport();
    } catch (e) {
      console.error("Bug report capture failed:", e);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={capturing}
      className="fixed left-4 bottom-4 z-50 w-10 h-10 bg-rose-500/80 hover:bg-rose-600 rounded-full shadow-lg text-white text-xs font-bold pointer-events-auto disabled:opacity-50"
    >
      {capturing ? "..." : "Bug"}
    </button>
  );
}
