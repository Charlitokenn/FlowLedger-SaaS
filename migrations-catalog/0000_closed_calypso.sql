CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text NOT NULL,
	"clerk_org_slug" text NOT NULL,
	"name" text NOT NULL,
	"neon_project_id" text NOT NULL,
	"neon_database_name" text DEFAULT 'neondb' NOT NULL,
	"connection_string" text NOT NULL,
	"region" text DEFAULT 'aws-us-east-1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_clerk_org_id_unique" UNIQUE("clerk_org_id"),
	CONSTRAINT "tenants_clerk_org_slug_unique" UNIQUE("clerk_org_slug"),
	CONSTRAINT "tenants_neon_project_id_unique" UNIQUE("neon_project_id")
);
