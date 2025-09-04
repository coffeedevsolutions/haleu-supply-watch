#!/usr/bin/env node

/**
 * Display current database contents clearly
 */

const API_BASE = 'https://hsw-api.blake-coffee8.workers.dev';

async function showCurrentData() {
  console.log('📊 Current Database Contents:');
  console.log('=' .repeat(60));
  
  try {
    // Get allocations
    const allocResponse = await fetch(`${API_BASE}/v1/allocations?limit=50`);
    const allocData = await allocResponse.json();
    
    console.log(`\n🏢 ALLOCATIONS (${allocData.items?.length || 0} total):`);
    if (allocData.items?.length) {
      allocData.items.forEach((allocation, index) => {
        const date = allocation.allocation_date ? 
          new Date(allocation.allocation_date * 1000).toISOString().split('T')[0] : 'None';
        
        // Identify test vs real data by ID patterns
        const dataType = allocation.id.startsWith('doe-2024-') ? '🧪 TEST SEED' :
                        allocation.id.startsWith('prod-') ? '🧪 PROD SEED' :
                        allocation.id.startsWith('alloc-') ? '🧪 LIVE SEED' :
                        allocation.id.startsWith('doe-r') ? '✅ REAL SCRAPE' :
                        '❓ UNKNOWN';
        
        console.log(`\n${index + 1}. ${dataType}`);
        console.log(`   Company: ${allocation.allocated_to}`);
        console.log(`   ID: ${allocation.id}`);
        console.log(`   Status: ${allocation.status}`);
        console.log(`   Kg: ${allocation.kg || 'Not specified'}`);
        console.log(`   Date: ${date}`);
        console.log(`   Notes: ${allocation.notes?.slice(0, 50) || 'None'}${allocation.notes?.length > 50 ? '...' : ''}`);
      });
    }
    
    // Get sources
    console.log(`\n\n📋 SOURCES:`);
    const sourcesResponse = await fetch(`${API_BASE}/v1/sources`);
    const sourcesData = await sourcesResponse.json();
    
    if (sourcesData.items?.length) {
      sourcesData.items.forEach((source, index) => {
        console.log(`${index + 1}. ${source.name} (${source.type})`);
        console.log(`   ID: ${source.id}`);
        console.log(`   URL: ${source.url}`);
      });
    }
    
    // Get recent changes
    console.log(`\n\n📝 RECENT CHANGES:`);
    const changesResponse = await fetch(`${API_BASE}/v1/changes?limit=10`);
    const changesData = await changesResponse.json();
    
    if (changesData.items?.length) {
      changesData.items.forEach((change, index) => {
        const date = change.occurred_at ? 
          new Date(change.occurred_at * 1000).toISOString().replace('T', ' ').slice(0, 19) : 'Unknown';
        
        console.log(`${index + 1}. ${change.entity_type || 'unknown'} update by ${change.actor || 'unknown'}`);
        console.log(`   Time: ${date}`);
        console.log(`   Entity: ${change.entity_id || 'unknown'}`);
      });
    }
    
    // Summary
    const testAllocations = allocData.items?.filter(a => 
      a.id.startsWith('doe-2024-') || a.id.startsWith('prod-') || a.id.startsWith('alloc-')
    ) || [];
    
    const realAllocations = allocData.items?.filter(a => 
      a.id.startsWith('doe-r')
    ) || [];
    
    console.log(`\n\n📈 SUMMARY:`);
    console.log(`   🧪 Test/Seed Records: ${testAllocations.length}`);
    console.log(`   ✅ Real Scraped Records: ${realAllocations.length}`);
    console.log(`   📋 Sources: ${sourcesData.items?.length || 0}`);
    console.log(`   📝 Change Events: ${changesData.items?.length || 0}`);
    
    return {
      testAllocations,
      realAllocations,
      allAllocations: allocData.items || []
    };
    
  } catch (error) {
    console.error('❌ Failed to fetch data:', error.message);
    return null;
  }
}

showCurrentData().then(data => {
  if (data && data.testAllocations.length > 0) {
    console.log('\n💡 To clean test data, run the cleanup script that will be created next.');
  }
}).catch(console.error);
