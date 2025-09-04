-- Minimal migration to add required columns
PRAGMA foreign_keys=OFF;

-- Add new columns to allocation table (without defaults)
ALTER TABLE allocation ADD COLUMN allocation_date INTEGER;
ALTER TABLE allocation ADD COLUMN delivery_window_start INTEGER;  
ALTER TABLE allocation ADD COLUMN delivery_window_end INTEGER;
ALTER TABLE allocation ADD COLUMN notes TEXT;

-- Add new columns to delivery_batch table
ALTER TABLE delivery_batch ADD COLUMN allocation_id TEXT;
ALTER TABLE delivery_batch ADD COLUMN shipped_at INTEGER;
ALTER TABLE delivery_batch ADD COLUMN received_at INTEGER;
ALTER TABLE delivery_batch ADD COLUMN updated_at INTEGER;

-- Add new columns to source table
ALTER TABLE source ADD COLUMN created_at INTEGER;

-- Add new columns to document table  
ALTER TABLE document ADD COLUMN title TEXT;
ALTER TABLE document ADD COLUMN published_at INTEGER;

-- Update the new columns with data
UPDATE delivery_batch SET updated_at = unixepoch() WHERE updated_at IS NULL;
UPDATE source SET created_at = unixepoch() WHERE created_at IS NULL;

-- Create allocation_id mapping for delivery_batch
UPDATE delivery_batch SET allocation_id = 'doe-2024-001' WHERE producer = 'X-energy';
UPDATE delivery_batch SET allocation_id = 'doe-2024-002' WHERE producer = 'TerraPower'; 
UPDATE delivery_batch SET allocation_id = 'doe-2024-003' WHERE producer = 'NuScale Power';
UPDATE delivery_batch SET allocation_id = 'doe-2024-004' WHERE producer = 'Kairos Power';
UPDATE delivery_batch SET allocation_id = 'doe-2024-005' WHERE producer = 'Ultra Safe Nuclear';
UPDATE delivery_batch SET allocation_id = 'legacy-' || lower(replace(producer, ' ', '-')) WHERE allocation_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_allocation_updated ON allocation(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_alloc ON delivery_batch(allocation_id);
CREATE INDEX IF NOT EXISTS idx_event_time ON update_event(occurred_at DESC);

PRAGMA foreign_keys=ON;
