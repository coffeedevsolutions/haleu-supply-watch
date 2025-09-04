-- Production seed data for HALEU Supply Watch
-- WARNING: This will modify production data

-- Insert essential sources only
INSERT OR IGNORE INTO source (id, name, url, type, created_at) VALUES 
('doe-official', 'Department of Energy', 'https://www.energy.gov/', 'regulator', unixepoch()),
('centrus-vendor', 'Centrus Energy', 'https://www.centrusenergy.com/', 'vendor', unixepoch());

-- Insert one sample allocation for production validation
INSERT OR IGNORE INTO allocation (id, allocated_to, kg, status, allocation_date, delivery_window_start, delivery_window_end, notes, updated_at, source_doc_id) VALUES 
('prod-sample-001', 'Sample Utility', 100, 'confirmed', unixepoch(), unixepoch() + (30 * 24 * 60 * 60), unixepoch() + (365 * 24 * 60 * 60), 'Sample allocation for production validation', unixepoch(), NULL);

-- Insert initialization event
INSERT OR IGNORE INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at) VALUES 
('prod-init-001', 'system', 'initialization', '{"message": "Production database initialized"}', 'deployment/seed', unixepoch());

-- Confirm the data was inserted
SELECT 'Production setup complete. Sources: ' || COUNT(*) FROM source;
SELECT 'Sample allocations: ' || COUNT(*) FROM allocation;
