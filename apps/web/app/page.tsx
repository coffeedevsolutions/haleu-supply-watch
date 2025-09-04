'use client';
import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";
    fetch(`${base}/v1/allocations`)
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(console.error);
  }, []);
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
