# HALEU Supply Watch - API Documentation

## Base URL
- **Development**: `http://localhost:8787`
- **Production**: `https://hsw-api.blake-coffee8.workers.dev`

## Authentication
Currently no authentication required (MVP). All endpoints are public or internal.

## Rate Limiting
- **Public endpoints**: 60 requests per minute per IP
- **Internal endpoints**: No rate limiting

## CORS Policy
- Allowed origins: `localhost:3000`, `*.pages.dev`
- Methods: `GET`, `POST`, `OPTIONS`
- Headers: `Content-Type`, `Idempotency-Key`

---

## Public Endpoints

### Health Check
```http
GET /v1/health
```
Returns API health status.

**Response:**
```json
{
  "ok": true
}
```

### List Allocations
```http
GET /v1/allocations?status={status}&since={timestamp}&limit={limit}&cursor={cursor}
```

**Query Parameters:**
- `status` (optional): Filter by status (`conditional`, `confirmed`)
- `since` (optional): Unix timestamp or ISO date for filtering recent records
- `limit` (optional): Number of records to return (1-100, default: 50)
- `cursor` (optional): Pagination cursor from previous response

**Response:**
```json
{
  "items": [
    {
      "id": "doe-2024-001",
      "allocatedTo": "X-energy", 
      "kg": 1200,
      "status": "confirmed",
      "allocationDate": 1704067200,
      "deliveryWindowStart": 1735689600,
      "deliveryWindowEnd": 1767225600,
      "notes": "Initial production allocation",
      "updatedAt": 1704067200,
      "sourceDocId": "doc-001"
    }
  ],
  "nextCursor": "1704067200"
}
```

### Get Single Allocation
```http
GET /v1/allocations/{id}
```

**Response:**
```json
{
  "allocation": {
    "id": "doe-2024-001",
    "allocatedTo": "X-energy",
    "kg": 1200,
    "status": "confirmed",
    "allocationDate": 1704067200,
    "deliveryWindowStart": 1735689600, 
    "deliveryWindowEnd": 1767225600,
    "notes": "Initial production allocation",
    "updatedAt": 1704067200,
    "sourceDocId": "doc-001"
  },
  "deliveries": [
    {
      "id": "batch-001",
      "allocationId": "doe-2024-001",
      "kg": 300,
      "status": "planned",
      "shippedAt": null,
      "receivedAt": null,
      "notes": "Q2 2025 delivery",
      "updatedAt": 1704067200
    }
  ]
}
```

### List Changes
```http
GET /v1/changes?limit={limit}&cursor={cursor}
```

**Query Parameters:**
- `limit` (optional): Number of events to return (1-100, default: 50)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "items": [
    {
      "id": "event-001",
      "entityType": "allocation",
      "entityId": "doe-2024-001", 
      "changeJson": "{\"upserted\": 1, \"total\": 1}",
      "actor": "ingest/doe-allocations",
      "occurredAt": 1704067200
    }
  ],
  "nextCursor": "1704067200"
}
```

### List Sources
```http
GET /v1/sources
```

**Response:**
```json
{
  "items": [
    {
      "id": "doe-official",
      "name": "Department of Energy",
      "url": "https://www.energy.gov/"
    }
  ]
}
```

### Get Document
```http
GET /v1/documents/{id}
```

**Response:**
```json
{
  "id": "doc-001",
  "sourceId": "doe-official",
  "title": "DOE HALEU Allocation Framework 2024",
  "url": "https://www.energy.gov/haleu-allocation-2024",
  "publishedAt": 1704067200,
  "fetchedAt": 1704067200,
  "sha256": "a1b2c3d4e5f6"
}
```

---

## Internal Endpoints

### Import Allocations
```http
POST /internal/import/allocations
Content-Type: application/json
Idempotency-Key: unique-key-123
```

**Body (Single):**
```json
{
  "id": "doe-2024-001",
  "allocated_to": "X-energy",
  "kg": 1200,
  "status": "confirmed",
  "allocation_date": 1704067200,
  "delivery_window_start": 1735689600,
  "delivery_window_end": 1767225600,
  "notes": "Initial allocation",
  "source_doc_id": "doc-001"
}
```

**Body (Bulk):**
```json
{
  "items": [
    { /* allocation object */ },
    { /* allocation object */ }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "upserted": 1,
  "total": 1
}
```

### Import Delivery Batches
```http
POST /internal/import/deliveries  
Content-Type: application/json
Idempotency-Key: unique-key-456
```

**Body:**
```json
{
  "id": "batch-001",
  "allocation_id": "doe-2024-001",
  "kg": 300,
  "status": "planned",
  "shipped_at": 1717200000,
  "received_at": null,
  "notes": "First shipment"
}
```

### Manual Ingest Trigger
```http
POST /internal/ingest/doe
```
Manually triggers the DOE allocations ingest process.

---

## Error Responses

All errors return JSON with this structure:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `429` - Rate Limited  
- `500` - Internal Server Error

---

## Idempotency

Import endpoints support idempotency via the `Idempotency-Key` header:
- Same key + same body = cached response returned
- Keys are cached for 24 hours
- Recommended format: `{operation}-{timestamp}-{hash}`

## Pagination

List endpoints use cursor-based pagination:
- Use `nextCursor` from response as `cursor` parameter in next request
- Cursors are based on `updated_at` or `occurred_at` timestamps
- Maximum `limit` is 100 records per request
