import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const PROJECT_TEMPLATES = {
  content: {
    collectionSuffixes: ['articles', 'assets', 'releases'],
    description: 'メディア、コンテンツ配信、ドキュメント中心のプロダクト向けです。',
    featureFlagSuffixes: ['editorial-beta', 'preview'],
    label: 'コンテンツ',
  },
  'ops-tool': {
    collectionSuffixes: ['tasks', 'runs', 'alerts'],
    description: '社内ツール、運用ダッシュボード、バックオフィス向けです。',
    featureFlagSuffixes: ['ops-preview', 'danger-zone'],
    label: '運用ツール',
  },
  saas: {
    collectionSuffixes: ['customers', 'workspaces', 'events'],
    description: 'SaaS や継続課金アプリ向けです。',
    featureFlagSuffixes: ['billing-beta', 'team-rollout'],
    label: 'SaaS',
  },
  workspace: {
    collectionSuffixes: ['records', 'reports', 'notes'],
    description: '業務アプリや会員制アプリ向けの標準テンプレートです。',
    featureFlagSuffixes: ['beta', 'ops-preview'],
    label: '標準ワークスペース',
  },
}

const DEFAULT_TEMPLATE = 'workspace'

const [, , rawProjectKey, rawName, rawTemplate] = process.argv

if (!rawProjectKey) {
  console.error('使い方: npm run bootstrap:project -- <projectKey> "<プロジェクト名>" [template]')
  process.exit(1)
}

const normalizeProjectKey = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const toComponentName = (projectKey) =>
  projectKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const projectKey = normalizeProjectKey(rawProjectKey)
const projectName = rawName?.trim() || projectKey
const template = PROJECT_TEMPLATES[rawTemplate] ? rawTemplate : DEFAULT_TEMPLATE

if (!projectKey) {
  console.error('projectKey には英数字を少なくとも 1 文字含めてください。')
  process.exit(1)
}

const definition = PROJECT_TEMPLATES[template]
const featureFlags = definition.featureFlagSuffixes.map((suffix) => `${projectKey}-${suffix}`)
const collections = definition.collectionSuffixes.map((suffix) => `${projectKey}-${suffix}`)

const root = process.cwd()
const projectRoot = path.join(root, 'src', 'projects', projectKey)

const targets = [
  {
    file: path.join(root, 'src', 'app', '(app)', 'app', projectKey, 'page.tsx'),
    contents: `export default function ${toComponentName(projectKey)}Page() {
  return (
    <section>
      <p>${projectName}</p>
      <h1>${projectName} ワークスペース</h1>
      <p>${definition.label} テンプレートから作った project です。ここに画面と機能を積み上げていきます。</p>
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
    template: '${template}',
  })
}
`,
  },
  {
    file: path.join(projectRoot, 'README.md'),
    contents: `# ${projectName}

- project key: \`${projectKey}\`
- template: \`${definition.label}\`
- main route: \`/app/${projectKey}\`
- api route: \`/api/${projectKey}\`

このディレクトリには project 固有の collection / component / server 処理を置きます。
`,
  },
  {
    file: path.join(projectRoot, 'project.config.ts'),
    contents: `export const projectConfig = {
  billing: {
    note: 'この project の billing 前提と entitlement の前提を書きます。',
    planKey: '${projectKey}-starter',
  },
  featureFlags: ${JSON.stringify(featureFlags, null, 2)},
  key: '${projectKey}',
  name: '${projectName}',
  template: '${template}',
}
`,
  },
  {
    file: path.join(projectRoot, 'feature-flags.ts'),
    contents: `export const projectFeatureFlags = {
${featureFlags.map((flag) => `  ${flag.split('-').slice(1).join('_') || 'primary'}: '${flag}',`).join('\n')}
}
`,
  },
  {
    file: path.join(projectRoot, 'billing-note.md'),
    contents: `# ${projectName} billing メモ

- template: \`${definition.label}\`
- planKey: \`${projectKey}-starter\`
- billing の前提と entitlement の対応を書きます
- Stripe catalog の変更は core の \`billing-settings\` にも反映します
`,
  },
  {
    file: path.join(projectRoot, 'collections', 'README.md'),
    contents: `# ${projectName} collections

最初にここへ置く想定です。

- ${collections.join('\n- ')}
`,
  },
  {
    file: path.join(projectRoot, 'components', 'README.md'),
    contents: `# ${projectName} components

project 固有の UI component はここにまとめます。
`,
  },
  {
    file: path.join(projectRoot, 'server', 'README.md'),
    contents: `# ${projectName} server

project 固有の helper、query、workflow、Route Handler まわりの実装メモをここへ置きます。
`,
  },
  {
    file: path.join(root, 'docs', 'projects', `${projectKey}.md`),
    contents: `# ${projectName}

## 概要

- project key: \`${projectKey}\`
- template: \`${definition.label}\`
- route: \`/app/${projectKey}\`
- api route: \`/api/${projectKey}\`

## まずやること

- collection を定義する
- page / component を project 側に足す
- feature flag を結線する
- billing 影響を確認する
`,
  },
  {
    file: path.join(root, 'docs', 'projects', `${projectKey}-billing.md`),
    contents: `# ${projectName} billing メモ

- template: \`${definition.label}\`
- planKey: \`${projectKey}-starter\`
- 料金・権限・seat 数の対応は core 側の billing catalog に合わせる
- project 固有の課金条件はここに残す
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

console.log(`template: ${definition.label}`)
for (const result of results) {
  console.log(`${result.status}: ${path.relative(root, result.file)}`)
}
