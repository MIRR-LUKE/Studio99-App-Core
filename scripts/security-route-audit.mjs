#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()

const routeFiles = []
const ignoredSegments = new Set(['.git', '.next', 'coverage', 'node_modules', 'dist'])

const SAME_ORIGIN_EXEMPTIONS = new Set([
  path.normalize('src/app/(app)/api/core/billing/webhook/route.ts'),
])

const RATE_LIMIT_EXEMPTIONS = new Set([
  path.normalize('src/app/(app)/api/core/billing/webhook/route.ts'),
])

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (ignoredSegments.has(entry.name)) {
      continue
    }

    const absolutePath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await walk(absolutePath)
      continue
    }

    if (entry.name !== 'route.ts') {
      continue
    }

    routeFiles.push(path.normalize(path.relative(root, absolutePath)))
  }
}

const hasMutationHandler = (contents) => /export async function (POST|PUT|PATCH|DELETE)\b/.test(contents)
const hasSameOriginGuard = (contents) => contents.includes('createSameOriginMutationGuard')
const hasRateLimit = (contents) => contents.includes('enforceRateLimit')
const hasAuthContext = (contents) => contents.includes('createAuthenticatedPayloadRequest')
const hasAuthResponseWrapper = (contents) =>
  contents.includes('applyPayloadResponseHeaders') || contents.includes('applySecurityHeaders')

export const runSecurityRouteAudit = async () => {
  routeFiles.length = 0
  await walk(path.join(root, 'src', 'app'))

  const findings = []

  for (const relativePath of routeFiles) {
    const contents = await readFile(path.join(root, relativePath), 'utf8')

    if (hasMutationHandler(contents)) {
      if (!SAME_ORIGIN_EXEMPTIONS.has(relativePath) && !hasSameOriginGuard(contents)) {
        findings.push(`${relativePath}: missing createSameOriginMutationGuard() in state-changing route.`)
      }

      if (!RATE_LIMIT_EXEMPTIONS.has(relativePath) && !hasRateLimit(contents)) {
        findings.push(`${relativePath}: missing enforceRateLimit() in state-changing route.`)
      }
    }

    if (hasAuthContext(contents) && !hasAuthResponseWrapper(contents)) {
      findings.push(`${relativePath}: authenticated response is not wrapped with no-store headers.`)
    }
  }

  if (findings.length > 0) {
    console.error('Security route audit failed:')
    for (const finding of findings) {
      console.error(`- ${finding}`)
    }
    process.exit(1)
  }

  console.log(`Security route audit passed for ${routeFiles.length} route files.`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runSecurityRouteAudit()
}
