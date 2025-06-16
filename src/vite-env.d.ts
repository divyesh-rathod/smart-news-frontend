/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_VERSION: string;
    readonly VITE_ENABLE_DEV_TOOLS: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }