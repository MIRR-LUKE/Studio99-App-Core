import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_audit_logs_result" AS ENUM('success', 'failure', 'denied');
  ALTER TABLE "organizations" ADD COLUMN "archived_at" timestamp(3) with time zone;
  ALTER TABLE "organizations" ADD COLUMN "archived_by_id" integer;
  ALTER TABLE "audit_logs" ADD COLUMN "result" "enum_audit_logs_result" DEFAULT 'success';
  ALTER TABLE "audit_logs" ADD COLUMN "reason" varchar;
  ALTER TABLE "audit_logs" ADD COLUMN "request_id" varchar;
  ALTER TABLE "audit_logs" ADD COLUMN "request_method" varchar;
  ALTER TABLE "organizations" ADD CONSTRAINT "organizations_archived_by_id_users_id_fk" FOREIGN KEY ("archived_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "organizations_archived_by_idx" ON "organizations" USING btree ("archived_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "organizations" DROP CONSTRAINT "organizations_archived_by_id_users_id_fk";
  
  DROP INDEX "organizations_archived_by_idx";
  ALTER TABLE "organizations" DROP COLUMN "archived_at";
  ALTER TABLE "organizations" DROP COLUMN "archived_by_id";
  ALTER TABLE "audit_logs" DROP COLUMN "result";
  ALTER TABLE "audit_logs" DROP COLUMN "reason";
  ALTER TABLE "audit_logs" DROP COLUMN "request_id";
  ALTER TABLE "audit_logs" DROP COLUMN "request_method";
  DROP TYPE "public"."enum_audit_logs_result";`)
}
