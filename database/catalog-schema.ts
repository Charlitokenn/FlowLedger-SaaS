import { pgTable, text, timestamp, boolean, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';

/**
 * Catalog Database Schema
 * Tracks all tenant organizations and their Neon projects
 *
 * Note: The catalog DB also holds global reference data that should not live in each tenant DB.
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

  //Other Settings
  slogan: text('slogan'),
  mobile: text('mobile'),
  email: text('email'),
  address: text('address'),
  color: text('color'),
  senderID: text('sender_id'),
  website: text('website'),
});

/**
 * Global Locations reference table (central source of truth).
 * Used for dependent selects such as Region -> District.
 */
export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    region: text('region').notNull(),
    district: text('district').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => ({
    regionDistrictUnique: uniqueIndex('locations_region_district_unique').on(
      t.region,
      t.district,
    ),
    regionIdx: index('locations_region_idx').on(t.region),
  }),
);

// Type exports
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
