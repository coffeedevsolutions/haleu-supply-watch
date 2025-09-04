'use client';
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Allocation } from "@hsw/shared";

export default function Home() {
  const [items, setItems] = useState<Allocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sinceFilter, setSinceFilter] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (sinceFilter) params.since = sinceFilter;
      
      const response = await api.getAllocations(params);
      setItems(response.items);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, sinceFilter]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatWindow = (start?: number, end?: number) => {
    if (!start && !end) return 'N/A';
    const startStr = start ? formatDate(start) : 'Open';
    const endStr = end ? formatDate(end) : 'Open';
    return `${startStr} - ${endStr}`;
  };

  if (loading) {
    return (
      <div>
        <h1 style={{ marginBottom: '2rem' }}>HALEU Allocations</h1>
        <p>Loading allocations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 style={{ marginBottom: '2rem' }}>HALEU Allocations</h1>
        <div style={{ 
          color: '#dc2626', 
          padding: '1rem', 
          border: '1px solid #f87171', 
          borderRadius: '0.5rem',
          backgroundColor: '#fef2f2',
          marginBottom: '1rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Make sure the API is running and accessible. Check the console for more details.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>HALEU Allocations</h1>
      
      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All</option>
            <option value="conditional">Conditional</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            Since Date:
          </label>
          <input
            type="date"
            value={sinceFilter}
            onChange={(e) => setSinceFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        
        {(statusFilter || sinceFilter) && (
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={() => {
                setStatusFilter("");
                setSinceFilter("");
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
        Showing {items.length} allocation{items.length !== 1 ? 's' : ''}
        {statusFilter && ` with status "${statusFilter}"`}
        {sinceFilter && ` since ${sinceFilter}`}
      </p>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '0.75rem', 
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                ID
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '0.75rem', 
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Allocated To
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '0.75rem', 
                textAlign: 'right',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                kg HALEU
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '0.75rem', 
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Status
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '0.75rem', 
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Delivery Window
              </th>
              <th style={{ 
                border: '1px solid #e5e7eb', 
                padding: '0.75rem', 
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td 
                  colSpan={6}
                  style={{ 
                    border: '1px solid #e5e7eb', 
                    padding: '2rem', 
                    textAlign: 'center',
                    color: '#6b7280'
                  }}
                >
                  No allocations found matching the current filters.
                </td>
              </tr>
            ) : (
              items.map((allocation) => (
                <tr key={allocation.id}>
                  <td style={{ 
                    border: '1px solid #e5e7eb', 
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                  }}>
                    {allocation.id}
                  </td>
                  <td style={{ 
                    border: '1px solid #e5e7eb', 
                    padding: '0.75rem',
                    fontSize: '0.875rem'
                  }}>
                    {allocation.allocatedTo}
                  </td>
                  <td style={{ 
                    border: '1px solid #e5e7eb', 
                    padding: '0.75rem', 
                    textAlign: 'right',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {allocation.kg.toLocaleString()}
                  </td>
                  <td style={{ 
                    border: '1px solid #e5e7eb', 
                    padding: '0.75rem',
                    textAlign: 'center'
                  }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: allocation.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                      color: allocation.status === 'confirmed' ? '#166534' : '#92400e'
                    }}>
                      {allocation.status}
                    </span>
                  </td>
                  <td style={{ 
                    border: '1px solid #e5e7eb', 
                    padding: '0.75rem',
                    fontSize: '0.875rem'
                  }}>
                    {formatWindow(allocation.deliveryWindowStart, allocation.deliveryWindowEnd)}
                  </td>
                  <td style={{ 
                    border: '1px solid #e5e7eb', 
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {formatDate(allocation.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
