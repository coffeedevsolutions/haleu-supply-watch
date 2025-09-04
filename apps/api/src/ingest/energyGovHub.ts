import { Env } from "../bindings";
import { log, logError } from "../utils/logging";

// Track known press releases to detect new ones
const KNOWN_PRESS_RELEASES = new Set([
  'april-9-2025',    // Round 1
  'august-26-2025'   // Round 2
]);

type AllocationRow = {
  id: string;
  allocated_to: string;
  kg?: number | null;
  status: string;
  allocation_date?: number | null;
  delivery_window_start?: number | null;
  delivery_window_end?: number | null;
  notes?: string | null;
  source_doc_id?: string | null;
};

export async function fetchDOEHubHTML(): Promise<string> {
  const url = 'https://www.energy.gov/ne/us-department-energy-haleu-allocation-process';
  
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'HSW/1.0 (contact: ingest@haleu-supply-watch)',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!res.ok) {
      throw new Error(`DOE hub fetch failed: ${res.status} ${res.statusText}`);
    }
    
    const html = await res.text();
    log("info", "DOE hub HTML fetched", { url, size: html.length });
    return html;
  } catch (error) {
    logError("Failed to fetch DOE hub HTML", error as Error, { url });
    throw error;
  }
}

/**
 * Ultra-simple parse that looks for the "Selections" lists you see on the page
 * MVP: simple regex; MVP+ switch to HTMLRewriter/Cheerio in GH Action for resiliency
 */
