# HALEU Supply Watch - Deployment Guide

## Overview

This application deploys to Cloudflare's edge platform:
- **API**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Web App**: Cloudflare Pages (Next.js)

## Prerequisites

1. **Cloudflare Account** with access to Workers, Pages, D1, and R2
2. **Wrangler CLI** installed and authenticated
3. **Node.js 18+** and **pnpm 9+**
4. **Git** for version control

## Initial Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd haleu-supply-watch
pnpm install
```

### 2. Create Cloudflare Resources

#### Create D1 Database
```bash
wrangler d1 create hsw
```
Copy the returned `database_id` to `apps/api/wrangler.toml`.

#### Create R2 Bucket
```bash
wrangler r2 bucket create hsw-artifacts
```

#### Verify Configuration
Update `apps/api/wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "hsw"
database_id = "your-database-id-here"

[[r2_buckets]]
binding = "R2"
bucket_name = "hsw-artifacts"
```

## Development Deployment

### 1. Setup Database
```bash
# Run migrations
pnpm migrate:local

# Seed with sample data  
pnpm seed:local
```

### 2. Start Development Servers
```bash
# Start both API and web servers
pnpm dev

# Or start individually:
pnpm dev:api  # http://localhost:8787
pnpm dev:web  # http://localhost:3000
```

### 3. Environment Configuration
Copy `config/env.example` to `apps/web/.env.local`:
```bash
cp config/env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
```

## Production Deployment

### 1. Deploy API

```bash
cd apps/api

# Deploy the Worker
wrangler deploy

# Run migrations on production database
wrangler d1 execute hsw --remote --file ../../packages/database/migrations/0001_init.sql

# Apply schema updates if needed
wrangler d1 execute hsw --remote --file ../../packages/database/migrations/0002_minimal_migration.sql

# Seed production database (optional)
wrangler d1 execute hsw --remote --file ../../packages/database/seeds/seed-remote.sql
```

**Note the deployed API URL** (e.g., `https://hsw-api.your-subdomain.workers.dev`)

### 2. Deploy Web App

```bash
cd apps/web

# Set production API URL
wrangler pages secret put NEXT_PUBLIC_API_BASE_URL
# Enter your production API URL when prompted

# Build for production
pnpm pages:build

# Deploy to Pages
wrangler pages deploy .vercel/output/static --project-name haleu-supply-watch
```

### 3. Verify Deployment

Test your production API:
```bash
curl https://your-api-url.workers.dev/v1/health
curl https://your-api-url.workers.dev/v1/allocations
```

Visit your web app:
```
https://haleu-supply-watch.pages.dev
```

## Database Management

### Migrations
```bash
# Local database
pnpm migrate:local

# Production database (careful!)
cd apps/api
wrangler d1 execute hsw --remote --file ../../packages/database/migrations/0001_init.sql
```

### Seeding
```bash
# Local development data
pnpm seed:local

# Production sample data
cd apps/api  
wrangler d1 execute hsw --remote --file ../../packages/database/seeds/seed-remote.sql
```

### Backup
```bash
# Export production database
wrangler d1 export hsw --remote --output backup-$(date +%Y%m%d).sql
```

## Environment Variables

### API (Cloudflare Workers)
Set via `wrangler.toml` or Cloudflare dashboard:
- `API_RATE_LIMIT_PER_MIN` - Rate limit (default: 60)
- `DB` - D1 database binding
- `R2` - R2 bucket binding

### Web App (Cloudflare Pages)
Set via `wrangler pages secret` or Cloudflare dashboard:
- `NEXT_PUBLIC_API_BASE_URL` - Production API URL

## Monitoring

### View Logs
```bash
# Real-time Worker logs
wrangler tail

# Pages deployment logs
wrangler pages logs --project-name haleu-supply-watch
```

### Analytics
```bash
# Worker analytics
wrangler analytics --environment production

# D1 database info
wrangler d1 info hsw
```

## Troubleshooting

### Common Issues

**"Module not found" errors**
```bash
# Reinstall dependencies
pnpm install

# Check workspace linking
pnpm list --depth=0
```

**Database connection errors**
```bash
# Verify database exists
wrangler d1 list

# Check database ID in wrangler.toml
wrangler d1 info hsw
```

**CORS errors**
- Check API CORS configuration in `apps/api/src/middleware/cors.ts`
- Verify web app origin is in allowed list

**Environment variable errors**
```bash
# List Pages environment variables
wrangler pages secret list --project-name haleu-supply-watch

# Test API connectivity
curl https://your-api-url.workers.dev/v1/health
```

### Debug Commands
```bash
# Test local API
curl http://localhost:8787/v1/health

# Check production API  
curl https://your-api-url.workers.dev/v1/health

# Validate database schema
wrangler d1 execute hsw --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

## CI/CD (Future Enhancement)

For automated deployments, consider:
1. **GitHub Actions** for automated deployments
2. **Environment-specific** configurations
3. **Database migration automation**
4. **Test automation** before deployment

Example workflow:
- Push to `main` → Deploy to production
- Push to `develop` → Deploy to staging
- Pull requests → Deploy preview environments

## Security Considerations

- **API Keys**: Never commit secrets to git
- **Environment Variables**: Use Cloudflare's secure storage
- **CORS**: Restrict to known origins
- **Rate Limiting**: Monitor and adjust as needed
- **Database Access**: Use D1's built-in security features
