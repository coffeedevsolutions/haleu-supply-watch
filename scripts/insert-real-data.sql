-- Insert real scraped data from DOE HALEU Allocation Process page
-- Generated on 2025-09-04 from https://www.energy.gov/ne/us-department-energy-haleu-allocation-process

-- Allocation 1: TRISO-X LLC (Round 1)
INSERT OR REPLACE INTO allocation (
  id, allocated_to, kg, status, allocation_date, 
  delivery_window_start, delivery_window_end, notes, updated_at, source_doc_id
) VALUES (
  'doe-r1-triso-x-llc',
  'TRISO-X LLC',
  0,
  'conditional',
  1744156800,
  NULL,
  NULL,
  'DOE Round 1 Conditional Selection (quantity TBD)',
  1757022562,
  'doe-hub'
);

-- Allocation 2: Antares Nuclear, Inc. (Round 2)
INSERT OR REPLACE INTO allocation (
  id, allocated_to, kg, status, allocation_date, 
  delivery_window_start, delivery_window_end, notes, updated_at, source_doc_id
) VALUES (
  'doe-r2-antares-nuclear-inc',
  'Antares Nuclear, Inc.',
  0,
  'conditional',
  1756166400,
  NULL,
  NULL,
  'DOE Round 2 Conditional Selection (quantity TBD)',
  1757022562,
  'doe-hub'
);

-- Update Event
INSERT INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at)
VALUES (
  '85c58900-726f-4f87-a002-016966aa7aac',
  'allocation',
  'bulk',
  '{"upserted":2,"total":2}',
  'manual/scrape',
  1757022562
);