export function parseAllocationsFromHub(html: string): AllocationRow[] {
  const rows: AllocationRow[] = [];
  
  try {
    // First, check for new press release links
    checkForNewPressReleases(html);
    
    // Look for Round 1 and Round 2 sections
    const lines = html.split('\n');
    let currentRound: '1' | '2' | null = null;
    let currentDate: string | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect round sections
      if (trimmedLine.includes('Round 1') && trimmedLine.includes('Selection')) {
        currentRound = '1';
        currentDate = '2025-04-09'; // Round 1 date from the plan
        continue;
      }
      
      if (trimmedLine.includes('Round 2') && trimmedLine.includes('Selection')) {
        currentRound = '2';
        currentDate = '2025-08-26'; // Round 2 date from the plan
        continue;
      }
      
      // Look for list items with company names
      const listItemMatch = trimmedLine.match(/>([^<]+)<\/li>/i);
      if (currentRound && currentDate && listItemMatch) {
        const companyName = listItemMatch[1]
          .trim()
          .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
          .replace(/\s+/g, ' '); // Normalize whitespace
        
        if (companyName && 
            companyName.length > 3 && 
            companyName.length < 100 && // Reject very long text 
            !companyName.toLowerCase().includes('round') && // Skip round announcements
            !companyName.toLowerCase().includes('commitment') && // Skip commitment text
            !companyName.toLowerCase().includes('published') && // Skip publication text
            (companyName.includes('Inc') || companyName.includes('LLC') || companyName.includes('Corp') || 
             companyName.includes('Ltd') || companyName.includes('Company') || companyName.includes('Nuclear') ||
             companyName.includes('Power') || companyName.includes('Energy') || /^[A-Z]/.test(companyName))) { // Company-like names
          
          // Clean up HTML entities
          const cleanName = companyName.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
          const id = `doe-r${currentRound}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          
          rows.push({
            id,
            allocated_to: cleanName,
            status: 'conditional',
            allocation_date: Math.floor(new Date(currentDate + 'T00:00:00Z').getTime() / 1000),
            notes: `DOE Round ${currentRound} Conditional Selection (parsed from hub page)`,
            source_doc_id: 'doe-hub'
          });
        }
      }
    }
    
    log("info", "Parsed allocations from DOE hub", { 
      totalRows: rows.length,
      round1Count: rows.filter(r => r.id.includes('r1')).length,
      round2Count: rows.filter(r => r.id.includes('r2')).length
    });
    
    return rows;
  } catch (error) {
    logError("Failed to parse DOE hub HTML", error as Error);
    return [];
  }
}

export async function runDOEHubIngest(env: Env): Promise<void> {
  try {
    log("info", "Starting DOE hub ingest");
    
    const html = await fetchDOEHubHTML();
    const rows = parseAllocationsFromHub(html);
    
    if (!rows.length) {
      log("info", "No allocations found in DOE hub, skipping import");
      return;
    }
    
    // Store raw HTML in R2 for provenance (if R2 is available)
    if (env.R2_ARTIFACTS) {
      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const key = `raw/doe/hub-${timestamp}.html`;
        
        await env.R2_ARTIFACTS.put(key, html, {
          httpMetadata: {
            contentType: 'text/html',
            cacheControl: 'public, max-age=31536000'
          },
          customMetadata: {
            source: 'doe-hub',
            ingested_at: new Date().toISOString(),
            row_count: rows.length.toString()
          }
        });
        
        log("info", "Stored DOE hub HTML artifact", { key, size: html.length });
      } catch (r2Error) {
        logError("Failed to store DOE hub artifact in R2", r2Error as Error);
        // Continue with import even if R2 storage fails
      }
    }
    
    // Import allocations directly via database (avoid self-fetch in cron context)
    const now = Math.floor(Date.now() / 1000);
    let upsertCount = 0;

    for (const item of rows) {
      const result = await env.DB.prepare(`
        INSERT INTO allocation (
          id, allocated_to, kg, status, allocation_date, 
          delivery_window_start, delivery_window_end, notes, updated_at, source_doc_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          allocated_to=excluded.allocated_to,
          kg=excluded.kg,
          status=excluded.status,
          allocation_date=excluded.allocation_date,
          delivery_window_start=excluded.delivery_window_start,
          delivery_window_end=excluded.delivery_window_end,
          notes=excluded.notes,
          updated_at=excluded.updated_at,
          source_doc_id=excluded.source_doc_id
      `).bind(
        item.id,
        item.allocated_to,
        item.kg,
        item.status,
        item.allocation_date ?? null,
        item.delivery_window_start ?? null,
        item.delivery_window_end ?? null,
        item.notes ?? null,
        now,
        item.source_doc_id ?? null
      ).run();

      if (result.meta?.changes && result.meta.changes > 0) {
        upsertCount++;
      }
    }

    // Create update event
    if (rows.length > 0) {
      const eventId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        eventId,
        "allocation",
        "bulk",
        JSON.stringify({ upserted: upsertCount, total: rows.length }),
        "cron/doe-hub",
        now
      ).run();
    }

    const result = { ok: true, upserted: upsertCount, total: rows.length };
    log("info", "DOE hub ingest completed", { 
      upserted: result.upserted, 
      total: result.total,
      success: result.ok 
    });
    
  } catch (error) {
    logError("DOE hub ingest failed", error as Error);
    throw error;
  }
}

/**
 * Check for new press release links in the Announcements section
 */
function checkForNewPressReleases(html: string): void {
  try {
    // Look for press release links in the Announcements section
    const pressReleasePattern = /href="([^"]*)"[^>]*>.*?press release.*?published\s+([^<.]+)/gi;
    let match;
    
    const foundReleases = [];
    
    while ((match = pressReleasePattern.exec(html)) !== null) {
      const [, url, dateText] = match;
      
      // Normalize the date for comparison
      const normalizedDate = dateText.toLowerCase()
        .replace(/,/g, '')
        .replace(/\s+/g, '-');
      
      foundReleases.push({
        url: url.startsWith('http') ? url : `https://www.energy.gov${url}`,
        dateText: dateText.trim(),
        normalizedDate
      });
      
      // Check if this is a new press release
      if (!KNOWN_PRESS_RELEASES.has(normalizedDate)) {
        log("info", "🚨 NEW PRESS RELEASE DETECTED", {
          url: url.startsWith('http') ? url : `https://www.energy.gov${url}`,
          dateText: dateText.trim(),
          normalizedDate
        });
        
        // TODO: In a real implementation, you could:
        // 1. Add this to a queue for GitHub Actions to process
        // 2. Send an alert/notification
        // 3. Store in database as a new document to process
        // 4. Update the known press releases list
      }
    }
    
    log("info", "Press release check completed", {
      totalFound: foundReleases.length,
      knownReleases: Array.from(KNOWN_PRESS_RELEASES),
      foundReleases: foundReleases.map(r => ({ date: r.dateText, url: r.url }))
    });
    
  } catch (error) {
    logError("Failed to check for new press releases", error as Error);
  }
}
