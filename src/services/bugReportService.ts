import { flightRecorder } from "./flightRecorder";
import { APP_VERSION } from "@/constants/appVersion";
import { LOG_CATEGORIES as C } from "@/types/log";

export async function captureBugReport(): Promise<void> {
  let screenshotDataUrl: string | null = null;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      scale: 1,
      logging: false,
    });
    screenshotDataUrl = canvas.toDataURL("image/png");
  } catch {
    screenshotDataUrl = null;
  }

  const entries = flightRecorder.dump();

  const meta = {
    timestamp: new Date().toISOString(),
    appVersion: APP_VERSION,
    url: window.location.href,
    userAgent: navigator.userAgent,
    screen: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
  };

  const bundle = {
    meta,
    screenshot: screenshotDataUrl,
    entryCount: entries.length,
    entries,
  };

  const blob = new Blob(
    [JSON.stringify(bundle, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.download = `flexroute-bug-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  flightRecorder.info(C.UI, "bugReport.captured", {
    entryCount: entries.length,
    hasScreenshot: screenshotDataUrl !== null,
  });
}
