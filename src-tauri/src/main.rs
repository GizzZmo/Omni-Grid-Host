// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

#[derive(Default)]
struct DaemonState {
    running: Mutex<bool>,
}

#[derive(Serialize)]
struct HostInfo {
    mode: String,
    version: String,
    daemon_running: bool,
}

#[tauri::command]
fn host_info(state: State<DaemonState>) -> HostInfo {
    HostInfo {
        mode: "tauri".into(),
        version: "3.0.0".into(),
        daemon_running: *state.running.lock().unwrap(),
    }
}

#[tauri::command]
fn daemon_set(running: bool, state: State<DaemonState>) -> bool {
    *state.running.lock().unwrap() = running;
    // In a later step this can spawn the real Node/Python sidecar via tauri_plugin_shell
    println!("[Tauri] daemon running = {}", running);
    running
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(DaemonState::default())
        .invoke_handler(tauri::generate_handler![host_info, daemon_set])
        .setup(|_app| {
            println!("[Tauri] Omni-Grid Host Phase 4 starting");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
