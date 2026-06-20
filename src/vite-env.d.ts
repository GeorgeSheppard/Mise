/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Backend API base URL
  readonly VITE_API_BASE_URL: string;

  // Frontend app URL (for auth redirects, etc.)
  readonly VITE_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
