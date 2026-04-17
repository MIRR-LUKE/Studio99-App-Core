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
const TEMPLATE_KEYS = Object.keys(PROJECT_TEMPLATES)

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

const toCollectionExportName = (collectionSlug) => `${toComponentName(collectionSlug)}Collection`

const resolveTemplate = (value) => {
  if (!value) {
    return DEFAULT_TEMPLATE
  }

  if (Object.prototype.hasOwnProperty.call(PROJECT_TEMPLATES, value)) {
    return value
  }

  throw new Error(`unsupported template: ${value}. supported templates: ${TEMPLATE_KEYS.join(', ')}`)
}

const projectKey = normalizeProjectKey(rawProjectKey)
const projectName = rawName?.trim() || projectKey
let template

try {
  template = resolveTemplate(rawTemplate)
} catch (error) {
  console.error(error instanceof Error ? error.message : 'unsupported template.')
  process.exit(1)
}

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

## ひと目でわかる情報

- project key: \`${projectKey}\`
- template: \`${definition.label}\`
- main route: \`/app/${projectKey}\`
- api route: \`/api/${projectKey}\`
- console route: \`/console/projects/${projectKey}\`
- docs: \`docs/projects/${projectKey}.md\`

## この project に置くもの

- 固有の collection
- 固有の page / component
- 固有の Route Handler
- 固有の workflow / helper

## まず触る順番

1. \`project.config.ts\`
2. \`feature-flags.ts\`
3. \`billing-note.md\`
4. \`collections/README.md\`
5. \`docs/projects/${projectKey}.md\`
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

## 前提

- template: \`${definition.label}\`
- planKey: \`${projectKey}-starter\`
- Stripe catalog の変更は core の \`billing-settings\` と合わせる

## ここに書くこと

- 料金と seat 数の対応
- entitlement の条件
- billing 失敗時の扱い
- project 固有の請求メモ
`,
  },
  {
    file: path.join(projectRoot, 'collections', 'README.md'),
    contents: `# ${projectName} collections

最初にここへ置く想定です。

- ${collections.join('\n- ')}

生成済みの stub:

${collections.map((collectionSlug) => `- \`${collectionSlug}.ts\``).join('\n')}
`,
  },
  ...collections.map((collectionSlug) => ({
    file: path.join(projectRoot, 'collections', `${collectionSlug}.ts`),
    contents: `import type { CollectionConfig } from 'payload'

export const ${toCollectionExportName(collectionSlug)}: CollectionConfig = {
  slug: '${collectionSlug}',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
`,
  })),
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
- console route: \`/console/projects/${projectKey}\`
- docs: \`docs/projects/${projectKey}.md\`

## この bootstrap でできること

- project の初期ファイルを置く
- template ごとの collection ひな形を決める
- feature flags の初期値を入れる
- billing の前提を残す

## まずやること

1. \`project.config.ts\` を詰める
2. \`feature-flags.ts\` を結線する
3. \`collections/README.md\` から collection を作る
4. \`/console/projects/${projectKey}\` を開いて管理導線を確認する
5. \`/app/${projectKey}\` に最初の画面を足す
`,
  },
  {
    file: path.join(root, 'docs', 'projects', `${projectKey}-billing.md`),
    contents: `# ${projectName} billing メモ

## 前提

- template: \`${definition.label}\`
- planKey: \`${projectKey}-starter\`
- 料金・権限・seat 数の対応は core 側の billing catalog に合わせる

## ここに残すこと

- project 固有の料金条件
- 特殊な entitlement
- 失敗時の扱い
- 請求通知の補足
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
