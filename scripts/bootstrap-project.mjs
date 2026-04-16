import { mkdir, access, writeFile } from 'node:fs/promises'
import path from 'node:path'

const [, , rawProjectKey, rawName] = process.argv

if (!rawProjectKey) {
  console.error('Usage: npm run bootstrap:project -- <projectKey> "<Project Name>"')
  process.exit(1)
}

const normalizeProjectKey = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const projectKey = normalizeProjectKey(rawProjectKey)
const projectName = rawName?.trim() || projectKey

if (!projectKey) {
  console.error('projectKey must contain at least one alphanumeric character.')
  process.exit(1)
}

const root = process.cwd()

const targets = [
  {
    file: path.join(root, 'src', 'app', '(app)', 'app', projectKey, 'page.tsx'),
    contents: `export default function ${projectKey
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')}Page() {
  return (
    <section>
      <p>${projectName}</p>
      <h1>${projectName} workspace</h1>
      <p>Build the project-specific product surface here on top of Studio99 Application Core.</p>
    </section>
  )
}
`,
  },
  {
    file: path.join(root, 'src', 'app', 'api', projectKey, 'route.ts'),
    contents: `import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    projectKey: '${projectKey}',
    projectName: '${projectName}',
  })
}
`,
  },
  {
    file: path.join(root, 'src', 'projects', projectKey, 'README.md'),
    contents: `# ${projectName}

- project key: \`${projectKey}\`
- primary route: \`/app/${projectKey}\`
- api route: \`/api/${projectKey}\`

Add project-specific collections, jobs, UI, and rollout notes here.
`,
  },
  {
    file: path.join(root, 'docs', 'projects', `${projectKey}.md`),
    contents: `# ${projectName}

## Scope

- project key: \`${projectKey}\`
- route: \`/app/${projectKey}\`
- api route: \`/api/${projectKey}\`

## Checklist

- define collections
- define jobs
- define rollout plan
- connect feature flags
- document billing implications
`,
  },
]

const writeIfMissing = async ({ file, contents }) => {
  try {
    await access(file)
    return { file, status: 'skipped' }
  } catch {
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, contents, 'utf8')
    return { file, status: 'created' }
  }
}

const results = await Promise.all(targets.map(writeIfMissing))

for (const result of results) {
  console.log(`${result.status}: ${path.relative(root, result.file)}`)
}
