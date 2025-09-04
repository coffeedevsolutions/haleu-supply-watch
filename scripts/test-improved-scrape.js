#!/usr/bin/env node

/**
 * Test the improved parsing logic
 */

async function testImprovedParsing() {
  console.log('🔍 Testing Improved DOE Hub Parsing:');
  console.log('=' .repeat(50));
  
  try {
    const url = 'https://www.energy.gov/ne/us-department-energy-haleu-allocation-process';
    const response = await fetch(url, {
      headers: {
        'user-agent': 'HSW/1.0 Manual Test',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    const html = await response.text();
    console.log(`✅ Fetched ${html.length} characters of HTML`);
    
    // Improved parsing logic (same as updated Worker)
    const lines = html.split('\n');
    let currentRound = null;
    let currentDate = null;
    const foundCompanies = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
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
      
      const listItemMatch = trimmedLine.match(/>([^<]+)<\/li>/i);
      if (currentRound && currentDate && listItemMatch) {
        const companyName = listItemMatch[1]
          .trim()
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ');
        
        // Improved filtering
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
          
          foundCompanies.push({
            id,
            allocated_to: cleanName,
            status: 'conditional',
            allocation_date: Math.floor(new Date(currentDate + 'T00:00:00Z').getTime() / 1000),
            notes: `DOE Round ${currentRound} Conditional Selection (parsed from hub page)`,
            round: currentRound
          });
          
          console.log(`   ✅ VALID: ${cleanName} (Round ${currentRound})`);
        } else {
          console.log(`   ❌ FILTERED: ${companyName.slice(0, 50)}... (Round ${currentRound})`);
        }
      }
    }
    
    console.log(`\n📋 Final Results:`);
    console.log(`   Valid companies: ${foundCompanies.length}`);
    console.log(`   Round 1: ${foundCompanies.filter(c => c.round === '1').length}`);
    console.log(`   Round 2: ${foundCompanies.filter(c => c.round === '2').length}`);
    
    if (foundCompanies.length > 0) {
      console.log('\n📄 Clean parsed data:');
      foundCompanies.forEach((company, index) => {
        console.log(`\n${index + 1}. ${company.allocated_to}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Round: ${company.round}`);
        console.log(`   Date: ${new Date(company.allocation_date * 1000).toISOString().split('T')[0]}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImprovedParsing();
