mod commands;
mod storage;

use std::path::PathBuf;
use storage::StorageEngine;

fn get_data_dir() -> PathBuf {
    dirs::home_dir()
        .expect("could not find home directory")
        .join("daily-canvas")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let data_dir = get_data_dir();
    let storage = StorageEngine::new(data_dir).expect("failed to initialize storage");

    tauri::Builder::default()
        .manage(storage)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_canvas,
            commands::load_canvas,
            commands::get_or_create_day_canvas,
            commands::create_canvas,
            commands::list_canvases_by_date,
            commands::list_recent_canvases,
            commands::delete_canvas,
            commands::rename_canvas,
            commands::search_canvases,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
