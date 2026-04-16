# Backup and Restore

## Core principle

Payload versions are not the same thing as infrastructure backup.

## Payload-managed recovery

Use Payload versions for:

- content history
- draft preview
- singleton restore
- short-horizon application rollback

Managed collections and globals in core enable versions where recovery and audit value are high.

## Infrastructure-managed recovery

Keep these outside Payload versions:

- Postgres snapshots and point-in-time recovery
- object storage backup
- secret and credential rotation
- restore drills for full-environment rebuild

## Media retention

Media records are archived first:

- `deletedAt`
- `retentionState`
- `retentionUntil`

Physical purge should happen only after retention policy allows it.

## Ops recording

The core exposes two ops actions:

- backup snapshot recording
- restore drill recording

These create `operational-events` entries so the team has an application-level audit trail for recovery work.
