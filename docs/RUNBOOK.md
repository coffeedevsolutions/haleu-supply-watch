# HALEU Supply Watch - Runbook

This document provides operational instructions for the HALEU Supply Watch MVP.

## Architecture Overview

- **API**: Cloudflare Worker with Hono framework
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 for artifacts and snapshots
- **Web**: Next.js 15 on Cloudflare Pages
- **Monorepo**: pnpm workspace with shared packages

## Prerequisites

- Node.js 18+ and pnpm 9+
- Cloudflare account with Workers/Pages/D1/R2 access
- Wrangler CLI configured (`wrangler auth login`)

## Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create `.env.local` in `apps/web/`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
```

For production, set in Cloudflare Pages:
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.workers.dev
```

### 3. Create Cloudflare Resources

#### D1 Database
```bash
# Create database
wrangler d1 create hsw

# Update database_id in apps/api/wrangler.toml with the returned ID
```

#### R2 Bucket
```bash
# Create bucket
wrangler r2 bucket create hsw-artifacts

# Verify bucket name matches binding in apps/api/wrangler.toml
```

## Development Workflow

### 1. Database Migration and Seeding

```bash
# Run migrations locally
pnpm migrate:local

# Seed local development data
cd apps/api
pnpm seed:local

# Verify tables were created
wrangler d1 execute hsw --local --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### 2. Start Development Servers

```bash
# Terminal 1: Start API
pnpm dev:api

# Terminal 2: Start Web
pnpm dev:web

# Or start both together
pnpm dev
```

The API will be available at `http://localhost:8787`
The web app will be available at `http://localhost:3000`

### 3. Manual Testing

Test API endpoints:
```bash
# Health check
curl http://localhost:8787/v1/health

# List allocations
curl http://localhost:8787/v1/allocations

# Get specific allocation
curl http://localhost:8787/v1/allocations/doe-2024-001

# List recent changes
curl http://localhost:8787/v1/changes

# Manual ingest trigger
curl -X POST http://localhost:8787/internal/ingest/doe
```

Test import functionality:
```bash
# Import single allocation
curl -X POST http://localhost:8787/internal/import/allocations \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-$(date +%s)" \
  -d '{
    "id": "test-001",
    "allocated_to": "Test Company",
    "kg": 500,
    "status": "confirmed",
    "notes": "Test allocation"
  }'

# Import bulk allocations
curl -X POST http://localhost:8787/internal/import/allocations \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: bulk-test-$(date +%s)" \
  -d '{
    "items": [
      {
        "id": "bulk-001",
        "allocated_to": "Bulk Test 1",
        "kg": 300,
        "status": "conditional"
      },
      {
        "id": "bulk-002",
        "allocated_to": "Bulk Test 2",
        "kg": 400,
        "status": "confirmed"
      }
    ]
  }'
```

## Production Deployment

### 1. Deploy API (Cloudflare Workers)

```bash
# Navigate to API directory
cd apps/api

# Deploy to production
wrangler deploy

# Run migrations on production database
wrangler d1 execute hsw --remote --file ../../migrations/0001_init.sql

# Seed production database (CAREFUL!)
pnpm seed:remote
# Type 'yes' when prompted to confirm
```

### 2. Deploy Web (Cloudflare Pages)

```bash
# Navigate to web directory
cd apps/web

# Set production environment variable
wrangler pages secret put NEXT_PUBLIC_API_BASE_URL
# Enter your production API URL when prompted

# Build for Pages
pnpm pages:build

# Deploy to Pages
wrangler pages deploy .vercel/output/static --project-name haleu-supply-watch
```

### 3. Verify Production Deployment

```bash
# Test production API
curl https://your-api-domain.workers.dev/v1/health

# Test production web app
# Visit https://haleu-supply-watch.pages.dev
```

## Operational Tasks

### Database Operations

