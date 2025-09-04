# HALEU Supply Watch - Development Guide

## Quick Start

### First Time Setup
```bash
git clone <repository-url>
cd haleu-supply-watch
pnpm install
pnpm dev:init
```

### Daily Development
```bash
pnpm dev:start
```

This starts both API (`:8787`) and Web (`:3000`) servers with hot reload.

## Project Structure

```
haleu-supply-watch/
├── apps/                    # Applications
│   ├── api/                 # Cloudflare Worker API
│   │   ├── src/
│   │   │   ├── handlers/    # HTTP route handlers  
│   │   │   ├── middleware/  # CORS, rate limiting, etc.
│   │   │   ├── ingest/      # Data ingestion logic
│   │   │   └── utils/       # Utilities and helpers
│   │   ├── tests/           # Integration tests
│   │   └── wrangler.toml    # Cloudflare configuration
│   │
│   └── web/                 # Next.js web application
│       ├── app/             # App router pages
│       ├── lib/             # Client utilities
│       └── data/            # Static data files
│
├── packages/                # Shared packages
│   ├── database/            # Database schema & migrations
│   │   ├── migrations/      # SQL migration files
│   │   ├── seeds/           # Seed data
│   │   └── src/             # Drizzle schema
│   │
│   └── shared/              # Shared types & utilities
│       ├── src/
│       │   ├── types.ts     # TypeScript interfaces
│       │   ├── schemas.ts   # Zod validation schemas
│       │   └── index.ts     # Main exports
│       └── fixtures/        # Test and demo data
│
├── scripts/                 # Development & deployment scripts
├── docs/                    # Documentation
├── tools/                   # Shared build tools
└── config/                  # Configuration files
```

## Development Workflow

### Environment Setup

1. **Environment Variables**
   ```bash
   cp config/env.example apps/web/.env.local
   ```

2. **Database Setup**
   ```bash
   pnpm migrate:local  # Create tables
   pnpm seed:local     # Add sample data
   ```

3. **Verify Setup**
   ```bash
   node scripts/dev.js status
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:init` | First-time setup (database + environment) |
| `pnpm dev:start` | Start both API and web servers |
| `pnpm dev:api` | Start API server only |
| `pnpm dev:web` | Start web server only |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm build` | Build all packages |

### Database Operations

```bash
# Migrations
pnpm migrate:local          # Run migrations locally
cd apps/api && wrangler d1 execute hsw --remote --file ../../packages/database/migrations/0001_init.sql

# Seeding
pnpm seed:local             # Seed local database
cd apps/api && wrangler d1 execute hsw --remote --file ../../packages/database/seeds/seed-remote.sql

# Reset local database
node scripts/dev.js reset

# View data
cd apps/api && wrangler d1 execute hsw --local --command "SELECT * FROM allocation LIMIT 5;"
```

### Testing

```bash
# Run all tests
pnpm test

# Run API tests only
cd apps/api && pnpm test

# Run tests in watch mode
cd apps/api && pnpm test:watch

# Test specific endpoints
curl http://localhost:8787/v1/health
curl http://localhost:8787/v1/allocations
```

## Code Organization

### API Structure

```
apps/api/src/
├── index.ts                 # Main Hono app and routes
├── bindings.d.ts           # Cloudflare bindings types
├── handlers/               # Route handlers (future)
├── middleware/
│   ├── cors.ts             # CORS configuration
│   └── rateLimiter.ts      # Rate limiting logic
├── ingest/
│   ├── doeAllocations.ts   # DOE data ingestion
│   └── __tests__/          # Ingest tests
└── utils/
    ├── idempotency.ts      # Request idempotency
    ├── logging.ts          # Structured logging
    └── __tests__/          # Utility tests
```

### Web App Structure

```
apps/web/
├── app/
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Home page (allocations table)
│   ├── changes/
│   │   └── page.tsx        # What Changed page
│   └── design-fuel/
│       └── page.tsx        # Design↔Fuel matrix
├── lib/
│   └── api.ts              # API client utilities
└── data/
    └── design_fuel.json    # Static reactor design data
