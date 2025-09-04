# HALEU Supply Watch - Monorepo Refactor Plan

## 🎯 Goals
- Clear separation of concerns
- Consistent naming conventions
- Better tooling and configuration management
- Improved developer experience
- Scalable structure for future growth

## 🏗️ New Structure

```
haleu-supply-watch/
├── apps/                           # Applications
│   ├── api/                        # Cloudflare Worker API
│   │   ├── src/
│   │   │   ├── handlers/           # Route handlers
│   │   │   ├── middleware/         # CORS, auth, rate limiting
│   │   │   ├── services/           # Business logic
│   │   │   └── types/              # API-specific types
│   │   ├── tests/                  # Integration tests
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   └── web/                        # Next.js web application
│       ├── src/
│       │   ├── app/                # App router pages
│       │   ├── components/         # React components
│       │   ├── lib/                # Client utilities
│       │   └── styles/             # CSS/styling
│       ├── public/                 # Static assets
│       └── package.json
│
├── packages/                       # Shared packages
│   ├── database/                   # Database schema & migrations
│   │   ├── migrations/             # SQL migration files
│   │   ├── seeds/                  # Seed data files
│   │   ├── src/
│   │   │   ├── schema.ts           # Drizzle schema
│   │   │   └── migrations.ts       # Migration utilities
│   │   └── package.json
│   │
│   ├── shared/                     # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/              # TypeScript types
│   │   │   ├── schemas/            # Zod validation schemas
│   │   │   ├── utils/              # Utility functions
│   │   │   └── constants/          # Shared constants
│   │   └── package.json
│   │
│   ├── ui/                         # Shared UI components (future)
│   │   ├── src/
│   │   │   ├── components/         # Reusable React components
│   │   │   └── styles/             # Shared styles
│   │   └── package.json
│   │
│   └── fixtures/                   # Test and demo data
│       ├── doe-allocations.csv
│       ├── design-fuel.json
│       └── package.json
│
├── tools/                          # Development tools
│   ├── build/                      # Build configurations
│   ├── eslint-config/              # Shared ESLint config
│   └── tsconfig/                   # Shared TypeScript configs
│
├── scripts/                        # Automation scripts
│   ├── deploy.ts                   # Deployment automation
│   ├── migrate.ts                  # Database migration runner
│   ├── seed.ts                     # Database seeding
│   └── dev.ts                      # Development workflow
│
├── docs/                           # Documentation
│   ├── RUNBOOK.md                  # Operations guide
│   ├── API.md                      # API documentation
│   ├── DEPLOYMENT.md               # Deployment guide
│   └── DEVELOPMENT.md              # Development setup
│
├── config/                         # Configuration files
│   ├── .env.example                # Environment template
│   ├── .gitignore
│   ├── .eslintrc.js
│   └── tsconfig.base.json
│
├── package.json                    # Root package.json
├── pnpm-workspace.yaml
└── README.md
```

## 📝 Migration Steps

### Phase 1: Restructure packages
1. Consolidate database schema and migrations
2. Clean up shared package
3. Create fixtures package
4. Remove empty/unused packages

### Phase 2: Improve apps structure
1. Better organize API source code
2. Restructure web app with src/ directory
3. Separate components and utilities

### Phase 3: Add tooling
1. Shared build configurations
2. Unified linting and formatting
3. Development scripts

### Phase 4: Documentation
1. Split documentation by concern
2. Create comprehensive guides
3. Add inline code documentation

## 🔧 Implementation

This refactor can be done incrementally without breaking the existing functionality:

1. **Non-breaking moves**: Relocate files that don't affect imports
2. **Update imports**: Batch update import paths
3. **Test thoroughly**: Ensure all functionality still works
4. **Update CI/CD**: Adjust any build pipelines

## 📊 Benefits

- **Clearer mental model**: Easier to understand project structure
- **Better scalability**: Easy to add new apps/packages
- **Improved DX**: Better tooling and development workflow
- **Consistent patterns**: Standardized across all packages
- **Easier onboarding**: New developers can navigate quickly
