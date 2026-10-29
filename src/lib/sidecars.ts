/**
 * Same-origin sidecar URLs.
 * The desk proxies C++ (:1234), Python (:8001) and the Phase-1 bus (:8765)
 * through the dev server so the preview and a local checkout share one link.
 * Tauri keeps the direct ports — there is no Vite proxy in the webview.
 */
import { isTauri } from './desktop';

export function linkSidecarEndpoint(endpoint: string): string {
  if (typeof window === 'undefined') return endpoint;
  if (isTauri() || window.location.protocol === 'file:') return endpoint;

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return endpoint;
  }

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  if (url.port === '8001' || url.pathname === '/ws/sidecar') {
    return `${proto}//${host}/ws/sidecar`;
  }
  if (url.port === '1234' || url.pathname.startsWith('/ipc/')) {
    return `${proto}//${host}${url.pathname}`;
  }
  if (url.port === '8765') {
    return `${proto}//${host}/ws/bus`;
  }
  return endpoint;
}
