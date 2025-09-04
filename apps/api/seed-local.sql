-- Local development seed data for HALEU Supply Watch

-- Insert sources
INSERT OR IGNORE INTO source (id, name, url, type, created_at) VALUES 
('doe-official', 'Department of Energy', 'https://www.energy.gov/', 'regulator', unixepoch()),
('centrus-vendor', 'Centrus Energy', 'https://www.centrusenergy.com/', 'vendor', unixepoch()),
('industry-news', 'Nuclear News Network', 'https://www.nuclearnews.net/', 'press', unixepoch());

-- Insert documents (representing DOE reports, vendor announcements, etc.)
INSERT OR IGNORE INTO document (id, source_id, title, url, published_at, fetched_at, sha256) VALUES 
('doe-2024-haleu-allocation', 'doe-official', 'DOE HALEU Allocation Framework 2024', 'https://www.energy.gov/haleu-allocation-2024', 1704067200, 1704067200, 'a1b2c3d4e5f6'),
('centrus-delivery-schedule', 'centrus-vendor', 'Centrus HALEU Production Schedule', 'https://www.centrusenergy.com/haleu-schedule', 1706745600, 1706745600, 'f6e5d4c3b2a1');

-- Insert initial allocations
INSERT OR IGNORE INTO allocation (id, allocated_to, kg, status, allocation_date, delivery_window_start, delivery_window_end, notes, updated_at, source_doc_id) VALUES 
('doe-2024-001', 'X-energy', 1200, 'confirmed', 1704067200, 1735689600, 1767225600, 'Initial production allocation for Xe-100 reactor fuel', unixepoch(), 'doe-2024-haleu-allocation'),
('doe-2024-002', 'TerraPower', 850, 'conditional', 1706745600, 1740787200, 1772323200, 'Conditional on Natrium facility readiness', unixepoch(), 'doe-2024-haleu-allocation'),
('doe-2024-003', 'NuScale Power', 950, 'confirmed', 1709251200, 1743379200, 1774915200, 'Phase 1 SMR deployment allocation', unixepoch(), 'doe-2024-haleu-allocation'),
('doe-2024-004', 'Kairos Power', 750, 'conditional', 1711929600, 1746057600, 1777593600, 'Pending NRC design approval', unixepoch(), 'doe-2024-haleu-allocation'),
('doe-2024-005', 'Ultra Safe Nuclear', 500, 'confirmed', 1714521600, 1748649600, 1780185600, 'TRISO fuel development program', unixepoch(), 'doe-2024-haleu-allocation');

-- Insert some delivery batches (representing planned/shipped deliveries)
INSERT OR IGNORE INTO delivery_batch (id, allocation_id, kg, status, shipped_at, received_at, notes, updated_at) VALUES 
('batch-x-energy-001', 'doe-2024-001', 300, 'planned', NULL, NULL, 'Q2 2025 delivery planned', unixepoch()),
('batch-x-energy-002', 'doe-2024-001', 400, 'planned', NULL, NULL, 'Q4 2025 delivery planned', unixepoch()),
('batch-nuscale-001', 'doe-2024-003', 200, 'shipped', 1717200000, NULL, 'First batch for VOYGR demonstration', unixepoch()),
('batch-usn-001', 'doe-2024-005', 150, 'received', 1714521600, 1714608000, 'TRISO fuel development samples', unixepoch());

-- Insert update events (representing historical changes)
INSERT OR IGNORE INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at) VALUES 
('event-001', 'allocation', 'doe-2024-002', '{"changed": 1, "fields": ["status: conditional → confirmed"]}', 'manual/admin', 1714521600),
('event-002', 'delivery_batch', 'batch-nuscale-001', '{"changed": 1, "fields": ["status: planned → shipped"]}', 'vendor/nuscale', 1717200000),
('event-003', 'allocation', 'bulk', '{"added": 5, "changed": 0, "removed": 0, "totalRecords": 5}', 'ingest/doe-allocations', 1704067200),
('event-004', 'delivery_batch', 'batch-usn-001', '{"changed": 1, "fields": ["status: shipped → received"]}', 'vendor/usn', 1714608000);

-- Confirm the data was inserted
SELECT 'Sources inserted: ' || COUNT(*) FROM source;
SELECT 'Documents inserted: ' || COUNT(*) FROM document;
SELECT 'Allocations inserted: ' || COUNT(*) FROM allocation;
SELECT 'Delivery batches inserted: ' || COUNT(*) FROM delivery_batch;
SELECT 'Update events inserted: ' || COUNT(*) FROM update_event;
