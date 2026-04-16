import { mkdir, access, writeFile } from 'node:fs/promises'
import path from 'node:path'

const [, , rawProjectKey, rawName] = process.argv

if (!rawProjectKey) {
  console.error('使い方: npm run bootstrap:project -- <projectKey> "<プロジェクト名>"')
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
      <h1>${projectName} ワークスペース</h1>
      <p>ここに Studio99 Application Core の上で project 固有の画面と機能を積み上げていきます。</p>
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
- main route: \`/app/${projectKey}\`
- api route: \`/api/${projectKey}\`

ここに project 固有の collection、job、UI、rollout note を追加します。
`,
  },
  {
    file: path.join(root, 'src', 'projects', projectKey, 'project.config.ts'),
    contents: `export const projectConfig = {
  billing: {
    note: 'この project の billing 前提と entitlement の前提を書きます。',
    planKey: '${projectKey}-starter',
  },
  featureFlags: ['${projectKey}-beta', '${projectKey}-ops-preview'],
  key: '${projectKey}',
  name: '${projectName}',
}
`,
  },
  {
    file: path.join(root, 'src', 'projects', projectKey, 'feature-flags.ts'),
    contents: `export const projectFeatureFlags = {
  beta: '${projectKey}-beta',
  opsPreview: '${projectKey}-ops-preview',
}
`,
  },
  {
    file: path.join(root, 'src', 'projects', projectKey, 'billing-note.md'),
    contents: `# ${projectName} billing メモ

- planKey: \`${projectKey}-starter\`
- billing の前提と entitlement の対応を書きます
- Stripe catalog の変更は core の \`billing-settings\` にも反映します
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
  {
    file: path.join(root, 'docs', 'projects', `${projectKey}-billing.md`),
    contents: `# ${projectName} billing メモ

- planKey: \`${projectKey}-starter\`
- 料金・権限・seat 数の対応は core 側の billing catalog に合わせる
- 追加の課金条件は project note にのみ置き、core へは contract だけを返す
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
