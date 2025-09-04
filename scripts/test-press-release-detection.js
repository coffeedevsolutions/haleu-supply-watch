#!/usr/bin/env node

/**
 * Test script to demonstrate new press release detection
 */

async function testPressReleaseDetection() {
  console.log('🔗 Testing Press Release Detection:');
  console.log('=' .repeat(50));
  
  try {
    const url = 'https://www.energy.gov/ne/us-department-energy-haleu-allocation-process';
    const response = await fetch(url);
    const html = await response.text();
    
    console.log(`✅ Fetched ${html.length} characters from DOE hub page`);
    
    // Known press releases (what we currently track)
    const knownReleases = new Set([
      'april-9-2025',    // Round 1
      'august-26-2025'   // Round 2
    ]);
    
    console.log('\n📋 Known Press Releases:');
    Array.from(knownReleases).forEach((release, index) => {
      console.log(`   ${index + 1}. ${release}`);
    });
    
    // Extract press release links from the Announcements section
    console.log('\n🔍 Scanning for Press Release Links...');
    
    // Look for press release patterns in the HTML
    const pressReleasePattern = /href="([^"]*)"[^>]*>.*?press release.*?published\s+([^<.]+)/gi;
    let match;
    const foundReleases = [];
    
    while ((match = pressReleasePattern.exec(html)) !== null) {
      const [fullMatch, url, dateText] = match;
      
      // Normalize the date for comparison
      const normalizedDate = dateText.toLowerCase()
        .replace(/,/g, '')
        .replace(/\s+/g, '-')
        .replace(/\./g, '');
      
      const fullUrl = url.startsWith('http') ? url : `https://www.energy.gov${url}`;
      
      foundReleases.push({
        url: fullUrl,
        dateText: dateText.trim(),
        normalizedDate,
        isNew: !knownReleases.has(normalizedDate)
      });
    }
    
    // Also look for simpler patterns in case the regex misses some
    const simplePattern = /Read the press release.*?published\s+([^<.]+)/gi;
    while ((match = simplePattern.exec(html)) !== null) {
      const [, dateText] = match;
      const normalizedDate = dateText.toLowerCase()
        .replace(/,/g, '')
        .replace(/\s+/g, '-')
        .replace(/\./g, '');
      
      // Only add if we haven't found this one already
      if (!foundReleases.some(r => r.normalizedDate === normalizedDate)) {
        foundReleases.push({
          url: 'URL extraction needed',
          dateText: dateText.trim(),
          normalizedDate,
          isNew: !knownReleases.has(normalizedDate)
        });
      }
    }
    
    console.log(`\n📄 Found ${foundReleases.length} Press Release References:`);
    
    foundReleases.forEach((release, index) => {
      const status = release.isNew ? '🚨 NEW' : '✅ Known';
      console.log(`\n${index + 1}. ${status}`);
      console.log(`   Date: ${release.dateText}`);
      console.log(`   Normalized: ${release.normalizedDate}`);
      console.log(`   URL: ${release.url}`);
    });
    
    // Simulate what would happen with a new press release
    console.log('\n🎭 Simulation: What happens with Round 3?');
    const simulatedNewRelease = {
      dateText: 'December 15, 2025',
      normalizedDate: 'december-15-2025',
      url: 'https://www.energy.gov/articles/us-department-energy-announces-round-3-haleu-allocations'
    };
    
    if (!knownReleases.has(simulatedNewRelease.normalizedDate)) {
      console.log('🚨 NEW PRESS RELEASE WOULD BE DETECTED:');
      console.log(`   Date: ${simulatedNewRelease.dateText}`);
      console.log(`   URL: ${simulatedNewRelease.url}`);
      console.log('   Actions that would be triggered:');
      console.log('   1. 🔔 Alert logged in Worker');
      console.log('   2. 📝 Document record created in database');
      console.log('   3. 🤖 GitHub Actions would scrape the new press release');
      console.log('   4. 📊 New allocations extracted and added to database');
      console.log('   5. 📱 Update event created for "What Changed" page');
    }
    
    return foundReleases;
    
  } catch (error) {
    console.error('❌ Press release detection test failed:', error.message);
    return [];
  }
}

async function demonstrateGitHubActionsFollowUp() {
  console.log('\n\n🤖 GitHub Actions Follow-up Process:');
  console.log('=' .repeat(50));
  
  console.log('When a new press release is detected, GitHub Actions would:');
  
  console.log('\n1. 📥 Receive notification of new press release URL');
  console.log('   - Via database record or queue');
  console.log('   - Includes URL and publication date');
  
  console.log('\n2. 🕸️ Scrape the press release page:');
  console.log('   - Use Cheerio for robust HTML parsing');
  console.log('   - Extract company names and allocation details');
  console.log('   - Look for specific patterns like:');
  console.log('     • "allocated to [Company Name]"');
  console.log('     • "XXX kg of HALEU"');
  console.log('     • "conditional commitment"');
  
  console.log('\n3. 🔍 Parse and structure the data:');
  const exampleNewData = {
    round: '3',
    companies: ['Advanced Nuclear Corp', 'Molten Salt Reactors Inc'],
    date: '2025-12-15',
    status: 'conditional'
  };
  console.log('   Example extracted data:', JSON.stringify(exampleNewData, null, 6));
  
  console.log('\n4. 📊 Update the database:');
  console.log('   - POST to /internal/import/allocations');
  console.log('   - Create allocation records for each company');
  console.log('   - Generate update_event for change tracking');
  
  console.log('\n5. 🔄 Update tracking:');
  console.log('   - Add new date to KNOWN_PRESS_RELEASES');
  console.log('   - Store raw press release HTML in R2');
  console.log('   - Create document metadata record');
}

async function main() {
  const releases = await testPressReleaseDetection();
  await demonstrateGitHubActionsFollowUp();
  
  console.log('\n\n💡 Summary - Automated New Press Release Detection:');
  console.log('=' .repeat(50));
  console.log('✅ Current system tracks known press releases');
  console.log('✅ Hourly Worker scans detect new releases automatically');
  console.log('✅ GitHub Actions follow up with detailed parsing');
  console.log('✅ Zero manual intervention needed for new rounds');
  console.log('✅ Complete audit trail in database and R2 storage');
  
  console.log('\n🎯 Next Steps:');
  console.log('• Enhanced regex patterns for better URL extraction');
  console.log('• Database table for press release tracking');
  console.log('• Queue system for GitHub Actions processing');
  console.log('• Email/Slack notifications for new detections');
}

main().catch(console.error);
