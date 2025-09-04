#!/usr/bin/env node

/**
 * Manual trigger for production data scraping
 */

async function triggerWorkerScrape() {
  console.log('🔧 Manual Worker Scrape Trigger');
  console.log('=' .repeat(50));
  
  console.log('⚠️  The Worker internal endpoints require webhook authentication.');
  console.log('Since we don\'t have the production webhook secret, here are alternatives:\n');
  
  console.log('🎯 OPTION 1: Direct Database Population');
  console.log('Run the Worker scraping logic locally and populate via API:');
  console.log('');
  
  // Let's run the scraping logic directly
  await runLocalScrape();
}

async function runLocalScrape() {
  console.log('🕷️ Running Local DOE Hub Scrape:');
  console.log('-' .repeat(30));
  
  try {
    // Fetch the DOE hub page
    const url = 'https://www.energy.gov/ne/us-department-energy-haleu-allocation-process';
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'user-agent': 'HSW/1.0 Manual Trigger',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`✅ Fetched ${html.length} characters`);
    
    // Parse using the same logic as the Worker
    const allocations = parseAllocationsFromHub(html);
    
    if (allocations.length === 0) {
      console.log('⚠️  No allocations found in hub page');
      return;
    }
    
    console.log(`\n📊 Found ${allocations.length} allocations:`);
    allocations.forEach((alloc, index) => {
      console.log(`${index + 1}. ${alloc.allocated_to} (Round ${alloc.id.includes('r1') ? '1' : '2'})`);
    });
    
    // Create SQL for manual insertion
    console.log('\n📝 SQL for Manual Database Population:');
    console.log('=' .repeat(50));
    
    const now = Math.floor(Date.now() / 1000);
    
    allocations.forEach((alloc, index) => {
      const sql = `INSERT OR REPLACE INTO allocation (
  id, allocated_to, kg, status, allocation_date, 
  delivery_window_start, delivery_window_end, notes, updated_at, source_doc_id
) VALUES (
  '${alloc.id}',
  '${alloc.allocated_to}',
  ${alloc.kg || 'NULL'},
  '${alloc.status}',
  ${alloc.allocation_date},
  ${alloc.delivery_window_start || 'NULL'},
  ${alloc.delivery_window_end || 'NULL'},
  '${alloc.notes}',
  ${now},
  '${alloc.source_doc_id}'
);`;
      
      console.log(`-- Allocation ${index + 1}: ${alloc.allocated_to}`);
      console.log(sql);
      console.log('');
    });
    
    // Add update event
    const eventId = generateUUID();
    const updateEventSQL = `INSERT INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at)
VALUES (
  '${eventId}',
  'allocation',
  'bulk',
  '${JSON.stringify({ upserted: allocations.length, total: allocations.length })}',
  'manual/scrape',
  ${now}
);`;
    
    console.log('-- Update Event');
    console.log(updateEventSQL);
    
    return allocations;
    
  } catch (error) {
    console.error('❌ Local scrape failed:', error.message);
    return [];
  }
}

function parseAllocationsFromHub(html) {
  const rows = [];
  
  try {
    const lines = html.split('\n');
    let currentRound = null;
    let currentDate = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect round sections
      if (trimmedLine.includes('Round 1') && trimmedLine.includes('Selection')) {
        currentRound = '1';
        currentDate = '2025-04-09';
        continue;
      }
      
      if (trimmedLine.includes('Round 2') && trimmedLine.includes('Selection')) {
        currentRound = '2';
        currentDate = '2025-08-26';
        continue;
      }
      
      // Look for list items with company names
      const listItemMatch = trimmedLine.match(/>([^<]+)<\/li>/i);
      if (currentRound && currentDate && listItemMatch) {
        const companyName = listItemMatch[1]
          .trim()
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ');
        
        // Improved filtering (same as updated Worker)
        if (companyName && 
            companyName.length > 3 && 
            companyName.length < 100 && 
            !companyName.toLowerCase().includes('round') && 
            !companyName.toLowerCase().includes('commitment') && 
            !companyName.toLowerCase().includes('published') && 
            (companyName.includes('Inc') || companyName.includes('LLC') || companyName.includes('Corp') || 
             companyName.includes('Ltd') || companyName.includes('Company') || companyName.includes('Nuclear') ||
             companyName.includes('Power') || companyName.includes('Energy') || /^[A-Z]/.test(companyName))) {
          
          const cleanName = companyName.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
          const id = `doe-r${currentRound}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          
          rows.push({
            id,
            allocated_to: cleanName,
            status: 'conditional',
            allocation_date: Math.floor(new Date(currentDate + 'T00:00:00Z').getTime() / 1000),
            notes: `DOE Round ${currentRound} Conditional Selection (manual scrape)`,
            source_doc_id: 'doe-hub',
            kg: null,
            delivery_window_start: null,
            delivery_window_end: null
          });
        }
      }
    }
    
    return rows;
  } catch (error) {
    console.error('Parse error:', error.message);
    return [];
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function showOtherOptions() {
  console.log('\n\n🎯 OTHER TRIGGER OPTIONS:');
  console.log('=' .repeat(50));
  
  console.log('OPTION 2: Wait for Cron (Next Hour)');
  console.log('  The Worker cron runs every hour at minute :00');
  console.log('  Next run: ' + getNextCronTime());
  
  console.log('\nOPTION 3: GitHub Actions Manual Trigger');
  console.log('  1. Go to: https://github.com/YOUR_USERNAME/haleu-supply-watch/actions');
  console.log('  2. Click "Data Ingest" workflow');
  console.log('  3. Click "Run workflow" → "Run workflow"');
  console.log('  4. GitHub Actions will run the heavy parsing and POST to your API');
  
  console.log('\nOPTION 4: Direct SQL Execution');
  console.log('  Use the SQL commands generated above:');
  console.log('  1. Save the SQL to a file (e.g., insert-real-data.sql)');
  console.log('  2. cd apps/api');
  console.log('  3. wrangler d1 execute hsw --remote --file ../../insert-real-data.sql');
}

function getNextCronTime() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  return nextHour.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

async function main() {
  await triggerWorkerScrape();
  await showOtherOptions();
  
  console.log('\n💡 Recommended: Use OPTION 4 (Direct SQL) for immediate results');
}

main().catch(console.error);
