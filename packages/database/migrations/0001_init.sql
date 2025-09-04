PRAGMA foreign_keys=OFF;

-- Create tables
CREATE TABLE IF NOT EXISTS source (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    url TEXT NOT NULL, 
    type TEXT NOT NULL, 
    created_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

CREATE TABLE IF NOT EXISTS document (
    id TEXT PRIMARY KEY, 
    source_id TEXT NOT NULL, 
    title TEXT, 
    url TEXT NOT NULL, 
    published_at INTEGER, 
    fetched_at INTEGER NOT NULL, 
    sha256 TEXT NOT NULL,
    FOREIGN KEY(source_id) REFERENCES source(id)
);

CREATE TABLE IF NOT EXISTS allocation (
    id TEXT PRIMARY KEY, 
    allocated_to TEXT NOT NULL, 
    kg REAL NOT NULL, 
    status TEXT NOT NULL, 
    allocation_date INTEGER, 
    delivery_window_start INTEGER, 
    delivery_window_end INTEGER, 
    notes TEXT, 
    updated_at INTEGER NOT NULL, 
    source_doc_id TEXT,
    FOREIGN KEY(source_doc_id) REFERENCES document(id)
);

CREATE TABLE IF NOT EXISTS delivery_batch (
    id TEXT PRIMARY KEY, 
    allocation_id TEXT NOT NULL, 
    kg REAL NOT NULL, 
    status TEXT NOT NULL, 
    shipped_at INTEGER, 
    received_at INTEGER, 
    notes TEXT, 
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(allocation_id) REFERENCES allocation(id)
);

CREATE TABLE IF NOT EXISTS update_event (
    id TEXT PRIMARY KEY, 
    entity_type TEXT NOT NULL, 
    entity_id TEXT NOT NULL, 
    change_json TEXT NOT NULL, 
    actor TEXT NOT NULL, 
    occurred_at INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_allocation_updated ON allocation(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_alloc ON delivery_batch(allocation_id);
CREATE INDEX IF NOT EXISTS idx_event_time ON update_event(occurred_at DESC);

PRAGMA foreign_keys=ON;
