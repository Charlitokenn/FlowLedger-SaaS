CREATE TYPE "public"."account_type" AS ENUM('Bank Account', 'Mobile Wallet');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('APPROVED', 'REJECTED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('CLIENT', 'LAND_SELLER', 'AUDITOR', 'ICT SUPPORT', 'STATIONERY', 'SURVEYOR');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."id_type" AS ENUM('NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'VOTER_ID');--> statement-breakpoint
CREATE TYPE "public"."plot_availability" AS ENUM('AVAILABLE', 'RESERVED', 'SOLD');--> statement-breakpoint
CREATE TYPE "public"."relationship" AS ENUM('PARENT', 'SIBLING', 'SPOUSE', 'FRIEND', 'OTHER');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"account_type" "account_type" NOT NULL,
	"telco_name" varchar(100),
	"telco_number" varchar(20),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"mobile_number" text,
	"alt_mobile_number" text,
	"email" text,
	"gender" "gender",
	"contact_type" "contact_type" DEFAULT 'CLIENT',
	"id_type" "id_type",
	"id_number" text,
	"regions" varchar,
	"district" varchar,
	"ward" text,
	"street" text,
	"first_NOK_Name" text,
	"first_NOK_Mobile" text,
	"first_NOK_Relationship" "relationship",
	"second_NOK_Name" text,
	"second_NOK_Mobile" text,
	"second_NOK_Relationship" "relationship",
	"clientPhoto" text,
	"added_by" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "contacts_clientPhoto_unique" UNIQUE("clientPhoto")
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plot_number" numeric NOT NULL,
	"surveyed_plot_number" varchar(50) NOT NULL,
	"availability" "plot_availability" DEFAULT 'AVAILABLE' NOT NULL,
	"unsurveyed_size" numeric NOT NULL,
	"surveyed_size" numeric,
	"project_id" uuid NOT NULL,
	"contact_id" uuid,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "plots_surveyed_plot_number_unique" UNIQUE("surveyed_plot_number")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_name" text NOT NULL,
	"project_details" text,
	"acquisition_date" date NOT NULL,
	"sqm_bought" numeric,
	"acquisition_value" numeric NOT NULL,
	"region" text,
	"district" text,
	"ward" text DEFAULT '',
	"project_owner" text,
	"committment_amount" numeric,
	"lga_fee" numeric,
	"street" text,
	"tp_number" text,
	"tp_status" text,
	"survey_status" text,
	"survey_number" text,
	"original_contract_pdf" text,
	"supplier_name" uuid,
	"mwenyekiti_name" text,
	"mwenyekiti_mobile" text,
	"mtendaji_name" text,
	"mtendaji_mobile" text,
	"number_of_plots" integer NOT NULL,
	"tp_url" text,
	"survey_url" text,
	"added_by" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plots_project_idx" ON "plots" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "plots_contact_idx" ON "plots" USING btree ("contact_id");