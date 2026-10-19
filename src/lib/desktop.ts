/**
 * Phase 4 — Desktop host detection.
 * Returns true when the app is running inside the Tauri webview.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function getHostInfo(): Promise<{ mode: string; version: string; daemon_running: boolean } | null> {
  if (!isTauri()) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('host_info');
  } catch {
    return null;
  }
}

export async function setDaemonRunning(running: boolean): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('daemon_set', { running });
  } catch {
    return false;
  }
}
