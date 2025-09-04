import * as fs from 'node:fs/promises';
import fetch from 'node-fetch';
import * as crypto from 'node:crypto';
import * as cheerio from 'cheerio';
import pdf from 'pdf-parse';

const API_URL = process.env.API_URL!;
const SECRET = process.env.WEBHOOK_ALLOCATIONS_SECRET!;

if (!API_URL || !SECRET) {
  console.error('Missing required environment variables: API_URL, WEBHOOK_ALLOCATIONS_SECRET');
  process.exit(1);
}

interface AllocationItem {
  id: string;
  allocated_to: string;
  kg?: number | null;
  status: string;
  allocation_date?: number | null;
  delivery_window_start?: number | null;
  delivery_window_end?: number | null;
  notes?: string | null;
  source_doc_id?: string | null;
}

async function upsertAllocations(items: AllocationItem[]) {
  const response = await fetch(`${API_URL}/internal/import/allocations`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': `gha-doe-${Date.now()}`,
      'X-Webhook-Secret': SECRET
    },
    body: JSON.stringify({ items })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Import failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Allocations imported:', { upserted: result.upserted, total: result.total });
  return result;
}

async function logEvent(message: string, data?: any) {
  console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
}

async function parseHubWithCheerio(): Promise<AllocationItem[]> {
  const url = 'https://www.energy.gov/ne/us-department-energy-haleu-allocation-process';
  
  await logEvent('Fetching DOE hub page', { url });
  
  const response = await fetch(url, {
    headers: {
      'user-agent': 'HSW/1.0 Data Ingest (GitHub Actions)',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch hub page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const items: AllocationItem[] = [];

  // Look for sections containing "Round" and "Selection"
  $('h2, h3, h4, h5, h6').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    
    let round: '1' | '2' | null = null;
    let date: string | null = null;
    
    if (text.includes('Round 1') && text.includes('Selection')) {
      round = '1';
      date = '2025-04-09';
    } else if (text.includes('Round 2') && text.includes('Selection')) {
      round = '2';
      date = '2025-08-26';
    }
    
    if (round && date) {
      // Look for the next list after this heading
      const $list = $el.nextAll('ul, ol').first();
      
      $list.find('li').each((_, li) => {
        const companyName = $(li).text().trim();
        
        // Filter out empty or very short matches
        if (companyName && companyName.length > 3 && !companyName.includes('$')) {
          const id = `doe-r${round}-${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          
          items.push({
            id,
            allocated_to: companyName,
            status: 'conditional',
            allocation_date: Math.floor(new Date(date + 'T00:00:00Z').getTime() / 1000),
            notes: `DOE Round ${round} Conditional Selection (parsed via Cheerio)`,
            source_doc_id: 'doe-hub'
          });
        }
      });
    }
  });

  await logEvent('Parsed allocations from hub', { 
    totalItems: items.length,
    round1Count: items.filter(i => i.id.includes('r1')).length,
    round2Count: items.filter(i => i.id.includes('r2')).length
  });

  return items;
}

async function parseAllocationPDF() {
  const url = 'https://www.energy.gov/sites/default/files/2024-09/Final%20HALEU%20Allocation%20Process.pdf';
  
  await logEvent('Fetching DOE allocation process PDF', { url });
  
  const response = await fetch(url, {
    headers: {
      'user-agent': 'HSW/1.0 Data Ingest (GitHub Actions)'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const data = await pdf(buffer);
  const text = data.text;

  // Extract schedule information
  // Look for patterns like "3 MT by Sep 30, 2024; 8 MT by Dec 31, 2025; 10 MT by Jun 30, 2026"
  const schedulePattern = /(\d+)\s*MT.*?(?:September|Sep)\s*30,?\s*2024.*?(\d+)\s*MT.*?(?:December|Dec)\s*31,?\s*2025.*?(\d+)\s*MT.*?(?:June|Jun)\s*30,?\s*2026/si;
  const scheduleMatch = schedulePattern.exec(text);

  let scheduleInfo = null;
  if (scheduleMatch) {
    const [, mt2024, mt2025, mt2026] = scheduleMatch.map(s => parseInt(s) || 0);
    const total = mt2024 + mt2025 + mt2026;
    
    scheduleInfo = {
      total_mt: total,
      by_sep_2024: mt2024,
      by_dec_2025: mt2025,
      by_jun_2026: mt2026,
      text_hash: crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)
    };
    
    await logEvent('Parsed allocation schedule from PDF', scheduleInfo);
  } else {
    await logEvent('No allocation schedule found in PDF');
  }

  // Look for any allocation references or company names
  const allocationPattern = /(?:allocated?|award|select)\s+(?:to\s+)?([A-Z][A-Za-z\s&,\.]+(?:Inc|LLC|Corp|Ltd|Company))/gi;
  const matches = text.match(allocationPattern) || [];
  
  const companies = [...new Set(matches.map(m => {
    const companyMatch = m.match(/(?:to\s+)?([A-Z][A-Za-z\s&,\.]+(?:Inc|LLC|Corp|Ltd|Company))/i);
    return companyMatch ? companyMatch[1].trim() : null;
  }).filter(Boolean))];

  await logEvent('Found companies in PDF', { count: companies.length, companies });

  return {
    schedule: scheduleInfo,
    companies,
    textHash: crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)
  };
}

async function main() {
  try {
    await logEvent('Starting DOE data ingest');

    // Parse the hub page with robust Cheerio parsing
    const hubAllocations = await parseHubWithCheerio();
    
    if (hubAllocations.length > 0) {
      await upsertAllocations(hubAllocations);
    } else {
      await logEvent('⚠️ No allocations found in hub page');
    }

    // Parse the PDF for schedule and validation
    const pdfData = await parseAllocationPDF();
    
    if (pdfData.schedule) {
      await logEvent('✅ DOE allocation schedule confirmed', pdfData.schedule);
      
      // Could create a document record or update event here
      // For now, just log the milestone information
    }

    await logEvent('DOE data ingest completed successfully');

  } catch (error) {
    await logEvent('❌ DOE data ingest failed', { 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main();
}
