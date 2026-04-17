import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_console_customers_status" AS ENUM('draft', 'active', 'archived');
  CREATE TYPE "public"."enum_console_customers_account_tier" AS ENUM('starter', 'growth', 'scale', 'enterprise');
  CREATE TYPE "public"."enum_console_workspaces_status" AS ENUM('draft', 'active', 'archived');
  CREATE TYPE "public"."enum_console_workspaces_workspace_type" AS ENUM('client', 'internal', 'pilot', 'production');
  CREATE TYPE "public"."enum_console_events_status" AS ENUM('draft', 'active', 'archived');
  CREATE TYPE "public"."enum_console_events_event_type" AS ENUM('note', 'kickoff', 'request', 'delivery', 'billing', 'incident');
  CREATE TYPE "public"."enum_console_events_severity" AS ENUM('low', 'medium', 'high');
  CREATE TABLE "console_customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_console_customers_status" DEFAULT 'draft',
  	"account_tier" "enum_console_customers_account_tier" DEFAULT 'starter',
  	"owner_name" varchar,
  	"owner_email" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "console_workspaces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer NOT NULL,
  	"customer_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_console_workspaces_status" DEFAULT 'draft',
  	"workspace_type" "enum_console_workspaces_workspace_type" DEFAULT 'client',
  	"last_activity_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "console_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer NOT NULL,
  	"customer_id" integer,
  	"workspace_id" integer,
  	"title" varchar NOT NULL,
  	"status" "enum_console_events_status" DEFAULT 'draft',
  	"event_type" "enum_console_events_event_type" DEFAULT 'note',
  	"severity" "enum_console_events_severity" DEFAULT 'low',
  	"occurred_at" timestamp(3) with time zone,
  	"details" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "console_customers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "console_workspaces_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "console_events_id" integer;
  ALTER TABLE "console_customers" ADD CONSTRAINT "console_customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "console_workspaces" ADD CONSTRAINT "console_workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "console_workspaces" ADD CONSTRAINT "console_workspaces_customer_id_console_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."console_customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "console_events" ADD CONSTRAINT "console_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "console_events" ADD CONSTRAINT "console_events_customer_id_console_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."console_customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "console_events" ADD CONSTRAINT "console_events_workspace_id_console_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."console_workspaces"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "console_customers_organization_idx" ON "console_customers" USING btree ("organization_id");
  CREATE INDEX "console_customers_updated_at_idx" ON "console_customers" USING btree ("updated_at");
  CREATE INDEX "console_customers_created_at_idx" ON "console_customers" USING btree ("created_at");
  CREATE INDEX "console_workspaces_organization_idx" ON "console_workspaces" USING btree ("organization_id");
  CREATE INDEX "console_workspaces_customer_idx" ON "console_workspaces" USING btree ("customer_id");
  CREATE INDEX "console_workspaces_updated_at_idx" ON "console_workspaces" USING btree ("updated_at");
  CREATE INDEX "console_workspaces_created_at_idx" ON "console_workspaces" USING btree ("created_at");
  CREATE INDEX "console_events_organization_idx" ON "console_events" USING btree ("organization_id");
  CREATE INDEX "console_events_customer_idx" ON "console_events" USING btree ("customer_id");
  CREATE INDEX "console_events_workspace_idx" ON "console_events" USING btree ("workspace_id");
  CREATE INDEX "console_events_updated_at_idx" ON "console_events" USING btree ("updated_at");
  CREATE INDEX "console_events_created_at_idx" ON "console_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_console_customers_fk" FOREIGN KEY ("console_customers_id") REFERENCES "public"."console_customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_console_workspaces_fk" FOREIGN KEY ("console_workspaces_id") REFERENCES "public"."console_workspaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_console_events_fk" FOREIGN KEY ("console_events_id") REFERENCES "public"."console_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_console_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("console_customers_id");
  CREATE INDEX "payload_locked_documents_rels_console_workspaces_id_idx" ON "payload_locked_documents_rels" USING btree ("console_workspaces_id");
  CREATE INDEX "payload_locked_documents_rels_console_events_id_idx" ON "payload_locked_documents_rels" USING btree ("console_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "console_customers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "console_workspaces" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "console_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "console_customers" CASCADE;
  DROP TABLE "console_workspaces" CASCADE;
  DROP TABLE "console_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_console_customers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_console_workspaces_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_console_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_console_customers_id_idx";
  DROP INDEX "payload_locked_documents_rels_console_workspaces_id_idx";
  DROP INDEX "payload_locked_documents_rels_console_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "console_customers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "console_workspaces_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "console_events_id";
  DROP TYPE "public"."enum_console_customers_status";
  DROP TYPE "public"."enum_console_customers_account_tier";
  DROP TYPE "public"."enum_console_workspaces_status";
  DROP TYPE "public"."enum_console_workspaces_workspace_type";
  DROP TYPE "public"."enum_console_events_status";
  DROP TYPE "public"."enum_console_events_event_type";
  DROP TYPE "public"."enum_console_events_severity";`)
}
