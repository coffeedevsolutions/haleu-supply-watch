#!/usr/bin/env node

/**
 * Quick test script to verify the ingestion pipeline
 * Usage: node scripts/test-ingest.js
 */

const API_BASE = process.env.API_URL || 'https://hsw-api.blake-coffee8.workers.dev';

async function testAPI() {
  console.log('🧪 Testing HALEU Supply Watch API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/v1/health`);
    const health = await healthResponse.json();
    console.log('   ✅ Health:', health);

    // Test sources endpoint
    console.log('\n2. Testing sources endpoint...');
    const sourcesResponse = await fetch(`${API_BASE}/v1/sources`);
    const sources = await sourcesResponse.json();
    console.log(`   ✅ Sources found: ${sources.items?.length || 0}`);
    sources.items?.forEach(source => {
      console.log(`      - ${source.name} (${source.type})`);
    });

    // Test allocations endpoint
    console.log('\n3. Testing allocations endpoint...');
    const allocationsResponse = await fetch(`${API_BASE}/v1/allocations?limit=5`);
    const allocations = await allocationsResponse.json();
    console.log(`   ✅ Allocations found: ${allocations.items?.length || 0}`);
    allocations.items?.forEach(allocation => {
      console.log(`      - ${allocation.allocated_to} (${allocation.status})`);
    });

    // Test changes endpoint
    console.log('\n4. Testing changes endpoint...');
    const changesResponse = await fetch(`${API_BASE}/v1/changes?limit=5`);
    const changes = await changesResponse.json();
    console.log(`   ✅ Changes found: ${changes.items?.length || 0}`);
    changes.items?.forEach(change => {
      console.log(`      - ${change.entity_type} update by ${change.actor}`);
    });

    console.log('\n🎉 All API tests passed!');
    console.log('\n💡 To trigger manual ingest, run:');
    console.log(`   curl -X POST ${API_BASE}/internal/ingest/doe -H "X-Webhook-Secret: YOUR_SECRET"`);

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

testAPI();
