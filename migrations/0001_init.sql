PRAGMA foreign_keys=OFF;
CREATE TABLE IF NOT EXISTS source (id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE, type TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS document (id TEXT PRIMARY KEY, source_id TEXT NOT NULL, fetched_at INTEGER NOT NULL, sha256 TEXT NOT NULL UNIQUE, url TEXT NOT NULL, r2_key TEXT NOT NULL, content_type TEXT, status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS allocation (id TEXT PRIMARY KEY, allocated_to TEXT NOT NULL, kg REAL NOT NULL, start_date TEXT, end_date TEXT, status TEXT NOT NULL, source_doc_id TEXT, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS delivery_batch (id TEXT PRIMARY KEY, producer TEXT NOT NULL, kg REAL NOT NULL, month TEXT NOT NULL, status TEXT NOT NULL, proof_url TEXT, source_doc_id TEXT);
CREATE TABLE IF NOT EXISTS update_event (id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, change_json TEXT NOT NULL, actor TEXT NOT NULL, occurred_at INTEGER NOT NULL);
