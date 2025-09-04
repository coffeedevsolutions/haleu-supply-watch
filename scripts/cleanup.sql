-- Database Cleanup: Remove all test/seed data
-- This preserves sources and any real scraped data (doe-r*)

-- Remove test allocations
DELETE FROM allocation WHERE id LIKE 'doe-2024-%';
DELETE FROM allocation WHERE id LIKE 'prod-%';
DELETE FROM allocation WHERE id LIKE 'alloc-%';

-- Remove test delivery batches
DELETE FROM delivery_batch WHERE allocation_id LIKE 'doe-2024-%';
DELETE FROM delivery_batch WHERE allocation_id LIKE 'prod-%';
DELETE FROM delivery_batch WHERE allocation_id LIKE 'alloc-%';

-- Remove test update events
DELETE FROM update_event WHERE entity_id LIKE 'doe-2024-%';
DELETE FROM update_event WHERE entity_id LIKE 'prod-%';
DELETE FROM update_event WHERE entity_id LIKE 'alloc-%';
DELETE FROM update_event WHERE actor = 'deployment/seed';
DELETE FROM update_event WHERE actor = 'ingest/doe-allocations';

-- Keep sources - they are needed for scraping
-- Keep any real scraped data (doe-r* pattern)
