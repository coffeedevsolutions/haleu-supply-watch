import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const API_URL = process.env.API_URL!;
const SECRET = process.env.WEBHOOK_ALLOCATIONS_SECRET!;

if (!API_URL || !SECRET) {
  console.error('Missing required environment variables: API_URL, WEBHOOK_ALLOCATIONS_SECRET');
  process.exit(1);
}

interface DeliveryItem {
  id: string;
  allocation_id: string;
  kg?: number | null;
  status: string;
  shipped_at?: number | null;
  received_at?: number | null;
  notes?: string | null;
}

async function upsertDeliveries(items: DeliveryItem[]) {
  const response = await fetch(`${API_URL}/internal/import/deliveries`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': `gha-centrus-${Date.now()}`,
      'X-Webhook-Secret': SECRET
    },
    body: JSON.stringify({ items })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Import failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Deliveries imported:', { upserted: result.upserted, total: result.total });
  return result;
}

async function logEvent(message: string, data?: any) {
  console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
}

async function parseCentrusInvestorNews(): Promise<DeliveryItem[]> {
  const url = 'https://investors.centrusenergy.com/news-releases';
  
  await logEvent('Fetching Centrus investor news', { url });
  
  const response = await fetch(url, {
    headers: {
      'user-agent': 'HSW/1.0 Data Ingest (GitHub Actions)',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Centrus news: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const items: DeliveryItem[] = [];

  // Look for news items related to HALEU production or deliveries
  $('.news-item, .press-release, article, .release-item').each((_, element) => {
    const $el = $(element);
    const title = $el.find('h1, h2, h3, h4, .title, .headline').text().trim();
    const content = $el.text().toLowerCase();
    
    // Look for HALEU-related keywords
    const isHaleuRelated = content.includes('haleu') || 
                          content.includes('low-enriched uranium') ||
                          content.includes('900 kg') ||
                          content.includes('phase iii') ||
                          content.includes('production') && content.includes('uranium');
    
    if (isHaleuRelated) {
      // Extract date if available
      const dateText = $el.find('.date, .published, time').text().trim();
      let publishedAt: number | null = null;
      
      if (dateText) {
        const date = new Date(dateText);
        if (!isNaN(date.getTime())) {
          publishedAt = Math.floor(date.getTime() / 1000);
        }
      }
      
      // Look for quantity mentions (kg, MT, etc.)
      const kgMatch = content.match(/(\d+(?:\.\d+)?)\s*kg/i);
      const mtMatch = content.match(/(\d+(?:\.\d+)?)\s*mt/i);
      
      let kg: number | null = null;
      if (kgMatch) {
        kg = parseFloat(kgMatch[1]);
      } else if (mtMatch) {
        kg = parseFloat(mtMatch[1]) * 1000; // Convert MT to kg
      }
      
      // Determine status based on content
      let status = 'announced';
      if (content.includes('delivered') || content.includes('shipped')) {
        status = 'delivered';
      } else if (content.includes('production') || content.includes('producing')) {
        status = 'in_production';
      }
      
      const id = `centrus-${publishedAt || Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`;
      
      items.push({
        id,
        allocation_id: 'centrus-haleu-program', // Generic allocation for Centrus HALEU
        kg,
        status,
        shipped_at: status === 'delivered' ? publishedAt : null,
        notes: `${title} (from Centrus investor news)`
      });
      
      await logEvent('Found HALEU-related news', { 
        title: title.slice(0, 100),
        kg,
        status,
        publishedAt
      });
    }
  });

  await logEvent('Parsed Centrus news', { totalItems: items.length });
  return items;
}

async function main() {
  try {
    await logEvent('Starting Centrus data ingest');

    // Parse investor news for HALEU production updates
    const deliveries = await parseCentrusInvestorNews();
    
    if (deliveries.length > 0) {
      await upsertDeliveries(deliveries);
    } else {
      await logEvent('⚠️ No HALEU-related deliveries found in Centrus news');
    }

    await logEvent('Centrus data ingest completed successfully');

  } catch (error) {
    await logEvent('❌ Centrus data ingest failed', { 
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
