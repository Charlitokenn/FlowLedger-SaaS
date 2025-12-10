# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

FlowLedger is a multi-tenant real estate management SaaS platform built with Next.js 16. It implements a **subdomain-based multi-tenancy architecture** where each organization gets:
- Their own Neon PostgreSQL database (provisioned on-demand)
- A dedicated subdomain (e.g., `orgname.flowledger.com`)
- Isolated data and schema per tenant

**Key Technologies:**
- **Framework**: Next.js 16 (App Router, React 19, Turbopack)
- **Authentication**: Clerk (organization-based auth)
- **Database**: Neon PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS 4, shadcn/ui components, Radix UI primitives
- **State Management**: nuqs (URL state), React Hook Form + Zod

## Development Commands

### Running the Application
```bash
# Start dev server (with Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Type checking (no emit)
npm run type-check
```

### Database Operations

**Catalog Database** (tracks all tenants and their Neon projects):
```bash
# Generate catalog migrations
npm run db:generate:catalog

# Run catalog migrations
npm run db:migrate:catalog
```

**Tenant Databases** (each organization's data):
```bash
# Generate tenant schema migrations
npm run db:generate:tenants

# Migrate all existing tenants
npm run db:migrate:tenants
```

### Testing
There are no test scripts configured. To add tests, you'll need to set up a testing framework first.

## Architecture

### Multi-Tenancy Model

FlowLedger uses a **database-per-tenant** architecture with subdomain-based routing:

1. **Catalog Database** (`CATALOG_DATABASE_URL`):
   - Single shared database tracking all tenants
   - Schema: `database/catalog-schema.ts`
   - Stores: organization metadata, Neon project IDs, encrypted connection strings

2. **Tenant Databases** (`DATABASE_URL` per tenant):
   - Each organization gets a separate Neon project
   - Schema: `database/tenant-schema.ts`
   - Contains: contacts, projects, plots, suppliers, payments, etc.

3. **Just-in-Time Provisioning** (`lib/tenant-db.ts`):
   - When a new org is created in Clerk, the first request automatically:
     - Creates a new Neon project via API
     - Runs migrations on the new database
     - Stores encrypted connection string in catalog
   - Connection pooling via `connectionCache`

### Routing Structure

**Subdomain-Based Routing** (handled by `proxy.ts`, renamed from middleware.ts in Next.js 16):
- `admin.flowledger.com` → Admin dashboard (super_admin only)
- `{orgSlug}.flowledger.com` → Tenant application
- `flowledger.com` → Marketing pages (public)

**Route Groups** (in `app/`):
- `(marketing)/` - Public marketing pages (features, pricing, blog)
- `(auth)/` - Authentication flows (sign-in, sign-up, callback)
- `(tenants)/` - Main tenant application (requires org context)
  - `(clients)/`, `(contacts)/`, `(finance)/`, `(messaging)/`, `(projects)/`, `(sales)/`, `(suppliers)/`
- `(admin)/` - Platform admin tools (super_admin only)

### Tenant Context Resolution

The `proxy.ts` middleware enriches requests with tenant context headers:
- `x-clerk-org-id` - Clerk organization ID
- `x-clerk-org-slug` - Organization slug (used for subdomain)
- `x-clerk-org-role` - User's role in the organization

Server components access tenant context via:
```typescript
import { requireTenantContext, getTenantDbForRequest } from '@/lib/tenant-context';

// Get tenant metadata
const { orgId, orgSlug, orgRole, orgName } = await requireTenantContext();

// Get tenant database connection
const { db, tenant } = await getTenantDbForRequest();
```

### Database Schema Patterns

**Catalog Schema** (`database/catalog-schema.ts`):
- `tenants` table with Clerk org mapping and encrypted Neon credentials

**Tenant Schema** (`database/tenant-schema.ts`):
- Real estate specific: projects, plots, clients, suppliers
- Uses Tanzanian regions/districts enums
- Common patterns: UUID primary keys, timestamps, approval status enums

**Migrations**:
- Two separate migration folders: `migrations-catalog/` and `migrations-tenants/`
- Two Drizzle configs: `drizzle.catalog.config.ts` and `drizzle.tenants.config.ts`
- Catalog migrations run once; tenant migrations run for each tenant

### Component Architecture

**UI Components** (`components/ui/`):
- shadcn/ui based components (see `components.json` for config)
- Custom: `tenant-sidebar.tsx`, `admin-sidebar.tsx`

**Reusable Components** (`components/reusable components/`):
- Wrappers around Radix UI: dialogs, sheets, popovers, tooltips
- Custom toast system via `toast-context.tsx`

**Data Tables** (`components/data-table/`):
- TanStack Table based
- Advanced features: filtering, sorting, pagination, column pinning
- Pattern: Define `columns.tsx` with column definitions, use `<DataTable>` wrapper

**Forms** (`components/forms/`):
- React Hook Form + Zod validation
- Reusable field components: `input-field.tsx`, `select-field.tsx`

### Server Actions

**Pattern**: All server actions use `"use server"` directive and are in `lib/actions/`

**Organization**:
- `admin/` - Platform admin operations (tenant management)
- `tenants/` - Tenant-scoped operations (contacts, projects, etc.)

**Tenant Context**: Actions requiring tenant data should use `getTenantDbForRequest()`:
```typescript
"use server"
import { getTenantDbForRequest } from '@/lib/tenant-context';

export async function getContacts() {
  const { db, tenant } = await getTenantDbForRequest();
  // Use db to query tenant-specific data
}
```

### Security & Encryption

**Connection String Encryption** (`lib/encryption.ts`):
- Uses AES-256-GCM for encrypting tenant connection strings
- Requires `ENCRYPTION_KEY` (32-byte hex string) in environment
- Format: `iv:authTag:encryptedData`

**Environment Variables Required**:
- `CATALOG_DATABASE_URL` - Catalog database connection
- `NEON_API_KEY` - For provisioning new tenant databases
- `ENCRYPTION_KEY` - For encrypting tenant connection strings
- `NEXT_PUBLIC_CLERK_*` - Clerk authentication config

### Path Aliases

Configured in `tsconfig.json`:
- `@/*` - Maps to project root

Common imports:
- `@/components/*` - UI components
- `@/lib/*` - Utilities, actions, database
- `@/database/*` - Schema definitions
- `@/hooks/*` - React hooks
- `@/types/*` - TypeScript types

## Important Patterns

### Adding a New Tenant Feature

1. Add schema to `database/tenant-schema.ts`
2. Generate migrations: `npm run db:generate:tenants`
3. Run migrations on all tenants: `npm run db:migrate:tenants`
4. Create server actions in `lib/actions/tenants/`
5. Build UI in `app/(tenants)/(feature-group)/`
6. Use `getTenantDbForRequest()` to access tenant database

### Working with Forms

1. Define Zod schema for validation
2. Use React Hook Form's `useForm` with zodResolver
3. Leverage reusable field components from `components/forms/fields/`
4. Submit to server actions

### Data Table Implementation

1. Define columns in `columns.tsx` with TanStack Table column definitions
2. Use `<DataTable>` component with configured table instance
3. Add filters/toolbar using data-table components
4. Provide empty state via `emptyTitle`, `emptyDescription` props

### Subdomain Development (Localhost)

Use `{orgSlug}.localhost:3000` pattern for testing subdomain routing locally. The `proxy.ts` middleware handles `*.localhost` patterns correctly.

## File Naming Conventions

- **Route files**: `page.tsx`, `layout.tsx`, `loading.tsx`
- **Components**: kebab-case (e.g., `tenant-sidebar.tsx`)
- **Actions**: `*.actions.ts`
- **Types**: PascalCase types exported from schema or dedicated type files

## Windows Development Notes

- Uses PowerShell (pwsh 5.1) - commands should be PowerShell compatible
- Path separators automatically handled by Next.js
- Git on Windows: ensure line endings are configured properly
