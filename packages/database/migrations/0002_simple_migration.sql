-- Simple migration to update production database
PRAGMA foreign_keys=OFF;

-- Step 1: Add missing columns to allocation table
ALTER TABLE allocation ADD COLUMN allocation_date INTEGER;
ALTER TABLE allocation ADD COLUMN delivery_window_start INTEGER;  
ALTER TABLE allocation ADD COLUMN delivery_window_end INTEGER;
ALTER TABLE allocation ADD COLUMN notes TEXT;

-- Copy start_date to new columns (convert to unix timestamp if it's a date string)
UPDATE allocation SET 
    allocation_date = CASE 
        WHEN start_date IS NOT NULL AND start_date != '' THEN 
            CASE 
                WHEN start_date LIKE '%-%-%' THEN strftime('%s', start_date)
                ELSE CAST(start_date AS INTEGER)
            END
        ELSE NULL 
    END,
    delivery_window_start = CASE 
        WHEN start_date IS NOT NULL AND start_date != '' THEN 
            CASE 
                WHEN start_date LIKE '%-%-%' THEN strftime('%s', start_date)
                ELSE CAST(start_date AS INTEGER)
            END
        ELSE NULL 
    END,
    delivery_window_end = CASE 
        WHEN end_date IS NOT NULL AND end_date != '' THEN 
            CASE 
                WHEN end_date LIKE '%-%-%' THEN strftime('%s', end_date)
                ELSE CAST(end_date AS INTEGER)
            END
        ELSE NULL 
    END;

-- Step 2: Add missing columns to delivery_batch table
ALTER TABLE delivery_batch ADD COLUMN allocation_id TEXT;
ALTER TABLE delivery_batch ADD COLUMN shipped_at INTEGER;
ALTER TABLE delivery_batch ADD COLUMN received_at INTEGER;
ALTER TABLE delivery_batch ADD COLUMN updated_at INTEGER DEFAULT (unixepoch());

-- Create a mapping from producer to allocation (simplified for MVP)
UPDATE delivery_batch SET allocation_id = 'doe-2024-001' WHERE producer = 'X-energy';
UPDATE delivery_batch SET allocation_id = 'doe-2024-002' WHERE producer = 'TerraPower'; 
UPDATE delivery_batch SET allocation_id = 'doe-2024-003' WHERE producer = 'NuScale Power';
UPDATE delivery_batch SET allocation_id = 'doe-2024-004' WHERE producer = 'Kairos Power';
UPDATE delivery_batch SET allocation_id = 'doe-2024-005' WHERE producer = 'Ultra Safe Nuclear';

-- For any remaining rows without allocation_id, create a generic one
UPDATE delivery_batch SET allocation_id = 'legacy-' || lower(replace(producer, ' ', '-'))
WHERE allocation_id IS NULL;

-- Step 3: Add missing columns to source table
ALTER TABLE source ADD COLUMN created_at INTEGER DEFAULT (unixepoch());

-- Step 4: Add missing columns to document table  
ALTER TABLE document ADD COLUMN title TEXT;
ALTER TABLE document ADD COLUMN published_at INTEGER;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_allocation_updated ON allocation(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_alloc ON delivery_batch(allocation_id);
CREATE INDEX IF NOT EXISTS idx_event_time ON update_event(occurred_at DESC);

-- Step 6: Insert migration event
INSERT OR IGNORE INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at)
VALUES (
    'migration-' || unixepoch(),
    'system', 
    'schema-update',
    '{"message": "Added new columns for MVP schema", "migration": "0002_simple_migration"}',
    'deployment/migration',
    unixepoch()
);

PRAGMA foreign_keys=ON;
