use crate::storage::{CanvasData, CanvasMeta, StorageEngine};
use chrono::Utc;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn save_canvas(
    storage: State<StorageEngine>,
    meta: CanvasMeta,
    tldraw_state: serde_json::Value,
) -> Result<(), String> {
    storage.save_canvas(&meta, &tldraw_state)
}

#[tauri::command]
pub fn load_canvas(
    storage: State<StorageEngine>,
    id: String,
) -> Result<Option<CanvasData>, String> {
    storage.load_canvas(&id)
}

#[tauri::command]
pub fn get_or_create_day_canvas(
    storage: State<StorageEngine>,
    date: String,
) -> Result<CanvasData, String> {
    // Check if day canvas already exists
    if let Some(canvas) = storage.load_canvas(&format!("day-{}", date))? {
        return Ok(canvas);
    }

    // Create new day canvas
    let now = Utc::now().to_rfc3339();
    let meta = CanvasMeta {
        id: format!("day-{}", date),
        title: date.clone(),
        canvas_type: "day".to_string(),
        date: Some(date),
        created_at: now.clone(),
        modified_at: now,
        tags: Vec::new(),
    };

    let tldraw_state = serde_json::json!({});
    storage.save_canvas(&meta, &tldraw_state)?;

    Ok(CanvasData { meta, tldraw_state })
}

#[tauri::command]
pub fn create_canvas(
    storage: State<StorageEngine>,
    title: String,
    canvas_type: String,
    tags: Vec<String>,
) -> Result<CanvasMeta, String> {
    let now = Utc::now().to_rfc3339();
    let meta = CanvasMeta {
        id: Uuid::new_v4().to_string(),
        title,
        canvas_type,
        date: None,
        created_at: now.clone(),
        modified_at: now,
        tags,
    };

    let tldraw_state = serde_json::json!({});
    storage.save_canvas(&meta, &tldraw_state)?;
    Ok(meta)
}

#[tauri::command]
pub fn list_canvases_by_date(
    storage: State<StorageEngine>,
    start: String,
    end: String,
) -> Result<Vec<CanvasMeta>, String> {
    storage.list_by_date_range(&start, &end)
}

#[tauri::command]
pub fn list_recent_canvases(
    storage: State<StorageEngine>,
    limit: usize,
) -> Result<Vec<CanvasMeta>, String> {
    storage.list_recent(limit)
}

#[tauri::command]
pub fn delete_canvas(
    storage: State<StorageEngine>,
    id: String,
) -> Result<(), String> {
    storage.delete_canvas(&id)
}

#[tauri::command]
pub fn duplicate_canvas(
    storage: State<StorageEngine>,
    id: String,
) -> Result<CanvasMeta, String> {
    let source = storage.load_canvas(&id)?
        .ok_or_else(|| format!("Canvas {} not found", id))?;

    let now = Utc::now().to_rfc3339();
    let new_meta = CanvasMeta {
        id: Uuid::new_v4().to_string(),
        title: format!("{} (copy)", source.meta.title),
        canvas_type: source.meta.canvas_type,
        date: None, // Duplicates are never day canvases
        created_at: now.clone(),
        modified_at: now,
        tags: source.meta.tags,
    };

    storage.save_canvas(&new_meta, &source.tldraw_state)?;
    Ok(new_meta)
}

#[tauri::command]
pub fn rename_canvas(
    storage: State<StorageEngine>,
    id: String,
    new_title: String,
) -> Result<(), String> {
    storage.rename(&id, &new_title)
}

#[tauri::command]
pub fn search_canvases(
    storage: State<StorageEngine>,
    query: String,
) -> Result<Vec<CanvasMeta>, String> {
    storage.search(&query)
}
