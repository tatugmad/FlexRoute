/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __DEV_VERSION__: string;
