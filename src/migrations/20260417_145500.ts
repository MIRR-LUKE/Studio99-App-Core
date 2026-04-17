import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users"
      ADD COLUMN "security_mfa_secret" varchar,
      ADD COLUMN "security_mfa_pending_secret" varchar,
      ADD COLUMN "security_mfa_recovery_code_hashes" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users"
      DROP COLUMN "security_mfa_secret",
      DROP COLUMN "security_mfa_pending_secret",
      DROP COLUMN "security_mfa_recovery_code_hashes";
  `)
}
