import { mkdir, access, writeFile } from 'node:fs/promises'
import path from 'node:path'

const [, , rawProjectKey, rawName] = process.argv

if (!rawProjectKey) {
  console.error('使い方: npm run bootstrap:project -- <projectKey> "<Project Name>"')
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
  console.error('projectKey には英数字を少なくとも 1 文字含めてください。')
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
      <p>ここに Studio99 Application Core の上で project 固有のプロダクト画面を作っていきます。</p>
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

ここに project 固有の collection、job、UI、rollout note を追加します。
`,
  },
  {
    file: path.join(root, 'docs', 'projects', `${projectKey}.md`),
    contents: `# ${projectName}

## 概要

- project key: \`${projectKey}\`
- route: \`/app/${projectKey}\`
- api route: \`/api/${projectKey}\`

## チェックリスト

- collection を定義する
- job を定義する
- rollout plan を定義する
- feature flag を接続する
- billing 影響を文書化する
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
