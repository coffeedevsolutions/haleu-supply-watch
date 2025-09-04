#!/usr/bin/env node

/**
 * Test script to manually run a scrape and show the data
 */

const API_BASE = 'https://hsw-api.blake-coffee8.workers.dev';

async function showCurrentData() {
  console.log('📊 Current Allocations in Database:');
  console.log('=' .repeat(50));
  
  try {
    const response = await fetch(`${API_BASE}/v1/allocations?limit=10`);
    const data = await response.json();
    
    if (data.items?.length) {
      data.items.forEach((allocation, index) => {
        console.log(`\n${index + 1}. ${allocation.allocated_to}`);
        console.log(`   ID: ${allocation.id}`);
        console.log(`   Status: ${allocation.status}`);
        console.log(`   Kg: ${allocation.kg || 'Not specified'}`);
        console.log(`   Date: ${allocation.allocation_date ? new Date(allocation.allocation_date * 1000).toISOString().split('T')[0] : 'Not specified'}`);
        console.log(`   Notes: ${allocation.notes || 'None'}`);
      });
    } else {
      console.log('   No allocations found');
    }
  } catch (error) {
    console.error('❌ Failed to fetch current data:', error.message);
  }
}

async function testDOEHubScrape() {
  console.log('\n\n🔍 Testing DOE Hub Scrape:');
  console.log('=' .repeat(50));
  
  try {
    // Fetch the DOE hub page directly
    const url = 'https://www.energy.gov/ne/us-department-energy-haleu-allocation-process';
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'user-agent': 'HSW/1.0 Manual Test',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`✅ Successfully fetched ${html.length} characters of HTML`);
    
    // Simple parsing simulation (same logic as Worker)
    console.log('\n🔍 Parsing for Round selections...');
    
    const lines = html.split('\n');
    let currentRound = null;
    let currentDate = null;
    const foundCompanies = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect round sections
      if (trimmedLine.includes('Round 1') && trimmedLine.includes('Selection')) {
        currentRound = '1';
        currentDate = '2025-04-09';
        console.log(`\n📍 Found Round 1 section`);
        continue;
      }
      
      if (trimmedLine.includes('Round 2') && trimmedLine.includes('Selection')) {
        currentRound = '2';
        currentDate = '2025-08-26';
        console.log(`\n📍 Found Round 2 section`);
        continue;
      }
      
      // Look for list items with company names
      const listItemMatch = trimmedLine.match(/>([^<]+)<\/li>/i);
      if (currentRound && currentDate && listItemMatch) {
        const companyName = listItemMatch[1]
          .trim()
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ');
        
        if (companyName && companyName.length > 3) {
          const id = `doe-r${currentRound}-${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          
          foundCompanies.push({
            id,
            allocated_to: companyName,
            status: 'conditional',
            allocation_date: Math.floor(new Date(currentDate + 'T00:00:00Z').getTime() / 1000),
            notes: `DOE Round ${currentRound} Conditional Selection (parsed from hub page)`,
            round: currentRound
          });
          
          console.log(`   ✓ Found: ${companyName} (Round ${currentRound})`);
        }
      }
    }
    
    console.log(`\n📋 Parsing Results:`);
    console.log(`   Total companies found: ${foundCompanies.length}`);
    console.log(`   Round 1: ${foundCompanies.filter(c => c.round === '1').length}`);
    console.log(`   Round 2: ${foundCompanies.filter(c => c.round === '2').length}`);
    
    if (foundCompanies.length > 0) {
      console.log('\n📄 Sample parsed data:');
      foundCompanies.slice(0, 3).forEach((company, index) => {
        console.log(`\n${index + 1}. ${JSON.stringify(company, null, 2)}`);
      });
    }
    
    return foundCompanies;
    
  } catch (error) {
    console.error('❌ Scrape test failed:', error.message);
    return [];
  }
}

async function main() {
  await showCurrentData();
  const scrapedData = await testDOEHubScrape();
  
  console.log('\n\n💡 Summary:');
  console.log('=' .repeat(50));
  console.log('This is what the Cloudflare Worker would extract hourly from the DOE hub page.');
  console.log('The GitHub Actions would do more sophisticated parsing with Cheerio and PDF processing.');
  console.log('\nTo see the actual Worker cron in action, it runs every hour at minute :00');
  console.log('To see GitHub Actions, they run every hour at minute :05');
}

main().catch(console.error);
