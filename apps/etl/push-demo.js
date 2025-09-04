// simple seeding via API
const BASE = process.env.API_BASE ?? "http://localhost:8787";
const payload = {
  id: "alloc-demo-001",
  allocated_to: "Demo Utility",
  kg: 75,
  status: "confirmed"
};
fetch(`${BASE}/internal/import/allocations`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload)
}).then(r => r.json()).then(console.log).catch(console.error);
