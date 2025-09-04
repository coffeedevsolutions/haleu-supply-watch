'use client';
import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";
    console.log('Fetching from:', `${base}/v1/allocations`);
    
    fetch(`${base}/v1/allocations`)
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        return response.json();
      })
      .then(d => {
        setItems(d.items ?? []);
        setError(null);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>HALEU Supply Watch — MVP</h1>
        <p>Loading allocations...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>HALEU Supply Watch — MVP</h1>
        <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Make sure the API is running at the correct URL. Check the console for more details.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>HALEU Supply Watch — MVP</h1>
      <p>Allocations (latest 100)</p>
      <table style={{ border: '1px solid black', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '6px' }}>ID</th>
            <th style={{ border: '1px solid black', padding: '6px' }}>Allocated To</th>
            <th style={{ border: '1px solid black', padding: '6px' }}>kg</th>
            <th style={{ border: '1px solid black', padding: '6px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={i}>
              <td style={{ border: '1px solid black', padding: '6px' }}>{r.id}</td>
              <td style={{ border: '1px solid black', padding: '6px' }}>{r.allocated_to}</td>
              <td style={{ border: '1px solid black', padding: '6px' }}>{r.kg}</td>
              <td style={{ border: '1px solid black', padding: '6px' }}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