```bash
# Execute custom SQL (local)
wrangler d1 execute hsw --local --command "SELECT COUNT(*) FROM allocation;"

# Execute custom SQL (production)
wrangler d1 execute hsw --remote --command "SELECT COUNT(*) FROM allocation;"

# Backup production database
wrangler d1 export hsw --remote --output backup-$(date +%Y%m%d).sql

# View recent update events
wrangler d1 execute hsw --remote --command "
  SELECT entity_type, entity_id, actor, occurred_at, change_json 
  FROM update_event 
  ORDER BY occurred_at DESC 
  LIMIT 10;
"
```

### R2 Operations

```bash
# List objects in bucket
wrangler r2 object list hsw-artifacts

# Download latest fixture
wrangler r2 object get hsw-artifacts/fixtures/doe-allocations-latest.csv --file latest.csv

# List snapshots
wrangler r2 object list hsw-artifacts --prefix snapshots/doe-allocations/

# Download specific snapshot
wrangler r2 object get hsw-artifacts/snapshots/doe-allocations/1704067200.csv --file snapshot.csv
```

### Monitoring and Debugging

```bash
# View Worker logs (live)
wrangler tail

# View Worker analytics
wrangler analytics --environment production

# Check cron trigger status
wrangler cron get

# View D1 analytics
wrangler d1 info hsw

# Test scheduled trigger manually
curl -X POST https://your-api-domain.workers.dev/internal/ingest/doe
```

## Testing

### Run Unit Tests

```bash
# Test API utilities and validation
cd apps/api
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Integration Testing

```bash
# Test full API locally with fresh database
cd apps/api
wrangler d1 execute hsw --local --command "DELETE FROM allocation;"
wrangler d1 execute hsw --local --command "DELETE FROM update_event;"
pnpm seed:local

# Trigger ingest and verify
curl -X POST http://localhost:8787/internal/ingest/doe
curl http://localhost:8787/v1/changes
```

## Troubleshooting

### Common Issues

**"Missing NEXT_PUBLIC_API_BASE_URL" error**
- Ensure environment variable is set in web app
- For local dev: check `apps/web/.env.local`
- For production: check Cloudflare Pages environment variables

**CORS errors**
- Verify API is running and accessible
- Check CORS configuration in `apps/api/src/middleware/cors.ts`
- Ensure origin is in allowed list

**Database connection errors**
- Verify D1 database exists: `wrangler d1 list`
- Check database_id in `apps/api/wrangler.toml`
- Ensure migrations have been run

**R2 access errors**
- Verify R2 bucket exists: `wrangler r2 bucket list`
- Check bucket name in `apps/api/wrangler.toml`
- Ensure Worker has R2 permissions

### Debug Commands

```bash
# Check configuration
wrangler whoami
wrangler d1 list
wrangler r2 bucket list

# Validate local setup
cd apps/api
wrangler dev --local --inspect

# Check environment variables
wrangler pages secret list --project-name haleu-supply-watch
```

## Security Considerations

- **API Rate Limiting**: Configured for 60 requests/minute per IP
- **CORS**: Restricted to localhost and Pages domain
- **Input Validation**: All inputs validated with Zod schemas
- **Idempotency**: Supported for import endpoints
- **No Authentication**: MVP doesn't include auth (add for production)

## Performance Optimization

- **Database**: Indexes on updated_at, allocation_id, occurred_at
- **API**: Pagination with cursors for large datasets
- **Caching**: Static assets cached via Cloudflare
- **Edge Deployment**: Global distribution via Cloudflare network

## Maintenance

### Regular Tasks

1. **Weekly**: Review update events for anomalies
2. **Monthly**: Check R2 storage usage and cleanup old snapshots
3. **Quarterly**: Review rate limiting and CORS configuration

### Backup Strategy

1. **Database**: Export before major changes
2. **R2**: Snapshots automatically retained
3. **Code**: Git repository with tags for releases

### Monitoring Metrics

- API response times and error rates
- Database query performance
- R2 storage usage
- Ingest job success/failure rates
- Web app Core Web Vitals

## Contact and Support

For issues or questions:
1. Check this runbook first
2. Review application logs via `wrangler tail`
3. Check Cloudflare dashboard for service status
4. Consult team documentation or create support ticket

---

**Last Updated**: January 2025
**Version**: MVP 1.0
