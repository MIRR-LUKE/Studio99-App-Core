import { access, mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const PROJECT_TEMPLATES = {
  content: {
    collectionSuffixes: ['articles', 'assets', 'releases'],
    description:
      'メディア、コンテンツ配信、ドキュメント中心のプロダクト向けです。公開導線と運用導線を早く作れます。',
    featureFlagSuffixes: ['editorial-beta', 'preview'],
    label: 'コンテンツ',
  },
  'ops-tool': {
    collectionSuffixes: ['tasks', 'runs', 'alerts'],
    description:
      '社内ツール、運用ダッシュボード、バックオフィス向けです。管理画面と ops 導線を強く使う前提です。',
    featureFlagSuffixes: ['ops-preview', 'danger-zone'],
    label: '運用ツール',
  },
  saas: {
    collectionSuffixes: ['customers', 'workspaces', 'events'],
    description:
      'SaaS や継続課金アプリ向けです。tenant / billing / entitlement と相性のよい始点を用意します。',
    featureFlagSuffixes: ['billing-beta', 'team-rollout'],
    label: 'SaaS',
  },
  workspace: {
    collectionSuffixes: ['records', 'reports', 'notes'],
    description:
      '業務アプリ、会員制アプリ、受託案件の初期構成に向いた標準テンプレートです。',
    featureFlagSuffixes: ['beta', 'ops-preview'],
    label: '標準ワークスペース',
  },
} as const

export type ProjectTemplate = keyof typeof PROJECT_TEMPLATES

export const DEFAULT_PROJECT_TEMPLATE: ProjectTemplate = 'workspace'

export type ProjectTemplateOption = {
  description: string
  label: string
  value: ProjectTemplate
}

type ProjectBootstrapLinks = {
  apiRoute: string
  appRoute: string
  consoleFactoryRoute: string
  consoleProjectsRoute: string
  docsPath: string
}

type ProjectBootstrapResult = {
  created: Array<{ file: string; status: 'created' }>
  links: ProjectBootstrapLinks
  manifest: ReturnType<typeof buildProjectBootstrapManifest>
  nextSteps: string[]
  skipped: Array<{ file: string; status: 'skipped' }>
}

type BootstrapManifestArgs = {
  name: string
  projectKey: string
  template?: ProjectTemplate
}

type ProjectScaffoldArgs = BootstrapManifestArgs & {
  root?: string
}

type ProjectScaffoldFile = {
  contents: string
  file: string
}

const SRC_PROJECTS_ROOT = ['src', 'projects']

const resolveWorkspaceRoot = (root?: string) =>
  root ??
  (/* turbopackIgnore: true */
  process.cwd())

const toComponentName = (projectKey: string) =>
  projectKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

export const normalizeProjectKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export const projectTemplateOptions: ProjectTemplateOption[] = (
  Object.entries(PROJECT_TEMPLATES) as Array<[ProjectTemplate, (typeof PROJECT_TEMPLATES)[ProjectTemplate]]>
).map(([value, definition]) => ({
  description: definition.description,
  label: definition.label,
  value,
}))

const getTemplateDefinition = (template?: ProjectTemplate) =>
  PROJECT_TEMPLATES[template ?? DEFAULT_PROJECT_TEMPLATE]

const toCollectionNames = (projectKey: string, template?: ProjectTemplate) =>
  getTemplateDefinition(template).collectionSuffixes.map((suffix) => `${projectKey}-${suffix}`)

const toFeatureFlags = (projectKey: string, template?: ProjectTemplate) =>
  getTemplateDefinition(template).featureFlagSuffixes.map((suffix) => `${projectKey}-${suffix}`)

export const buildProjectBootstrapManifest = ({
  name,
  projectKey,
  template = DEFAULT_PROJECT_TEMPLATE,
}: BootstrapManifestArgs) => {
  const normalizedProjectKey = normalizeProjectKey(projectKey)
  const definition = getTemplateDefinition(template)

  return {
    collections: toCollectionNames(normalizedProjectKey, template),
    docs: [
      'README.md',
      'docs/how-to-use.md',
      'docs/bootstrap.md',
      `docs/projects/${normalizedProjectKey}.md`,
      `docs/projects/${normalizedProjectKey}-billing.md`,
    ],
    featureFlags: toFeatureFlags(normalizedProjectKey, template),
    files: [
      `src/projects/${normalizedProjectKey}/README.md`,
      `src/projects/${normalizedProjectKey}/project.config.ts`,
      `src/projects/${normalizedProjectKey}/feature-flags.ts`,
      `src/projects/${normalizedProjectKey}/billing-note.md`,
      `src/projects/${normalizedProjectKey}/collections/README.md`,
      `src/projects/${normalizedProjectKey}/components/README.md`,
      `src/projects/${normalizedProjectKey}/server/README.md`,
    ],
    name,
    projectKey: normalizedProjectKey,
    routes: [`/app/${normalizedProjectKey}`, `/api/${normalizedProjectKey}`],
    template,
    templateDescription: definition.description,
    templateLabel: definition.label,
  }
}

export const getProjectBootstrapLinks = (
  manifest: ReturnType<typeof buildProjectBootstrapManifest>,
): ProjectBootstrapLinks => ({
  apiRoute: `/api/${manifest.projectKey}`,
  appRoute: `/app/${manifest.projectKey}`,
  consoleFactoryRoute: '/console/factory',
  consoleProjectsRoute: '/console/projects',
  docsPath: `docs/projects/${manifest.projectKey}.md`,
})

export const getProjectBootstrapNextSteps = (
  manifest: ReturnType<typeof buildProjectBootstrapManifest>,
) => [
  `まず ${manifest.projectKey} の project.config と feature-flags を確認する`,
  `${getProjectBootstrapLinks(manifest).appRoute} を開いて最初の画面を作る`,
  `${getProjectBootstrapLinks(manifest).apiRoute} を project 固有の API の始点にする`,
  `${getProjectBootstrapLinks(manifest).docsPath} に要件と運用メモを書く`,
]

const buildProjectScaffoldFiles = ({
  name,
  projectKey,
  root = process.cwd(),
  template = DEFAULT_PROJECT_TEMPLATE,
}: ProjectScaffoldArgs): ProjectScaffoldFile[] => {
  const manifest = buildProjectBootstrapManifest({ name, projectKey, template })
  const componentName = toComponentName(manifest.projectKey)
  const workspaceRoot = resolveWorkspaceRoot(root)
  const projectRoot = path.join(workspaceRoot, ...SRC_PROJECTS_ROOT, manifest.projectKey)

  return [
    {
      file: path.join(workspaceRoot, 'src', 'app', '(app)', 'app', manifest.projectKey, 'page.tsx'),
      contents: `export default function ${componentName}Page() {
  return (
    <section>
      <p>${name}</p>
      <h1>${name} ワークスペース</h1>
      <p>${manifest.templateLabel} テンプレートから作った project です。ここに画面と機能を積み上げていきます。</p>
    </section>
  )
}
`,
    },
    {
      file: path.join(workspaceRoot, 'src', 'app', 'api', manifest.projectKey, 'route.ts'),
      contents: `import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    projectKey: '${manifest.projectKey}',
    projectName: '${name}',
    template: '${template}',
  })
}
`,
    },
    {
      file: path.join(projectRoot, 'README.md'),
      contents: `# ${name}

- project key: \`${manifest.projectKey}\`
- template: \`${manifest.templateLabel}\`
- main route: \`/app/${manifest.projectKey}\`
- api route: \`/api/${manifest.projectKey}\`

このディレクトリには project 固有の collection / component / server 処理を置きます。
`,
    },
    {
      file: path.join(projectRoot, 'project.config.ts'),
      contents: `export const projectConfig = {
  billing: {
    note: 'この project の billing 前提と entitlement の前提を書きます。',
    planKey: '${manifest.projectKey}-starter',
  },
  featureFlags: ${JSON.stringify(manifest.featureFlags, null, 2)},
  key: '${manifest.projectKey}',
  name: '${name}',
  template: '${template}',
}
`,
    },
    {
      file: path.join(projectRoot, 'feature-flags.ts'),
      contents: `export const projectFeatureFlags = {
${manifest.featureFlags.map((flag) => `  ${flag.split('-').slice(1).join('_') || 'primary'}: '${flag}',`).join('\n')}
}
`,
    },
    {
      file: path.join(projectRoot, 'billing-note.md'),
      contents: `# ${name} billing メモ

- template: \`${manifest.templateLabel}\`
- planKey: \`${manifest.projectKey}-starter\`
- billing の前提と entitlement の対応を書きます
- Stripe catalog の変更は core の \`billing-settings\` にも反映します
`,
    },
    {
      file: path.join(projectRoot, 'collections', 'README.md'),
      contents: `# ${name} collections

最初にここへ置く想定です。

- ${manifest.collections.join('\n- ')}
`,
    },
    {
      file: path.join(projectRoot, 'components', 'README.md'),
      contents: `# ${name} components

project 固有の UI component はここにまとめます。
`,
    },
    {
      file: path.join(projectRoot, 'server', 'README.md'),
      contents: `# ${name} server

project 固有の helper、query、workflow、Route Handler まわりの実装メモをここへ置きます。
`,
    },
    {
      file: path.join(workspaceRoot, 'docs', 'projects', `${manifest.projectKey}.md`),
      contents: `# ${name}

## 概要

- project key: \`${manifest.projectKey}\`
- template: \`${manifest.templateLabel}\`
- route: \`/app/${manifest.projectKey}\`
- api route: \`/api/${manifest.projectKey}\`

## まずやること

- collection を定義する
- page / component を project 側に足す
- feature flag を結線する
- billing 影響を確認する
`,
    },
    {
      file: path.join(workspaceRoot, 'docs', 'projects', `${manifest.projectKey}-billing.md`),
      contents: `# ${name} billing メモ

- template: \`${manifest.templateLabel}\`
- planKey: \`${manifest.projectKey}-starter\`
- 料金・権限・seat 数の対応は core 側の billing catalog に合わせる
- project 固有の課金条件はここに残す
`,
    },
  ]
}

const writeIfMissing = async ({ contents, file }: ProjectScaffoldFile) => {
  try {
    await access(file)
    return { file, status: 'skipped' as const }
  } catch {
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, contents, 'utf8')
    return { file, status: 'created' as const }
  }
}

export const writeProjectScaffold = async (args: ProjectScaffoldArgs) => {
  const manifest = buildProjectBootstrapManifest(args)
  const files = buildProjectScaffoldFiles(args)
  const results = await Promise.all(files.map(writeIfMissing))

  return {
    created: results.filter((result) => result.status === 'created'),
    links: getProjectBootstrapLinks(manifest),
    manifest,
    nextSteps: getProjectBootstrapNextSteps(manifest),
    skipped: results.filter((result) => result.status === 'skipped'),
  } satisfies ProjectBootstrapResult
}

export const listLocalProjects = async (root?: string) => {
  const projectRoot = path.join(resolveWorkspaceRoot(root), ...SRC_PROJECTS_ROOT)
  const entries = await readdir(projectRoot, { withFileTypes: true }).catch(() => [])

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      docsPath: `docs/projects/${entry.name}.md`,
      key: entry.name,
      route: `/app/${entry.name}`,
    }))
    .sort((left, right) => left.key.localeCompare(right.key))
}
