#!/usr/bin/env node

/**
 * Clean up test/seed data from the database
 */

const API_BASE = 'https://hsw-api.blake-coffee8.workers.dev';

async function cleanupDatabase() {
  console.log('🧹 Database Cleanup Process');
  console.log('=' .repeat(50));
  
  console.log('⚠️  This will remove ALL test/seed data and leave only real scraped data.');
  console.log('   Test data includes:');
  console.log('   • doe-2024-* (X-energy, TerraPower, NuScale, etc.)');
  console.log('   • prod-* (Sample Utility)');
  console.log('   • alloc-* (Utility A)');
  console.log('');
  console.log('   Real scraped data (doe-r*) will be preserved.');
  console.log('   Sources will be preserved.');
  console.log('');
  
  // Since we don't have direct database access from scripts, we'll create SQL commands
  console.log('📝 SQL Commands to Execute:');
  console.log('=' .repeat(50));
  
  const cleanupSQL = `
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

-- Keep sources and real scraped data (doe-r*)
-- Sources are needed for the scraping system to work
  `;
  
  console.log(cleanupSQL);
  
  console.log('\n🔧 How to Execute:');
  console.log('=' .repeat(50));
  console.log('Option 1 - Direct SQL execution:');
  console.log('  cd apps/api');
  console.log('  wrangler d1 execute hsw --remote --command "DELETE FROM allocation WHERE id LIKE \'doe-2024-%\' OR id LIKE \'prod-%\' OR id LIKE \'alloc-%\';"');
  console.log('  wrangler d1 execute hsw --remote --command "DELETE FROM delivery_batch WHERE allocation_id LIKE \'doe-2024-%\' OR allocation_id LIKE \'prod-%\' OR allocation_id LIKE \'alloc-%\';"');
  console.log('  wrangler d1 execute hsw --remote --command "DELETE FROM update_event WHERE entity_id LIKE \'doe-2024-%\' OR entity_id LIKE \'prod-%\' OR entity_id LIKE \'alloc-%\' OR actor = \'deployment/seed\';"');
  
  console.log('\nOption 2 - SQL file execution:');
  console.log('  wrangler d1 execute hsw --remote --file scripts/cleanup.sql');
}

async function verifyCleanup() {
  console.log('\n\n🔍 Verification After Cleanup:');
  console.log('=' .repeat(50));
  
  try {
    const response = await fetch(`${API_BASE}/v1/allocations?limit=50`);
    const data = await response.json();
    
    const remaining = data.items || [];
    const testRecords = remaining.filter(a => 
      a.id.startsWith('doe-2024-') || a.id.startsWith('prod-') || a.id.startsWith('alloc-')
    );
    const realRecords = remaining.filter(a => a.id.startsWith('doe-r'));
    
    console.log(`✅ Remaining allocations: ${remaining.length}`);
    console.log(`🧪 Test records: ${testRecords.length} (should be 0)`);
    console.log(`✅ Real scraped records: ${realRecords.length}`);
    
    if (testRecords.length > 0) {
      console.log('\n⚠️  Test records still found:');
      testRecords.forEach(record => {
        console.log(`   - ${record.id}: ${record.allocated_to}`);
      });
    } else {
      console.log('\n🎉 All test data successfully removed!');
    }
    
    if (realRecords.length > 0) {
      console.log('\n✅ Real scraped data preserved:');
      realRecords.forEach(record => {
        console.log(`   - ${record.id}: ${record.allocated_to}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function main() {
  await cleanupDatabase();
  
  console.log('\n\n🤔 Do you want to proceed? (Run the SQL commands above)');
  console.log('Then run: node scripts/show-current-data.js to verify');
}

main().catch(console.error);
