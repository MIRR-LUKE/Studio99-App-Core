import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const allowedFiles = new Set(
  [
    'scripts/guard-override-access.mjs',
    'src/core/ops/jobs.ts',
    'src/core/server/local-api.ts',
    'src/core/server/localApi.ts',
  ].map((file) => path.normalize(file)),
)

const scanExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'])
const ignoredSegments = new Set(['.git', '.next', 'coverage', 'node_modules', 'dist'])
const pattern = /overrideAccess\s*:\s*true\b/
const findings = []

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

    if (!scanExtensions.has(path.extname(entry.name))) {
      continue
    }

    const relativePath = path.normalize(path.relative(root, absolutePath))
    const contents = await readFile(absolutePath, 'utf8')

    if (pattern.test(contents) && !allowedFiles.has(relativePath)) {
      findings.push(relativePath)
    }
  }
}

for (const directory of ['src', 'scripts']) {
  await walk(path.join(root, directory))
}

if (findings.length > 0) {
  console.error('Unsafe overrideAccess:true usage found outside approved wrappers:')
  for (const file of findings) {
    console.error(`- ${file}`)
  }
  console.error(
    'Use createScopedLocalApi / createSystemLocalApi or move the direct overrideAccess call into an approved wrapper.',
  )
  process.exit(1)
}

console.log('overrideAccess guard passed.')
