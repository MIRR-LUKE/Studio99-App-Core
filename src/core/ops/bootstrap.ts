import { access, mkdir, writeFile } from 'node:fs/promises'
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
export const PROJECT_TEMPLATE_VALUES = Object.keys(PROJECT_TEMPLATES) as ProjectTemplate[]

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
  consoleProjectRoute: string
  consoleProjectsRoute: string
  docsPath: string
}

export type ProjectBootstrapSummary = {
  links: ProjectBootstrapLinks
  manifest: ReturnType<typeof buildProjectBootstrapManifest>
  nextSteps: string[]
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
  template?: ProjectTemplate | string
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

const toCollectionExportName = (collectionSlug: string) =>
  `${toComponentName(collectionSlug)}Collection`

const toCollectionFilePath = (projectKey: string, collectionSlug: string) =>
  `src/projects/${projectKey}/collections/${collectionSlug}.ts`

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

export const isProjectTemplate = (value: string): value is ProjectTemplate =>
  PROJECT_TEMPLATE_VALUES.includes(value as ProjectTemplate)

export const resolveProjectTemplate = (template?: ProjectTemplate | string): ProjectTemplate => {
  if (!template) {
    return DEFAULT_PROJECT_TEMPLATE
  }

  if (isProjectTemplate(template)) {
    return template
  }

  throw new Error(
    `Unsupported project template: ${template}. Supported templates: ${PROJECT_TEMPLATE_VALUES.join(', ')}`,
  )
}

const toCollectionNames = (projectKey: string, template?: ProjectTemplate) =>
  getTemplateDefinition(template).collectionSuffixes.map((suffix) => `${projectKey}-${suffix}`)

const toFeatureFlags = (projectKey: string, template?: ProjectTemplate) =>
  getTemplateDefinition(template).featureFlagSuffixes.map((suffix) => `${projectKey}-${suffix}`)

export const buildProjectBootstrapManifest = ({
  name,
  projectKey,
  template,
}: BootstrapManifestArgs) => {
  const normalizedProjectKey = normalizeProjectKey(projectKey)
  const resolvedTemplate = resolveProjectTemplate(template)
  const definition = getTemplateDefinition(resolvedTemplate)

  return {
    collections: toCollectionNames(normalizedProjectKey, resolvedTemplate),
    docs: [
      'README.md',
      'docs/how-to-use.md',
      'docs/bootstrap.md',
      `docs/projects/${normalizedProjectKey}.md`,
      `docs/projects/${normalizedProjectKey}-billing.md`,
    ],
    featureFlags: toFeatureFlags(normalizedProjectKey, resolvedTemplate),
    files: [
      `src/projects/${normalizedProjectKey}/README.md`,
      `src/projects/${normalizedProjectKey}/project.config.ts`,
      `src/projects/${normalizedProjectKey}/feature-flags.ts`,
      `src/projects/${normalizedProjectKey}/billing-note.md`,
      `src/projects/${normalizedProjectKey}/collections/README.md`,
      ...toCollectionNames(normalizedProjectKey, resolvedTemplate).map((collectionSlug) =>
        toCollectionFilePath(normalizedProjectKey, collectionSlug),
      ),
      `src/projects/${normalizedProjectKey}/components/README.md`,
      `src/projects/${normalizedProjectKey}/server/README.md`,
    ],
    name,
    projectKey: normalizedProjectKey,
    routes: [`/app/${normalizedProjectKey}`, `/api/${normalizedProjectKey}`],
    template: resolvedTemplate,
    templateDescription: definition.description,
    templateLabel: definition.label,
  }
}

export const buildProjectBootstrapSummary = (
  args: BootstrapManifestArgs,
): ProjectBootstrapSummary => {
  const manifest = buildProjectBootstrapManifest(args)

  return {
    links: getProjectBootstrapLinks(manifest),
    manifest,
    nextSteps: getProjectBootstrapNextSteps(manifest),
  }
}

export const getProjectBootstrapLinks = (
  manifest: ReturnType<typeof buildProjectBootstrapManifest>,
): ProjectBootstrapLinks => ({
  apiRoute: `/api/${manifest.projectKey}`,
  appRoute: `/app/${manifest.projectKey}`,
  consoleFactoryRoute: '/console/factory',
  consoleProjectRoute: `/console/projects/${manifest.projectKey}`,
  consoleProjectsRoute: '/console/projects',
  docsPath: `docs/projects/${manifest.projectKey}.md`,
})

export const getProjectBootstrapNextSteps = (
  manifest: ReturnType<typeof buildProjectBootstrapManifest>,
) => [
  `まず ${manifest.projectKey} の project.config と feature-flags を確認する`,
  `${getProjectBootstrapLinks(manifest).consoleProjectRoute} を開いて console 側の管理導線を確認する`,
  `${getProjectBootstrapLinks(manifest).appRoute} を開いて最初の画面を作る`,
  `${getProjectBootstrapLinks(manifest).apiRoute} を project 固有の API の始点にする`,
  `${getProjectBootstrapLinks(manifest).docsPath} に要件と運用メモを書く`,
]

const buildProjectScaffoldFiles = ({
  name,
  projectKey,
  root,
  template = DEFAULT_PROJECT_TEMPLATE,
}: ProjectScaffoldArgs): ProjectScaffoldFile[] => {
  const manifest = buildProjectBootstrapManifest({ name, projectKey, template })
  const links = getProjectBootstrapLinks(manifest)
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

## ひと目でわかる情報

- project key: \`${manifest.projectKey}\`
- template: \`${manifest.templateLabel}\`
- main route: \`${links.appRoute}\`
- api route: \`${links.apiRoute}\`
- console route: \`${links.consoleProjectRoute}\`
- docs: \`${links.docsPath}\`

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
5. \`docs/projects/${manifest.projectKey}.md\`
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

## 前提

- template: \`${manifest.templateLabel}\`
- planKey: \`${manifest.projectKey}-starter\`
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
      contents: `# ${name} collections

最初にここへ置く想定です。

- ${manifest.collections.join('\n- ')}

生成済みの stub:

${manifest.collections.map((collectionSlug) => `- \`${collectionSlug}.ts\``).join('\n')}
`,
    },
    ...manifest.collections.map((collectionSlug) => ({
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
- route: \`${links.appRoute}\`
- api route: \`${links.apiRoute}\`
- console route: \`${links.consoleProjectRoute}\`
- docs: \`${links.docsPath}\`

## この bootstrap でできること

- project の初期ファイルを置く
- template ごとの collection ひな形を決める
- feature flags の初期値を入れる
- billing の前提を残す

## まずやること

1. \`project.config.ts\` を詰める
2. \`feature-flags.ts\` を結線する
3. \`collections/README.md\` から collection を作る
4. \`/console/projects/${manifest.projectKey}\` を開いて管理導線を確認する
5. \`/app/${manifest.projectKey}\` に最初の画面を足す
`,
    },
    {
      file: path.join(workspaceRoot, 'docs', 'projects', `${manifest.projectKey}-billing.md`),
      contents: `# ${name} billing メモ

## 前提

- template: \`${manifest.templateLabel}\`
- planKey: \`${manifest.projectKey}-starter\`
- 料金・権限・seat 数の対応は core 側の billing catalog に合わせる

## ここに残すこと

- project 固有の料金条件
- 特殊な entitlement
- 失敗時の扱い
- 請求通知の補足
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

export { listLocalProjects } from './local-projects'
