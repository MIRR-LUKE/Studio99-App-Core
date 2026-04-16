# Project Bootstrap

Core ships a project bootstrap script so new products start from a predictable skeleton.

## Command

```bash
npm run bootstrap:project -- <projectKey> "<Project Name>"
```

Example:

```bash
npm run bootstrap:project -- console "Studio99 Console"
```

## Generated files

- `src/app/(app)/app/<projectKey>/page.tsx`
- `src/app/api/<projectKey>/route.ts`
- `src/projects/<projectKey>/README.md`
- `docs/projects/<projectKey>.md`

## Intended workflow

1. bootstrap the project shell
2. add project collections and hooks
3. add project routes and components
4. wire any project-specific jobs
5. reuse core auth, admin, billing, feature flags, uploads, and ops

## Bootstrap manifest API

Ops can request a plan-only manifest through:

```text
POST /api/ops/bootstrap/manifest
```

Body:

```json
{
  "name": "Studio99 Console",
  "projectKey": "console"
}
```

The response describes target routes, collections, and project docs paths before any files are created.
