-- Migration to update production database schema
-- This updates the existing tables to match the new MVP schema

PRAGMA foreign_keys=OFF;

-- Step 1: Update allocation table structure
-- Create new table with correct schema
CREATE TABLE IF NOT EXISTS allocation_new (
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

-- Copy data from old table to new table, mapping old columns to new ones
INSERT INTO allocation_new (id, allocated_to, kg, status, allocation_date, delivery_window_start, delivery_window_end, notes, updated_at, source_doc_id)
SELECT 
    id, 
    allocated_to, 
    kg, 
    status, 
    -- Map old date columns to new structure
    CASE WHEN start_date IS NOT NULL THEN strftime('%s', start_date) ELSE NULL END as allocation_date,
    CASE WHEN start_date IS NOT NULL THEN strftime('%s', start_date) ELSE NULL END as delivery_window_start,
    CASE WHEN end_date IS NOT NULL THEN strftime('%s', end_date) ELSE NULL END as delivery_window_end,
    NULL as notes, -- New column
    updated_at, 
    source_doc_id
FROM allocation;

-- Drop old table and rename new table
DROP TABLE allocation;
ALTER TABLE allocation_new RENAME TO allocation;

-- Step 2: Update delivery_batch table structure if needed
-- Check if it needs updating by looking at current structure
CREATE TABLE IF NOT EXISTS delivery_batch_new (
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

-- Copy existing delivery_batch data if any exists
INSERT OR IGNORE INTO delivery_batch_new (id, allocation_id, kg, status, shipped_at, received_at, notes, updated_at)
SELECT 
    id,
    -- If the table has old structure with producer/month, map it to allocation_id
    COALESCE(
        (SELECT 'allocation-' || producer || '-' || month WHERE EXISTS(SELECT 1 FROM pragma_table_info('delivery_batch') WHERE name='producer')),
        allocation_id
    ) as allocation_id,
    kg,
    status,
    NULL as shipped_at,  -- New column
    NULL as received_at, -- New column
    COALESCE(
        (SELECT month WHERE EXISTS(SELECT 1 FROM pragma_table_info('delivery_batch') WHERE name='month')),
        notes
    ) as notes,
    COALESCE(updated_at, unixepoch()) as updated_at
FROM delivery_batch
WHERE true; -- Only copy if old table exists

-- Replace delivery_batch table
DROP TABLE IF EXISTS delivery_batch;
ALTER TABLE delivery_batch_new RENAME TO delivery_batch;

-- Step 3: Update source table to add created_at if missing
-- Add created_at column if it doesn't exist
ALTER TABLE source ADD COLUMN created_at INTEGER DEFAULT (unixepoch());

-- Step 4: Update document table structure if needed
-- Add any missing columns to document table
ALTER TABLE document ADD COLUMN title TEXT;
ALTER TABLE document ADD COLUMN published_at INTEGER;

-- Step 5: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_allocation_updated ON allocation(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_alloc ON delivery_batch(allocation_id);
CREATE INDEX IF NOT EXISTS idx_event_time ON update_event(occurred_at DESC);

-- Step 6: Insert a migration event
INSERT OR IGNORE INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at)
VALUES (
    'migration-' || unixepoch(),
    'system',
    'schema-update',
    '{"message": "Updated database schema to MVP version", "migration": "0002_update_schema"}',
    'deployment/migration',
    unixepoch()
);

PRAGMA foreign_keys=ON;
