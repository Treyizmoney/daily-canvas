use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CanvasMeta {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub canvas_type: String, // "day", "project", "topic"
    pub date: Option<String>, // ISO date for day canvases
    pub created_at: String,
    pub modified_at: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CanvasData {
    pub meta: CanvasMeta,
    pub tldraw_state: serde_json::Value,
}

pub struct StorageEngine {
    db: Mutex<Connection>,
    data_dir: PathBuf,
}

impl StorageEngine {
    pub fn new(data_dir: PathBuf) -> Result<Self, String> {
        fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
        fs::create_dir_all(data_dir.join("canvases")).map_err(|e| e.to_string())?;

        let db_path = data_dir.join("db.sqlite");
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS canvases (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('day', 'project', 'topic')),
                date TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                modified_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
                tag TEXT NOT NULL,
                UNIQUE(canvas_id, tag)
            );
            CREATE INDEX IF NOT EXISTS idx_tags_canvas ON tags(canvas_id);
            CREATE INDEX IF NOT EXISTS idx_canvases_date ON canvases(date);
            CREATE INDEX IF NOT EXISTS idx_canvases_type ON canvases(type);
            PRAGMA journal_mode=WAL;
            PRAGMA foreign_keys=ON;"
        ).map_err(|e| e.to_string())?;

        Ok(Self {
            db: Mutex::new(conn),
            data_dir,
        })
    }

    pub fn save_canvas(&self, meta: &CanvasMeta, tldraw_state: &serde_json::Value) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;

        // Upsert metadata
        db.execute(
            "INSERT INTO canvases (id, title, type, date, created_at, modified_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                modified_at = excluded.modified_at",
            params![
                meta.id, meta.title, meta.canvas_type,
                meta.date, meta.created_at, meta.modified_at
            ],
        ).map_err(|e| e.to_string())?;

        // Replace tags
        db.execute("DELETE FROM tags WHERE canvas_id = ?1", params![meta.id])
            .map_err(|e| e.to_string())?;
        for tag in &meta.tags {
            db.execute(
                "INSERT INTO tags (canvas_id, tag) VALUES (?1, ?2)",
                params![meta.id, tag],
            ).map_err(|e| e.to_string())?;
        }

        // Write tldraw state to JSON file (atomic: write temp then rename)
        let canvas_path = self.data_dir.join("canvases").join(format!("{}.json", meta.id));
        let tmp_path = self.data_dir.join("canvases").join(format!("{}.json.tmp", meta.id));
        let json = serde_json::to_string_pretty(tldraw_state).map_err(|e| e.to_string())?;
        fs::write(&tmp_path, &json).map_err(|e| e.to_string())?;
        fs::rename(&tmp_path, &canvas_path).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn load_canvas(&self, id: &str) -> Result<Option<CanvasData>, String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;

        let mut stmt = db.prepare(
            "SELECT id, title, type, date, created_at, modified_at FROM canvases WHERE id = ?1"
        ).map_err(|e| e.to_string())?;

        let meta = stmt.query_row(params![id], |row| {
            Ok(CanvasMeta {
                id: row.get(0)?,
                title: row.get(1)?,
                canvas_type: row.get(2)?,
                date: row.get(3)?,
                created_at: row.get(4)?,
                modified_at: row.get(5)?,
                tags: Vec::new(),
            })
        }).ok();

        let Some(mut meta) = meta else {
            return Ok(None);
        };

        // Load tags
        let mut tag_stmt = db.prepare("SELECT tag FROM tags WHERE canvas_id = ?1")
            .map_err(|e| e.to_string())?;
        meta.tags = tag_stmt.query_map(params![id], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        // Load tldraw state from file
        let canvas_path = self.data_dir.join("canvases").join(format!("{}.json", id));
        let tldraw_state = if canvas_path.exists() {
            let json = fs::read_to_string(&canvas_path).map_err(|e| e.to_string())?;
            serde_json::from_str(&json).map_err(|e| e.to_string())?
        } else {
            serde_json::json!({})
        };

        Ok(Some(CanvasData { meta, tldraw_state }))
    }

    pub fn list_by_date_range(&self, start: &str, end: &str) -> Result<Vec<CanvasMeta>, String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;

        let mut stmt = db.prepare(
            "SELECT c.id, c.title, c.type, c.date, c.created_at, c.modified_at
             FROM canvases c
             WHERE c.date >= ?1 AND c.date <= ?2
             ORDER BY c.date ASC"
        ).map_err(|e| e.to_string())?;

        let canvases: Vec<CanvasMeta> = stmt.query_map(params![start, end], |row| {
            Ok(CanvasMeta {
                id: row.get(0)?,
                title: row.get(1)?,
                canvas_type: row.get(2)?,
                date: row.get(3)?,
                created_at: row.get(4)?,
                modified_at: row.get(5)?,
                tags: Vec::new(),
            })
        }).map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

        Ok(canvases)
    }

    pub fn list_recent(&self, limit: usize) -> Result<Vec<CanvasMeta>, String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;

        let mut stmt = db.prepare(
            "SELECT id, title, type, date, created_at, modified_at
             FROM canvases
             ORDER BY modified_at DESC
             LIMIT ?1"
        ).map_err(|e| e.to_string())?;

        let canvases: Vec<CanvasMeta> = stmt.query_map(params![limit as i64], |row| {
            Ok(CanvasMeta {
                id: row.get(0)?,
                title: row.get(1)?,
                canvas_type: row.get(2)?,
                date: row.get(3)?,
                created_at: row.get(4)?,
                modified_at: row.get(5)?,
                tags: Vec::new(),
            })
        }).map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

        Ok(canvases)
    }

    pub fn delete_canvas(&self, id: &str) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;
        db.execute("DELETE FROM canvases WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;

        let canvas_path = self.data_dir.join("canvases").join(format!("{}.json", id));
        if canvas_path.exists() {
            fs::remove_file(&canvas_path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn search(&self, query: &str) -> Result<Vec<CanvasMeta>, String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;
        let pattern = format!("%{}%", query);

        let mut stmt = db.prepare(
            "SELECT id, title, type, date, created_at, modified_at
             FROM canvases
             WHERE title LIKE ?1
             ORDER BY modified_at DESC
             LIMIT 50"
        ).map_err(|e| e.to_string())?;

        let canvases: Vec<CanvasMeta> = stmt.query_map(params![pattern], |row| {
            Ok(CanvasMeta {
                id: row.get(0)?,
                title: row.get(1)?,
                canvas_type: row.get(2)?,
                date: row.get(3)?,
                created_at: row.get(4)?,
                modified_at: row.get(5)?,
                tags: Vec::new(),
            })
        }).map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

        Ok(canvases)
    }
}
