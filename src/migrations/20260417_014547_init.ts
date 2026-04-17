import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_organizations_role" AS ENUM('org_owner', 'org_admin', 'manager', 'editor', 'member', 'viewer');
  CREATE TYPE "public"."enum_users_organizations_status" AS ENUM('invited', 'active', 'suspended');
  CREATE TYPE "public"."enum_users_platform_role" AS ENUM('platform_owner', 'platform_admin', 'platform_operator', 'platform_support', 'platform_billing', 'platform_readonly');
  CREATE TYPE "public"."enum_users_status" AS ENUM('active', 'invited', 'disabled', 'locked', 'suspended');
  CREATE TYPE "public"."enum_users_security_mfa_preferred_method" AS ENUM('totp', 'webauthn', 'email');
  CREATE TYPE "public"."enum_organizations_type" AS ENUM('workspace', 'client', 'internal');
  CREATE TYPE "public"."enum_organizations_status" AS ENUM('active', 'paused', 'archived');
  CREATE TYPE "public"."enum_organizations_billing_status" AS ENUM('none', 'trialing', 'active', 'grace', 'past_due', 'unpaid', 'canceled', 'incomplete');
  CREATE TYPE "public"."enum_memberships_role" AS ENUM('org_owner', 'org_admin', 'manager', 'editor', 'member', 'viewer');
  CREATE TYPE "public"."enum_memberships_status" AS ENUM('invited', 'active', 'suspended');
  CREATE TYPE "public"."enum_invites_role" AS ENUM('org_owner', 'org_admin', 'manager', 'editor', 'member', 'viewer');
  CREATE TYPE "public"."enum_invites_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');
  CREATE TYPE "public"."enum_media_visibility" AS ENUM('private', 'public');
  CREATE TYPE "public"."enum_media_purpose" AS ENUM('asset', 'export', 'backup');
  CREATE TYPE "public"."enum_media_retention_state" AS ENUM('active', 'scheduled_for_purge', 'purged');
  CREATE TYPE "public"."enum_feature_flags_scope_type" AS ENUM('platform', 'environment', 'organization', 'user');
  CREATE TYPE "public"."enum_feature_flags_environment" AS ENUM('development', 'staging', 'production');
  CREATE TYPE "public"."enum_feature_flags_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__feature_flags_v_version_scope_type" AS ENUM('platform', 'environment', 'organization', 'user');
  CREATE TYPE "public"."enum__feature_flags_v_version_environment" AS ENUM('development', 'staging', 'production');
  CREATE TYPE "public"."enum__feature_flags_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_backup_snapshots_snapshot_type" AS ENUM('full_environment', 'database', 'object_storage', 'tenant', 'restore_drill');
  CREATE TYPE "public"."enum_backup_snapshots_scope_type" AS ENUM('platform', 'organization', 'project');
  CREATE TYPE "public"."enum_backup_snapshots_status" AS ENUM('available', 'failed', 'expired');
  CREATE TYPE "public"."enum_billing_events_source" AS ENUM('stripe', 'meter');
  CREATE TYPE "public"."enum_billing_events_status" AS ENUM('pending', 'processed', 'failed', 'queued');
  CREATE TYPE "public"."enum_support_notes_visibility" AS ENUM('ops', 'billing', 'support');
  CREATE TYPE "public"."enum_operational_events_event_type" AS ENUM('job_failure', 'webhook_failure', 'backup_snapshot', 'media_restore', 'restore_drill', 'maintenance_action', 'bootstrap_manifest');
  CREATE TYPE "public"."enum_operational_events_status" AS ENUM('pending', 'succeeded', 'failed', 'acknowledged');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'deliver-email', 'retry-billing-event', 'sync-organization-billing', 'export-organization-snapshot', 'ai-post-process', 'run-maintenance', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_workflow_slug" AS ENUM('nightly-maintenance');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'deliver-email', 'retry-billing-event', 'sync-organization-billing', 'export-organization-snapshot', 'ai-post-process', 'run-maintenance', 'schedulePublish');
  CREATE TYPE "public"."enum_app_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__app_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_ops_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ops_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_legal_texts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__legal_texts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_billing_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__billing_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_email_templates_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__email_templates_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_organizations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"organization_id" integer NOT NULL,
  	"role" "enum_users_organizations_role" DEFAULT 'member',
  	"status" "enum_users_organizations_status" DEFAULT 'active',
  	"joined_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"current_organization_id" integer,
  	"platform_role" "enum_users_platform_role" DEFAULT 'platform_readonly',
  	"timezone" varchar DEFAULT 'Asia/Tokyo',
  	"locale" varchar DEFAULT 'ja',
  	"status" "enum_users_status" DEFAULT 'active',
  	"last_login_at" timestamp(3) with time zone,
  	"security_password_changed_at" timestamp(3) with time zone,
  	"security_mfa_enabled" boolean DEFAULT false,
  	"security_mfa_preferred_method" "enum_users_security_mfa_preferred_method" DEFAULT 'totp',
  	"security_mfa_enrolled_at" timestamp(3) with time zone,
  	"security_mfa_verified_at" timestamp(3) with time zone,
  	"security_mfa_recovery_code_version" numeric DEFAULT 0,
  	"notification_settings_billing_email" boolean DEFAULT true,
  	"notification_settings_billing_in_app" boolean DEFAULT true,
  	"notification_settings_product_email" boolean DEFAULT true,
  	"notification_settings_product_in_app" boolean DEFAULT true,
  	"notification_settings_security_email" boolean DEFAULT true,
  	"notification_settings_security_in_app" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "organizations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_organizations_type" DEFAULT 'workspace',
  	"status" "enum_organizations_status" DEFAULT 'active',
  	"owner_user_id" integer,
  	"plan_key" varchar,
  	"billing_status" "enum_organizations_billing_status" DEFAULT 'none',
  	"grace_period_ends_at" timestamp(3) with time zone,
  	"seat_limit" numeric,
  	"billing_entitlements" jsonb,
  	"notification_defaults_billing_email" boolean DEFAULT true,
  	"notification_defaults_billing_in_app" boolean DEFAULT true,
  	"notification_defaults_product_email" boolean DEFAULT true,
  	"notification_defaults_product_in_app" boolean DEFAULT true,
  	"notification_defaults_security_email" boolean DEFAULT true,
  	"notification_defaults_security_in_app" boolean DEFAULT true,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "memberships" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"user_id" integer NOT NULL,
  	"role" "enum_memberships_role" DEFAULT 'member',
  	"status" "enum_memberships_status" DEFAULT 'active',
  	"invited_by_id" integer,
  	"joined_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "invites" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"email" varchar NOT NULL,
  	"role" "enum_invites_role" DEFAULT 'member',
  	"status" "enum_invites_status" DEFAULT 'pending',
  	"token_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"invited_by_id" integer,
  	"accepted_by_id" integer,
  	"accepted_at" timestamp(3) with time zone,
  	"revoked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"visibility" "enum_media_visibility" DEFAULT 'private',
  	"object_key" varchar,
  	"delivery_url" varchar,
  	"purpose" "enum_media_purpose" DEFAULT 'asset',
  	"retention_state" "enum_media_retention_state" DEFAULT 'active',
  	"deleted_at" timestamp(3) with time zone,
  	"deleted_by_id" integer,
  	"retention_until" timestamp(3) with time zone,
  	"uploaded_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "media_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"target_type" varchar,
  	"target_id" varchar,
  	"action" varchar NOT NULL,
  	"actor_user_id" integer,
  	"actor_type" varchar,
  	"detail" jsonb,
  	"ip" varchar,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "feature_flags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"scope_type" "enum_feature_flags_scope_type" DEFAULT 'platform',
  	"scope_id" varchar DEFAULT '*',
  	"environment" "enum_feature_flags_environment" DEFAULT 'development',
  	"enabled" boolean DEFAULT false,
  	"rollout_percent" numeric,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"rules_json" jsonb,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_feature_flags_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_feature_flags_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_key" varchar,
  	"version_scope_type" "enum__feature_flags_v_version_scope_type" DEFAULT 'platform',
  	"version_scope_id" varchar DEFAULT '*',
  	"version_environment" "enum__feature_flags_v_version_environment" DEFAULT 'development',
  	"version_enabled" boolean DEFAULT false,
  	"version_rollout_percent" numeric,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_rules_json" jsonb,
  	"version_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__feature_flags_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "billing_customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"stripe_customer_id" varchar NOT NULL,
  	"email" varchar,
  	"currency" varchar,
  	"tax_status" varchar,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "backup_snapshots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"snapshot_type" "enum_backup_snapshots_snapshot_type" DEFAULT 'full_environment',
  	"scope_type" "enum_backup_snapshots_scope_type" DEFAULT 'platform',
  	"scope_id" varchar,
  	"status" "enum_backup_snapshots_status" DEFAULT 'available',
  	"snapshot_at" timestamp(3) with time zone NOT NULL,
  	"retention_until" timestamp(3) with time zone,
  	"artifact_uri" varchar,
  	"storage_key" varchar,
  	"checksum" varchar,
  	"size_bytes" numeric,
  	"reason" varchar,
  	"summary" varchar NOT NULL,
  	"notes" varchar,
  	"detail" jsonb,
  	"recorded_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "billing_subscriptions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"billing_customer_id" integer,
  	"plan_key" varchar NOT NULL,
  	"stripe_subscription_id" varchar NOT NULL,
  	"stripe_product_id" varchar,
  	"status" varchar NOT NULL,
  	"quantity" numeric DEFAULT 0,
  	"seat_limit" numeric,
  	"seats_in_use" numeric DEFAULT 0,
  	"grace_period_ends_at" timestamp(3) with time zone,
  	"entitlements_json" jsonb,
  	"usage_state_json" jsonb,
  	"current_period_start" timestamp(3) with time zone,
  	"current_period_end" timestamp(3) with time zone,
  	"cancel_at_period_end" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "billing_subscriptions_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "billing_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"source" "enum_billing_events_source" DEFAULT 'stripe',
  	"stripe_event_id" varchar,
  	"event_type" varchar NOT NULL,
  	"status" "enum_billing_events_status" DEFAULT 'pending',
  	"retry_count" numeric DEFAULT 0,
  	"processed_at" timestamp(3) with time zone,
  	"idempotency_key" varchar,
  	"meter_key" varchar,
  	"quantity" numeric,
  	"request_id" varchar,
  	"raw_payload" jsonb,
  	"error_json" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "support_notes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"created_by_id" integer,
  	"visibility" "enum_support_notes_visibility" DEFAULT 'ops',
  	"body" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "support_notes_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "operational_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"organization_id" integer,
  	"event_type" "enum_operational_events_event_type" DEFAULT 'maintenance_action',
  	"status" "enum_operational_events_status" DEFAULT 'pending',
  	"queue_name" varchar,
  	"summary" varchar NOT NULL,
  	"related_collection" varchar,
  	"related_id" varchar,
  	"retry_count" numeric DEFAULT 0,
  	"reason" varchar,
  	"detail" jsonb,
  	"acknowledged_at" timestamp(3) with time zone,
  	"acknowledged_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"workflow_slug" "enum_payload_jobs_workflow_slug",
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"concurrency_key" varchar,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"organizations_id" integer,
  	"memberships_id" integer,
  	"invites_id" integer,
  	"media_id" integer,
  	"audit_logs_id" integer,
  	"feature_flags_id" integer,
  	"billing_customers_id" integer,
  	"backup_snapshots_id" integer,
  	"billing_subscriptions_id" integer,
  	"billing_events_id" integer,
  	"support_notes_id" integer,
  	"operational_events_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "app_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"app_name" varchar DEFAULT 'Studio99',
  	"default_locale" varchar DEFAULT 'ja',
  	"support_email" varchar,
  	"support_docs_url" varchar,
  	"status_banner" varchar,
  	"maintenance_mode" boolean DEFAULT false,
  	"_status" "enum_app_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_app_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_app_name" varchar DEFAULT 'Studio99',
  	"version_default_locale" varchar DEFAULT 'ja',
  	"version_support_email" varchar,
  	"version_support_docs_url" varchar,
  	"version_status_banner" varchar,
  	"version_maintenance_mode" boolean DEFAULT false,
  	"version__status" "enum__app_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "ops_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"incident_banner" varchar,
  	"dangerous_actions_enabled" boolean DEFAULT false,
  	"export_retention_days" numeric DEFAULT 30,
  	"backup_policy_text" varchar,
  	"restore_drill_instructions" varchar,
  	"_status" "enum_ops_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_ops_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_incident_banner" varchar,
  	"version_dangerous_actions_enabled" boolean DEFAULT false,
  	"version_export_retention_days" numeric DEFAULT 30,
  	"version_backup_policy_text" varchar,
  	"version_restore_drill_instructions" varchar,
  	"version__status" "enum__ops_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "legal_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"terms_version" varchar DEFAULT '1.0.0',
  	"terms_body" varchar,
  	"privacy_version" varchar DEFAULT '1.0.0',
  	"privacy_body" varchar,
  	"consent_version" varchar DEFAULT '1.0.0',
  	"consent_body" varchar,
  	"_status" "enum_legal_texts_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_legal_texts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_terms_version" varchar DEFAULT '1.0.0',
  	"version_terms_body" varchar,
  	"version_privacy_version" varchar DEFAULT '1.0.0',
  	"version_privacy_body" varchar,
  	"version_consent_version" varchar DEFAULT '1.0.0',
  	"version_consent_body" varchar,
  	"version__status" "enum__legal_texts_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "billing_settings_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"plan_key" varchar,
  	"label" varchar,
  	"stripe_product_id" varchar,
  	"seat_limit" numeric,
  	"entitlements_json" jsonb
  );
  
  CREATE TABLE "billing_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stripe_api_version" varchar DEFAULT '2026-02-25.clover',
  	"default_currency" varchar DEFAULT 'jpy',
  	"grace_period_days" numeric DEFAULT 7,
  	"retry_policy_max_attempts" numeric DEFAULT 5,
  	"retry_policy_backoff_ms" numeric DEFAULT 60000,
  	"_status" "enum_billing_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "billing_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_billing_settings_v_version_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"plan_key" varchar,
  	"label" varchar,
  	"stripe_product_id" varchar,
  	"seat_limit" numeric,
  	"entitlements_json" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_billing_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_stripe_api_version" varchar DEFAULT '2026-02-25.clover',
  	"version_default_currency" varchar DEFAULT 'jpy',
  	"version_grace_period_days" numeric DEFAULT 7,
  	"version_retry_policy_max_attempts" numeric DEFAULT 5,
  	"version_retry_policy_backoff_ms" numeric DEFAULT 60000,
  	"version__status" "enum__billing_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_billing_settings_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "email_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"invite_subject" varchar,
  	"invite_body" varchar,
  	"reset_password_subject" varchar,
  	"reset_password_body" varchar,
  	"billing_failed_subject" varchar,
  	"billing_failed_body" varchar,
  	"welcome_subject" varchar,
  	"welcome_body" varchar,
  	"generic_notice_subject" varchar,
  	"generic_notice_body" varchar,
  	"_status" "enum_email_templates_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_email_templates_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_invite_subject" varchar,
  	"version_invite_body" varchar,
  	"version_reset_password_subject" varchar,
  	"version_reset_password_body" varchar,
  	"version_billing_failed_subject" varchar,
  	"version_billing_failed_body" varchar,
  	"version_welcome_subject" varchar,
  	"version_welcome_body" varchar,
  	"version_generic_notice_subject" varchar,
  	"version_generic_notice_body" varchar,
  	"version__status" "enum__email_templates_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_organizations" ADD CONSTRAINT "users_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_organizations" ADD CONSTRAINT "users_organizations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_current_organization_id_organizations_id_fk" FOREIGN KEY ("current_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invites" ADD CONSTRAINT "invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invites" ADD CONSTRAINT "invites_accepted_by_id_users_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_deleted_by_id_users_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media_texts" ADD CONSTRAINT "media_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_feature_flags_v" ADD CONSTRAINT "_feature_flags_v_parent_id_feature_flags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."feature_flags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "backup_snapshots" ADD CONSTRAINT "backup_snapshots_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_billing_customer_id_billing_customers_id_fk" FOREIGN KEY ("billing_customer_id") REFERENCES "public"."billing_customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "billing_subscriptions_texts" ADD CONSTRAINT "billing_subscriptions_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "support_notes_texts" ADD CONSTRAINT "support_notes_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."support_notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_acknowledged_by_id_users_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_organizations_fk" FOREIGN KEY ("organizations_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_memberships_fk" FOREIGN KEY ("memberships_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invites_fk" FOREIGN KEY ("invites_id") REFERENCES "public"."invites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feature_flags_fk" FOREIGN KEY ("feature_flags_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_billing_customers_fk" FOREIGN KEY ("billing_customers_id") REFERENCES "public"."billing_customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_backup_snapshots_fk" FOREIGN KEY ("backup_snapshots_id") REFERENCES "public"."backup_snapshots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_billing_subscriptions_fk" FOREIGN KEY ("billing_subscriptions_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_billing_events_fk" FOREIGN KEY ("billing_events_id") REFERENCES "public"."billing_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_support_notes_fk" FOREIGN KEY ("support_notes_id") REFERENCES "public"."support_notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_operational_events_fk" FOREIGN KEY ("operational_events_id") REFERENCES "public"."operational_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "billing_settings_plans" ADD CONSTRAINT "billing_settings_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."billing_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "billing_settings_texts" ADD CONSTRAINT "billing_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."billing_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_billing_settings_v_version_plans" ADD CONSTRAINT "_billing_settings_v_version_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_billing_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_billing_settings_v_texts" ADD CONSTRAINT "_billing_settings_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_billing_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_organizations_order_idx" ON "users_organizations" USING btree ("_order");
  CREATE INDEX "users_organizations_parent_id_idx" ON "users_organizations" USING btree ("_parent_id");
  CREATE INDEX "users_organizations_organization_idx" ON "users_organizations" USING btree ("organization_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_current_organization_idx" ON "users" USING btree ("current_organization_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");
  CREATE INDEX "organizations_owner_user_idx" ON "organizations" USING btree ("owner_user_id");
  CREATE INDEX "organizations_updated_at_idx" ON "organizations" USING btree ("updated_at");
  CREATE INDEX "organizations_created_at_idx" ON "organizations" USING btree ("created_at");
  CREATE INDEX "memberships_organization_idx" ON "memberships" USING btree ("organization_id");
  CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");
  CREATE INDEX "memberships_invited_by_idx" ON "memberships" USING btree ("invited_by_id");
  CREATE INDEX "memberships_updated_at_idx" ON "memberships" USING btree ("updated_at");
  CREATE INDEX "memberships_created_at_idx" ON "memberships" USING btree ("created_at");
  CREATE INDEX "invites_organization_idx" ON "invites" USING btree ("organization_id");
  CREATE INDEX "invites_invited_by_idx" ON "invites" USING btree ("invited_by_id");
  CREATE INDEX "invites_accepted_by_idx" ON "invites" USING btree ("accepted_by_id");
  CREATE INDEX "invites_updated_at_idx" ON "invites" USING btree ("updated_at");
  CREATE INDEX "invites_created_at_idx" ON "invites" USING btree ("created_at");
  CREATE INDEX "media_organization_idx" ON "media" USING btree ("organization_id");
  CREATE INDEX "media_deleted_by_idx" ON "media" USING btree ("deleted_by_id");
  CREATE INDEX "media_uploaded_by_idx" ON "media" USING btree ("uploaded_by_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_texts_order_parent" ON "media_texts" USING btree ("order","parent_id");
  CREATE INDEX "audit_logs_organization_idx" ON "audit_logs" USING btree ("organization_id");
  CREATE INDEX "audit_logs_actor_user_idx" ON "audit_logs" USING btree ("actor_user_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "feature_flags_updated_at_idx" ON "feature_flags" USING btree ("updated_at");
  CREATE INDEX "feature_flags_created_at_idx" ON "feature_flags" USING btree ("created_at");
  CREATE INDEX "feature_flags__status_idx" ON "feature_flags" USING btree ("_status");
  CREATE INDEX "_feature_flags_v_parent_idx" ON "_feature_flags_v" USING btree ("parent_id");
  CREATE INDEX "_feature_flags_v_version_version_updated_at_idx" ON "_feature_flags_v" USING btree ("version_updated_at");
  CREATE INDEX "_feature_flags_v_version_version_created_at_idx" ON "_feature_flags_v" USING btree ("version_created_at");
  CREATE INDEX "_feature_flags_v_version_version__status_idx" ON "_feature_flags_v" USING btree ("version__status");
  CREATE INDEX "_feature_flags_v_created_at_idx" ON "_feature_flags_v" USING btree ("created_at");
  CREATE INDEX "_feature_flags_v_updated_at_idx" ON "_feature_flags_v" USING btree ("updated_at");
  CREATE INDEX "_feature_flags_v_latest_idx" ON "_feature_flags_v" USING btree ("latest");
  CREATE INDEX "billing_customers_organization_idx" ON "billing_customers" USING btree ("organization_id");
  CREATE UNIQUE INDEX "billing_customers_stripe_customer_id_idx" ON "billing_customers" USING btree ("stripe_customer_id");
  CREATE INDEX "billing_customers_updated_at_idx" ON "billing_customers" USING btree ("updated_at");
  CREATE INDEX "billing_customers_created_at_idx" ON "billing_customers" USING btree ("created_at");
  CREATE INDEX "backup_snapshots_recorded_by_idx" ON "backup_snapshots" USING btree ("recorded_by_id");
  CREATE INDEX "backup_snapshots_updated_at_idx" ON "backup_snapshots" USING btree ("updated_at");
  CREATE INDEX "backup_snapshots_created_at_idx" ON "backup_snapshots" USING btree ("created_at");
  CREATE INDEX "billing_subscriptions_organization_idx" ON "billing_subscriptions" USING btree ("organization_id");
  CREATE INDEX "billing_subscriptions_billing_customer_idx" ON "billing_subscriptions" USING btree ("billing_customer_id");
  CREATE UNIQUE INDEX "billing_subscriptions_stripe_subscription_id_idx" ON "billing_subscriptions" USING btree ("stripe_subscription_id");
  CREATE INDEX "billing_subscriptions_updated_at_idx" ON "billing_subscriptions" USING btree ("updated_at");
  CREATE INDEX "billing_subscriptions_created_at_idx" ON "billing_subscriptions" USING btree ("created_at");
  CREATE INDEX "billing_subscriptions_texts_order_parent" ON "billing_subscriptions_texts" USING btree ("order","parent_id");
  CREATE INDEX "billing_events_organization_idx" ON "billing_events" USING btree ("organization_id");
  CREATE UNIQUE INDEX "billing_events_stripe_event_id_idx" ON "billing_events" USING btree ("stripe_event_id");
  CREATE INDEX "billing_events_updated_at_idx" ON "billing_events" USING btree ("updated_at");
  CREATE INDEX "billing_events_created_at_idx" ON "billing_events" USING btree ("created_at");
  CREATE INDEX "support_notes_organization_idx" ON "support_notes" USING btree ("organization_id");
  CREATE INDEX "support_notes_created_by_idx" ON "support_notes" USING btree ("created_by_id");
  CREATE INDEX "support_notes_updated_at_idx" ON "support_notes" USING btree ("updated_at");
  CREATE INDEX "support_notes_created_at_idx" ON "support_notes" USING btree ("created_at");
  CREATE INDEX "support_notes_texts_order_parent" ON "support_notes_texts" USING btree ("order","parent_id");
  CREATE INDEX "operational_events_organization_idx" ON "operational_events" USING btree ("organization_id");
  CREATE INDEX "operational_events_acknowledged_by_idx" ON "operational_events" USING btree ("acknowledged_by_id");
  CREATE INDEX "operational_events_updated_at_idx" ON "operational_events" USING btree ("updated_at");
  CREATE INDEX "operational_events_created_at_idx" ON "operational_events" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_workflow_slug_idx" ON "payload_jobs" USING btree ("workflow_slug");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_concurrency_key_idx" ON "payload_jobs" USING btree ("concurrency_key");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_organizations_id_idx" ON "payload_locked_documents_rels" USING btree ("organizations_id");
  CREATE INDEX "payload_locked_documents_rels_memberships_id_idx" ON "payload_locked_documents_rels" USING btree ("memberships_id");
  CREATE INDEX "payload_locked_documents_rels_invites_id_idx" ON "payload_locked_documents_rels" USING btree ("invites_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_locked_documents_rels_feature_flags_id_idx" ON "payload_locked_documents_rels" USING btree ("feature_flags_id");
  CREATE INDEX "payload_locked_documents_rels_billing_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("billing_customers_id");
  CREATE INDEX "payload_locked_documents_rels_backup_snapshots_id_idx" ON "payload_locked_documents_rels" USING btree ("backup_snapshots_id");
  CREATE INDEX "payload_locked_documents_rels_billing_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("billing_subscriptions_id");
  CREATE INDEX "payload_locked_documents_rels_billing_events_id_idx" ON "payload_locked_documents_rels" USING btree ("billing_events_id");
  CREATE INDEX "payload_locked_documents_rels_support_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("support_notes_id");
  CREATE INDEX "payload_locked_documents_rels_operational_events_id_idx" ON "payload_locked_documents_rels" USING btree ("operational_events_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "app_settings__status_idx" ON "app_settings" USING btree ("_status");
  CREATE INDEX "_app_settings_v_version_version__status_idx" ON "_app_settings_v" USING btree ("version__status");
  CREATE INDEX "_app_settings_v_created_at_idx" ON "_app_settings_v" USING btree ("created_at");
  CREATE INDEX "_app_settings_v_updated_at_idx" ON "_app_settings_v" USING btree ("updated_at");
  CREATE INDEX "_app_settings_v_latest_idx" ON "_app_settings_v" USING btree ("latest");
  CREATE INDEX "_app_settings_v_autosave_idx" ON "_app_settings_v" USING btree ("autosave");
  CREATE INDEX "ops_settings__status_idx" ON "ops_settings" USING btree ("_status");
  CREATE INDEX "_ops_settings_v_version_version__status_idx" ON "_ops_settings_v" USING btree ("version__status");
  CREATE INDEX "_ops_settings_v_created_at_idx" ON "_ops_settings_v" USING btree ("created_at");
  CREATE INDEX "_ops_settings_v_updated_at_idx" ON "_ops_settings_v" USING btree ("updated_at");
  CREATE INDEX "_ops_settings_v_latest_idx" ON "_ops_settings_v" USING btree ("latest");
  CREATE INDEX "_ops_settings_v_autosave_idx" ON "_ops_settings_v" USING btree ("autosave");
  CREATE INDEX "legal_texts__status_idx" ON "legal_texts" USING btree ("_status");
  CREATE INDEX "_legal_texts_v_version_version__status_idx" ON "_legal_texts_v" USING btree ("version__status");
  CREATE INDEX "_legal_texts_v_created_at_idx" ON "_legal_texts_v" USING btree ("created_at");
  CREATE INDEX "_legal_texts_v_updated_at_idx" ON "_legal_texts_v" USING btree ("updated_at");
  CREATE INDEX "_legal_texts_v_latest_idx" ON "_legal_texts_v" USING btree ("latest");
  CREATE INDEX "_legal_texts_v_autosave_idx" ON "_legal_texts_v" USING btree ("autosave");
  CREATE INDEX "billing_settings_plans_order_idx" ON "billing_settings_plans" USING btree ("_order");
  CREATE INDEX "billing_settings_plans_parent_id_idx" ON "billing_settings_plans" USING btree ("_parent_id");
  CREATE INDEX "billing_settings__status_idx" ON "billing_settings" USING btree ("_status");
  CREATE INDEX "billing_settings_texts_order_parent" ON "billing_settings_texts" USING btree ("order","parent_id");
  CREATE INDEX "_billing_settings_v_version_plans_order_idx" ON "_billing_settings_v_version_plans" USING btree ("_order");
  CREATE INDEX "_billing_settings_v_version_plans_parent_id_idx" ON "_billing_settings_v_version_plans" USING btree ("_parent_id");
  CREATE INDEX "_billing_settings_v_version_version__status_idx" ON "_billing_settings_v" USING btree ("version__status");
  CREATE INDEX "_billing_settings_v_created_at_idx" ON "_billing_settings_v" USING btree ("created_at");
  CREATE INDEX "_billing_settings_v_updated_at_idx" ON "_billing_settings_v" USING btree ("updated_at");
  CREATE INDEX "_billing_settings_v_latest_idx" ON "_billing_settings_v" USING btree ("latest");
  CREATE INDEX "_billing_settings_v_autosave_idx" ON "_billing_settings_v" USING btree ("autosave");
  CREATE INDEX "_billing_settings_v_texts_order_parent" ON "_billing_settings_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "email_templates__status_idx" ON "email_templates" USING btree ("_status");
  CREATE INDEX "_email_templates_v_version_version__status_idx" ON "_email_templates_v" USING btree ("version__status");
  CREATE INDEX "_email_templates_v_created_at_idx" ON "_email_templates_v" USING btree ("created_at");
  CREATE INDEX "_email_templates_v_updated_at_idx" ON "_email_templates_v" USING btree ("updated_at");
  CREATE INDEX "_email_templates_v_latest_idx" ON "_email_templates_v" USING btree ("latest");
  CREATE INDEX "_email_templates_v_autosave_idx" ON "_email_templates_v" USING btree ("autosave");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_organizations" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "organizations" CASCADE;
  DROP TABLE "memberships" CASCADE;
  DROP TABLE "invites" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_texts" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "feature_flags" CASCADE;
  DROP TABLE "_feature_flags_v" CASCADE;
  DROP TABLE "billing_customers" CASCADE;
  DROP TABLE "backup_snapshots" CASCADE;
  DROP TABLE "billing_subscriptions" CASCADE;
  DROP TABLE "billing_subscriptions_texts" CASCADE;
  DROP TABLE "billing_events" CASCADE;
  DROP TABLE "support_notes" CASCADE;
  DROP TABLE "support_notes_texts" CASCADE;
  DROP TABLE "operational_events" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "app_settings" CASCADE;
  DROP TABLE "_app_settings_v" CASCADE;
  DROP TABLE "ops_settings" CASCADE;
  DROP TABLE "_ops_settings_v" CASCADE;
  DROP TABLE "legal_texts" CASCADE;
  DROP TABLE "_legal_texts_v" CASCADE;
  DROP TABLE "billing_settings_plans" CASCADE;
  DROP TABLE "billing_settings" CASCADE;
  DROP TABLE "billing_settings_texts" CASCADE;
  DROP TABLE "_billing_settings_v_version_plans" CASCADE;
  DROP TABLE "_billing_settings_v" CASCADE;
  DROP TABLE "_billing_settings_v_texts" CASCADE;
  DROP TABLE "email_templates" CASCADE;
  DROP TABLE "_email_templates_v" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP TYPE "public"."enum_users_organizations_role";
  DROP TYPE "public"."enum_users_organizations_status";
  DROP TYPE "public"."enum_users_platform_role";
  DROP TYPE "public"."enum_users_status";
  DROP TYPE "public"."enum_users_security_mfa_preferred_method";
  DROP TYPE "public"."enum_organizations_type";
  DROP TYPE "public"."enum_organizations_status";
  DROP TYPE "public"."enum_organizations_billing_status";
  DROP TYPE "public"."enum_memberships_role";
  DROP TYPE "public"."enum_memberships_status";
  DROP TYPE "public"."enum_invites_role";
  DROP TYPE "public"."enum_invites_status";
  DROP TYPE "public"."enum_media_visibility";
  DROP TYPE "public"."enum_media_purpose";
  DROP TYPE "public"."enum_media_retention_state";
  DROP TYPE "public"."enum_feature_flags_scope_type";
  DROP TYPE "public"."enum_feature_flags_environment";
  DROP TYPE "public"."enum_feature_flags_status";
  DROP TYPE "public"."enum__feature_flags_v_version_scope_type";
  DROP TYPE "public"."enum__feature_flags_v_version_environment";
  DROP TYPE "public"."enum__feature_flags_v_version_status";
  DROP TYPE "public"."enum_backup_snapshots_snapshot_type";
  DROP TYPE "public"."enum_backup_snapshots_scope_type";
  DROP TYPE "public"."enum_backup_snapshots_status";
  DROP TYPE "public"."enum_billing_events_source";
  DROP TYPE "public"."enum_billing_events_status";
  DROP TYPE "public"."enum_support_notes_visibility";
  DROP TYPE "public"."enum_operational_events_event_type";
  DROP TYPE "public"."enum_operational_events_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_workflow_slug";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_app_settings_status";
  DROP TYPE "public"."enum__app_settings_v_version_status";
  DROP TYPE "public"."enum_ops_settings_status";
  DROP TYPE "public"."enum__ops_settings_v_version_status";
  DROP TYPE "public"."enum_legal_texts_status";
  DROP TYPE "public"."enum__legal_texts_v_version_status";
  DROP TYPE "public"."enum_billing_settings_status";
  DROP TYPE "public"."enum__billing_settings_v_version_status";
  DROP TYPE "public"."enum_email_templates_status";
  DROP TYPE "public"."enum__email_templates_v_version_status";`)
}
