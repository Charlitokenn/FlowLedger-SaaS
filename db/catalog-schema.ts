import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

/**
 * Catalog Database Schema
 * Tracks all tenant organizations and their Neon projects
 */

export const tenants = pgTable('tenants', {
  // Primary identifier (Clerk organization ID)
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Clerk organization details
  clerkOrgId: text('clerk_org_id').notNull().unique(),
  clerkOrgSlug: text('clerk_org_slug').notNull().unique(),
  name: text('name').notNull(),
  
  // Neon project details
  neonProjectId: text('neon_project_id').notNull().unique(),
  neonDatabaseName: text('neon_database_name').notNull().default('neondb'),
  connectionString: text('connection_string').notNull(), // Encrypted
  
  // Configuration
  region: text('region').notNull().default('aws-us-east-1'),
  isActive: boolean('is_active').notNull().default(true),
  
  // Audit fields
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type exports
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;