```

### Shared Packages

```
packages/
├── database/
│   ├── src/schema.ts       # Drizzle ORM schema
│   ├── migrations/         # SQL migrations
│   └── seeds/              # Seed data files
│
└── shared/
    ├── src/
    │   ├── types.ts        # TypeScript interfaces
    │   ├── schemas.ts      # Zod validation schemas
    │   └── index.ts        # Package exports
    └── fixtures/           # Test/demo data
```

## Adding New Features

### 1. API Endpoints

1. **Add route** to `apps/api/src/index.ts`:
   ```typescript
   app.get('/v1/new-endpoint', async (c) => {
     // Implementation
   });
   ```

2. **Add validation** in `packages/shared/src/schemas.ts`:
   ```typescript
   export const NewEndpointSchema = z.object({
     // Schema definition
   });
   ```

3. **Add types** in `packages/shared/src/types.ts`:
   ```typescript
   export interface NewEndpointResponse {
     // Type definition
   }
   ```

4. **Add tests** in `apps/api/src/__tests__/`:
   ```typescript
   describe('New Endpoint', () => {
     it('should work', () => {
       // Test implementation
     });
   });
   ```

### 2. Web Pages

1. **Create page** in `apps/web/app/new-page/page.tsx`:
   ```typescript
   export default function NewPage() {
     return <div>New Page</div>;
   }
   ```

2. **Add navigation** to `apps/web/app/layout.tsx`:
   ```typescript
   <Link href="/new-page">New Page</Link>
   ```

3. **Add API calls** in `apps/web/lib/api.ts`:
   ```typescript
   async getNewData(): Promise<NewData> {
     return this.request<NewData>('/v1/new-endpoint');
   }
   ```

### 3. Database Changes

1. **Create migration** in `packages/database/migrations/`:
   ```sql
   -- packages/database/migrations/0003_new_feature.sql
   ALTER TABLE existing_table ADD COLUMN new_field TEXT;
   ```

2. **Update schema** in `packages/database/src/schema.ts`:
   ```typescript
   export const existingTable = sqliteTable("existing_table", {
     // ... existing fields
     newField: text("new_field"),
   });
   ```

3. **Update types** in `packages/shared/src/types.ts`:
   ```typescript
   export interface ExistingTable {
     // ... existing fields
     newField?: string;
   }
   ```

## Debugging

### API Debugging

```bash
# View real-time logs
cd apps/api && wrangler tail --local

# Debug specific requests
curl -v http://localhost:8787/v1/health

# Check database state
cd apps/api && wrangler d1 execute hsw --local --command "SELECT COUNT(*) FROM allocation;"
```

### Web App Debugging

- **Browser DevTools**: Network tab for API calls
- **Next.js DevTools**: React components and performance
- **Console Logs**: Check browser console for errors

### Common Issues

1. **"Module not found" errors**:
   ```bash
   pnpm install
   ```

2. **Database connection errors**:
   ```bash
   node scripts/dev.js status
   node scripts/dev.js reset
   ```

3. **CORS errors**:
   - Check API is running on `:8787`
   - Verify web app uses correct API URL

4. **Environment variable errors**:
   ```bash
   # Check .env.local exists
   ls apps/web/.env.local
   
   # Verify content
   cat apps/web/.env.local
   ```

## Code Quality

### Linting
```bash
pnpm lint          # Lint all packages
pnpm lint --fix    # Auto-fix issues
```

### Type Checking
```bash
pnpm typecheck     # Check all TypeScript
```

### Testing
```bash
pnpm test          # Run all tests
pnpm test --watch  # Watch mode
```

### Pre-commit Checklist
- [ ] Code lints without errors
- [ ] TypeScript compiles without errors  
- [ ] Tests pass
- [ ] API endpoints work locally
- [ ] Web app loads without errors

## Performance

### API Optimization
- Use prepared statements for database queries
- Implement proper pagination
- Add appropriate indexes
- Monitor cold start times

### Web App Optimization
- Minimize client-side data fetching
- Use Next.js Image optimization
- Implement proper caching strategies
- Monitor Core Web Vitals

## Security

### API Security
- Validate all inputs with Zod schemas
- Use parameterized queries
- Implement rate limiting
- Set proper CORS headers

### Environment Security
- Never commit secrets to git
- Use Cloudflare's secure environment variables
- Rotate API keys regularly
- Monitor access logs
