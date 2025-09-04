import { api } from "../../lib/api";
import type { UpdateEvent } from "@hsw/shared";

// Server component that fetches data at build/request time
export default async function ChangesPage() {
  let changes: UpdateEvent[] = [];
  let error: string | null = null;

  try {
    const response = await api.getChanges({ limit: 50 });
    changes = response.items;
  } catch (err) {
    console.error('Failed to fetch changes:', err);
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatChangeJson = (changeJson: string) => {
    try {
      const parsed = JSON.parse(changeJson);
      
      // Handle different types of changes
      if (parsed.upserted !== undefined) {
        return `${parsed.upserted} of ${parsed.total} records updated`;
      }
      
      if (parsed.added !== undefined || parsed.changed !== undefined) {
        const parts = [];
        if (parsed.added > 0) parts.push(`${parsed.added} added`);
        if (parsed.changed > 0) parts.push(`${parsed.changed} changed`);
        if (parsed.removed > 0) parts.push(`${parsed.removed} removed`);
        
        let summary = parts.join(', ') || 'No changes';
        
        if (parsed.changes && parsed.changes.length > 0) {
          const changeDetails = parsed.changes.slice(0, 3).map((c: any) => 
            `${c.id}: ${c.fields.join(', ')}`
          ).join('; ');
          summary += ` (${changeDetails}${parsed.changes.length > 3 ? '...' : ''})`;
        }
        
        return summary;
      }
      
      if (parsed.error) {
        return `Error: ${parsed.error}`;
      }
      
      // Fallback for other formats
      return JSON.stringify(parsed, null, 2);
    } catch {
      return changeJson;
    }
  };

  const getEventIcon = (entityType: string, actor: string) => {
    if (actor.includes('ingest')) return '📥';
    if (entityType === 'allocation') return '🏭';
    if (entityType === 'delivery_batch') return '🚚';
    return '📝';
  };

  const getEventColor = (actor: string) => {
    if (actor.includes('error')) return '#dc2626';
    if (actor.includes('ingest')) return '#059669';
    return '#1f2937';
  };

  if (error) {
    return (
      <div>
        <h1 style={{ marginBottom: '2rem' }}>What Changed</h1>
        <div style={{ 
          color: '#dc2626', 
          padding: '1rem', 
          border: '1px solid #f87171', 
          borderRadius: '0.5rem',
          backgroundColor: '#fef2f2'
        }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>What Changed</h1>
      
      <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
        Recent updates to HALEU allocations and deliveries (last 50 events)
      </p>

      {changes.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            No recent changes found.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {changes.map((event) => (
            <div 
              key={event.id} 
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                borderLeft: `4px solid ${getEventColor(event.actor || 'unknown')}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>
                  {getEventIcon(event.entityType || 'unknown', event.actor || 'unknown')}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                      {event.entityType ? 
                        event.entityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Update' : 
                        'Unknown Update'
                      }
                    </h3>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace'
                    }}>
                      {event.entityId || 'unknown'}
                    </span>
                  </div>
                  
                  <p style={{ 
                    margin: '0 0 0.75rem 0', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    {formatChangeJson(event.changeJson || '{}')}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <span>
                      <strong>Actor:</strong> {event.actor || 'unknown'}
                    </span>
                    <span>
                      <strong>Time:</strong> {event.occurredAt ? formatDate(event.occurredAt) : 'unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {changes.length > 0 && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            Showing the most recent {changes.length} events. 
            Events are automatically generated when data changes through imports or manual updates.
          </p>
        </div>
      )}
    </div>
  );
}
