/**
 * Phase 4 — Desktop host detection.
 * Returns true when the app is running inside the Tauri webview.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function loadTauriInvoke(): Promise<((cmd: string, args?: unknown) => Promise<any>) | null> {
  if (!isTauri()) return null;
  try {
    // @vite-ignore prevents Vite from statically resolving the optional Tauri package
    const mod = await import(/* @vite-ignore */ '@tauri-apps/api/core');
    return mod.invoke;
  } catch {
    return null;
  }
}

export async function getHostInfo(): Promise<{ mode: string; version: string; daemon_running: boolean } | null> {
  const invoke = await loadTauriInvoke();
  if (!invoke) return null;
  try {
    return await invoke('host_info');
  } catch {
    return null;
  }
}

export async function setDaemonRunning(running: boolean): Promise<boolean> {
  const invoke = await loadTauriInvoke();
  if (!invoke) return false;
  try {
    return await invoke('daemon_set', { running });
  } catch {
    return false;
  }
}
