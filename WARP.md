# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

FlowLedger is a multi-tenant SaaS real estate management platform built with Next.js 16, leveraging Clerk for authentication and Neon PostgreSQL for per-tenant database isolation.

## Common Commands

### Development
```powershell
npm run dev                # Start development server with Turbopack
npm run build              # Build production bundle
npm start                  # Start production server
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript type checking
```

### Database
```powershell
npm run db:generate        # Generate Drizzle migrations
npm run db:migrate:all     # Migrate all tenant databases
```

## Architecture Overview

### Multi-Tenant Database Architecture

FlowLedger implements **database-per-tenant** isolation using Neon PostgreSQL:

- **Catalog Database** (`CATALOG_DATABASE_URL`): Central registry tracking all tenants and their Neon projects
- **Tenant Databases**: Each organization gets a dedicated Neon project with isolated data

**Key Components:**

- `lib/tenant-db.ts`: Connection manager with JIT (Just-in-Time) provisioning fallback
- `lib/neon-api.ts`: Neon API client for creating/managing tenant projects
- `lib/tenant-setup.ts`: Schema migration runner for new tenant databases
- `lib/encryption.ts`: AES-256-GCM encryption for connection strings

**Provisioning Flow:**

1. Clerk webhook (`organization.created`) triggers tenant creation
2. Creates Neon project via API
3. Runs migrations from `./migrations`
4. Encrypts connection string and stores in catalog
5. JIT fallback provisions missing tenants on first access

### Database Schemas

- **Catalog Schema** (`db/catalog-schema.ts`): Defines `tenants` table
- **Tenant Schema** (`db/tenant-schema.ts`): Shared schema deployed to all tenant databases
  - Includes: contacts, projects, and related business entities
  - Uses Drizzle ORM enums for regions, districts, approval status, etc.

### Authentication & Authorization

- **Clerk** handles authentication and organization management
- Session claims include: `orgId`, `orgSlug`, `orgName`, `orgLogo`, `role`
- Tenant context derived from `sessionClaims` in layouts
- Admin roles: `admin`, `super_admin`

### Routing Structure

```
app/
├── (auth)/                 # Authentication routes
│   ├── sign-in/
│   └── sign-up/
├── (tenants)/              # Protected tenant routes
│   ├── (clients)/
│   ├── (contacts)/
│   ├── (finance)/
│   ├── (messaging)/
│   ├── (projects)/
│   ├── (sales)/
│   └── (suppliers)/
├── (admin)/                # Admin-only routes
│   ├── admin/
│   ├── bulk-sms/
│   ├── clickpesa/
│   ├── revenue/
│   └── tenants/
└── api/
    ├── webhooks/clerk/     # Tenant provisioning webhook
    └── live/[table]/       # Dynamic API routes
```

Route groups (parentheses) organize routes without affecting URLs.

### Key Technologies

- **Next.js 16** with App Router and React Server Components
- **TypeScript** with strict mode
- **Drizzle ORM** for type-safe database queries
- **Clerk** for authentication and organization management
- **Neon PostgreSQL** for serverless, per-tenant databases
- **Tailwind CSS 4** with custom components via Radix UI
- **nuqs** for type-safe URL search params
- **next-themes** for theme management

### Component Architecture

- `components/ui/`: Shadcn/Radix UI components (buttons, dialogs, sidebars, etc.)
- `components/data-table/`: Reusable data table components
- `components/`: Custom reusable components (toasts, alerts, sheets, etc.)
- `hooks/`: Custom React hooks (data-table, toast, debounce, etc.)

### Path Aliases

Use `@/*` for absolute imports from the project root:
```typescript
import { getTenantDb } from '@/lib/tenant-db';
import { tenants } from '@/db/catalog-schema';
```

## Environment Variables Required

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET

# Database
CATALOG_DATABASE_URL        # Central tenant registry
DATABASE_URL               # Used by Drizzle for migrations

# Neon API
NEON_API_KEY

# Encryption
ENCRYPTION_KEY             # 64 hex characters (32 bytes)

# App Configuration
NEXT_PUBLIC_API_ENDPOINT
```

Generate encryption key with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Important Patterns

### Accessing Tenant Database

Always use `getTenantDb()` which handles:
- Connection caching
- JIT provisioning for missing tenants
- Active status validation
- Connection string decryption

```typescript
import { getTenantDb } from '@/lib/tenant-db';
import { auth } from '@clerk/nextjs/server';

const { sessionClaims } = await auth();
const db = await getTenantDb(
  sessionClaims.orgId,
  sessionClaims.orgSlug,
  sessionClaims.orgName
);

const contacts = await db.select().from(contactsTable);
```

### Database Migrations

1. Modify schema in `db/tenant-schema.ts`
2. Generate migration: `npm run db:generate`
3. Apply to all tenants: `npm run db:migrate:all`

The migration script (`scripts/migrate-all-tenants.ts`) iterates all tenants and applies pending migrations.

### Webhook Handling

Clerk webhooks use Svix for signature verification. The webhook handler:
- Creates tenant on `organization.created`
- Soft-deletes (deactivates) on `organization.deleted`
- Returns 500 on failure to trigger Clerk retry

### Security Considerations

- Connection strings are encrypted at rest using AES-256-GCM
- Never log decrypted connection strings
- Tenant isolation enforced at database level
- Admin routes check `sessionClaims.o.rol`

## Testing & Quality

Run type checking before committing:
```powershell
npm run type-check
npm run lint
```

## Conventions

- Use Server Components by default; add `"use client"` only when needed
- Font configuration uses Poppins (headings) and Lato (body)
- UI components use `cn()` utility for conditional Tailwind classes
- All timestamps use `timestamp('field', { withTimezone: true })`
