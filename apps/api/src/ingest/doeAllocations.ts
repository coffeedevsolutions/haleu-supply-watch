import { Env } from "../bindings";
import { log, logError } from "../utils/logging";
import type { AllocationUpsert } from "@hsw/shared";

interface CsvRecord {
  id: string;
  allocated_to: string;
  kg: number;
  status: 'conditional' | 'confirmed';
  allocation_date?: number;
  delivery_window_start?: number;
  delivery_window_end?: number;
  notes?: string;
}

function parseCsv(csvContent: string): CsvRecord[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const records: CsvRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const record: any = {};
    
    headers.forEach((header, idx) => {
      const value = values[idx] || '';
      
      switch (header) {
        case 'kg':
          record[header] = parseFloat(value) || 0;
          break;
        case 'allocation_date':
        case 'delivery_window_start':
        case 'delivery_window_end':
          record[header] = value ? parseInt(value) : undefined;
          break;
        case 'status':
          record[header] = value as 'conditional' | 'confirmed';
          break;
        default:
          record[header] = value || undefined;
      }
    });
    
    if (record.id && record.allocated_to && record.kg > 0) {
      records.push(record);
    }
  }
  
  return records;
}

function calculateDiff(oldRecords: CsvRecord[], newRecords: CsvRecord[]) {
  const oldMap = new Map(oldRecords.map(r => [r.id, r]));
  const newMap = new Map(newRecords.map(r => [r.id, r]));
  
  const added: CsvRecord[] = [];
  const changed: Array<{ old: CsvRecord; new: CsvRecord; changes: string[] }> = [];
  const removed: CsvRecord[] = [];
  
  // Find added and changed records
  for (const [id, newRecord] of newMap) {
    const oldRecord = oldMap.get(id);
    if (!oldRecord) {
      added.push(newRecord);
    } else {
      const changes: string[] = [];
      
      if (oldRecord.allocated_to !== newRecord.allocated_to) {
        changes.push(`allocated_to: ${oldRecord.allocated_to} → ${newRecord.allocated_to}`);
      }
      if (oldRecord.kg !== newRecord.kg) {
        changes.push(`kg: ${oldRecord.kg} → ${newRecord.kg}`);
      }
      if (oldRecord.status !== newRecord.status) {
        changes.push(`status: ${oldRecord.status} → ${newRecord.status}`);
      }
      if (oldRecord.notes !== newRecord.notes) {
        changes.push(`notes: ${oldRecord.notes || 'null'} → ${newRecord.notes || 'null'}`);
      }
      
      if (changes.length > 0) {
        changed.push({ old: oldRecord, new: newRecord, changes });
      }
    }
  }
  
  // Find removed records
  for (const [id, oldRecord] of oldMap) {
    if (!newMap.has(id)) {
      removed.push(oldRecord);
    }
  }
  
  return { added, changed, removed };
}

export async function runDoeAllocations(env: Env): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  log("info", "Starting DOE allocations ingest");
  
  try {
    // 1. Read current data from R2 (if exists)
    let oldRecords: CsvRecord[] = [];
    try {
      const latestCsv = await env.R2.get('fixtures/doe-allocations-latest.csv');
      if (latestCsv) {
        const content = await latestCsv.text();
        oldRecords = parseCsv(content);
        log("info", "Loaded existing CSV from R2", { count: oldRecords.length });
      }
    } catch (error) {
      log("info", "No existing CSV found in R2, treating as first run");
    }
    
    // 2. Read new fixture data (simulating external fetch)
    // In a real implementation, this would fetch from DOE APIs
    const newCsvContent = `id,allocated_to,kg,status,allocation_date,delivery_window_start,delivery_window_end,notes
doe-2024-001,X-energy,1200,confirmed,1704067200,1735689600,1767225600,Initial production allocation for reactor fuel
doe-2024-002,TerraPower,850,conditional,1706745600,1740787200,1772323200,Conditional on facility readiness
doe-2024-003,NuScale Power,950,confirmed,1709251200,1743379200,1774915200,Phase 1 SMR deployment
doe-2024-004,Kairos Power,750,conditional,1711929600,1746057600,1777593600,Pending regulatory approval
doe-2024-005,Ultra Safe Nuclear,500,confirmed,1714521600,1748649600,1780185600,TRISO fuel development program
doe-2024-006,Newcleo,300,conditional,1717200000,1751328000,1782864000,Advanced reactor development`;
    
    const newRecords = parseCsv(newCsvContent);
    log("info", "Parsed new CSV data", { count: newRecords.length });
    
    // 3. Calculate diff
    const diff = calculateDiff(oldRecords, newRecords);
    log("info", "Calculated diff", { 
      added: diff.added.length, 
      changed: diff.changed.length, 
      removed: diff.removed.length 
    });
    
    // 4. Upsert changes to database
    let upsertCount = 0;
    
    // Add and update records
    for (const record of [...diff.added, ...diff.changed.map(c => c.new)]) {
      try {
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
            updated_at=excluded.updated_at
        `).bind(
          record.id,
          record.allocated_to,
          record.kg,
          record.status,
          record.allocation_date ?? null,
          record.delivery_window_start ?? null,
          record.delivery_window_end ?? null,
          record.notes ?? null,
          now,
          null // source_doc_id
        ).run();
        
        if (result.changes && result.changes > 0) {
          upsertCount++;
        }
      } catch (error) {
        logError("Failed to upsert allocation", error as Error, { allocationId: record.id });
      }
    }
    
    // 5. Create update event summarizing changes
    const eventId = crypto.randomUUID();
    const changesSummary = {
      added: diff.added.length,
      changed: diff.changed.length,
      removed: diff.removed.length,
      totalRecords: newRecords.length,
      upserted: upsertCount,
      changes: diff.changed.map(c => ({
        id: c.new.id,
        fields: c.changes
      }))
    };
    
    await env.DB.prepare(`
      INSERT INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      eventId,
      "allocation",
      "doe-ingest",
      JSON.stringify(changesSummary),
      "ingest/doe-allocations",
      now
    ).run();
    
    // 6. Upload new CSV to R2
    const timestamp = now;
    
    // Save versioned snapshot
    await env.R2.put(`snapshots/doe-allocations/${timestamp}.csv`, newCsvContent, {
      httpMetadata: {
        contentType: 'text/csv'
      }
    });
    
    // Update latest version
    await env.R2.put('fixtures/doe-allocations-latest.csv', newCsvContent, {
      httpMetadata: {
        contentType: 'text/csv'
      }
    });
    
    log("info", "DOE allocations ingest completed", {
      added: diff.added.length,
      changed: diff.changed.length,
      removed: diff.removed.length,
      upserted: upsertCount,
      snapshotKey: `snapshots/doe-allocations/${timestamp}.csv`
    });
    
  } catch (error) {
    logError("DOE allocations ingest failed", error as Error);
    
    // Create error event
    const errorEventId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      errorEventId,
      "ingest",
      "doe-allocations",
      JSON.stringify({ error: (error as Error).message }),
      "ingest/doe-allocations",
      now
    ).run();
    
    throw error;
  }
}
