/**
 * Entry point per il bundle dell'estensione Chrome.
 * Genera `extension/api-client.js` (IIFE) con:
 *   npm run build:extension-api
 *
 * Il sidepanel lo usa così:
 *   const api = window.SemplycodeAPI.createApiClient({
 *     baseUrl: () => API_BASE,
 *     getToken: () => currentToken,
 *     onUnauthorized: () => { /* sessione scaduta *\/ },
 *   });
 */
import { createApiClient } from './apiClient';

declare global {
  interface Window {
    SemplycodeAPI: { createApiClient: typeof createApiClient };
  }
}

window.SemplycodeAPI = { createApiClient };
