import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { APP_NAME } from "@/constants/appConfig";
import { createLogConfig } from "@/services/logConfig";
import { flightRecorder } from "@/services/flightRecorder";
import { installSimGeolocation } from "@/services/simGeolocation";
import "../index.css";

document.title = APP_NAME;

// F-LOG v2: ログ設定の初期化（React render 前）
const logConfig = createLogConfig();
flightRecorder.setConsoleLevel(logConfig.consoleLevel);

// SIM パッチ: ?debug パラメータがある場合のみインストール
// React render 前に実行し、PG の watchPosition 呼び出しを確実に捕捉する
if (new URLSearchParams(window.location.search).has('debug')) {
  installSimGeolocation();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
