export const PROJECT_TEMPLATES = {
  content: {
    collectionSuffixes: ['articles', 'assets', 'releases'],
    description:
      'メディア、コンテンツ配信、ドキュメント中心のプロダクト向けです。公開導線と運用導線を早く作れます。',
    featureFlagSuffixes: ['editorial-beta', 'preview'],
    label: 'コンテンツ',
    presetNextSteps: [
      'articles を公開一覧の中心にする',
      'assets を画像・添付の正本として扱う',
      'releases で配信や更新の節目を記録する',
    ],
    useCases: ['記事配信', 'ナレッジベース', '公開コンテンツ運用'],
  },
  'ops-tool': {
    collectionSuffixes: ['tasks', 'runs', 'alerts'],
    description:
      '社内ツール、運用ダッシュボード、バックオフィス向けです。管理画面と ops 導線を強く使う前提です。',
    featureFlagSuffixes: ['ops-preview', 'danger-zone'],
    label: '運用ツール',
    presetNextSteps: [
      'tasks を日次運用の入口にする',
      'runs で実行履歴と再試行の判断材料を残す',
      'alerts を危険操作や障害検知の起点にする',
    ],
    useCases: ['社内管理画面', '運用ダッシュボード', '承認フロー管理'],
  },
  saas: {
    collectionSuffixes: ['customers', 'workspaces', 'events'],
    description:
      'SaaS や継続課金アプリ向けです。tenant / billing / entitlement と相性のよい始点を用意します。',
    featureFlagSuffixes: ['billing-beta', 'team-rollout'],
    label: 'SaaS',
    presetNextSteps: [
      'customers を課金対象の中心にする',
      'workspaces で tenant と membership を束ねる',
      'events で請求・監査・利用イベントを集める',
    ],
    useCases: ['B2B SaaS', 'サブスク課金', 'ワークスペース型アプリ'],
  },
  workspace: {
    collectionSuffixes: ['records', 'reports', 'notes'],
    description:
      '業務アプリ、会員制アプリ、受託案件の初期構成に向いた標準テンプレートです。',
    featureFlagSuffixes: ['beta', 'ops-preview'],
    label: '標準ワークスペース',
    presetNextSteps: [
      'records を一覧と詳細の起点にする',
      'reports を集計や進捗確認の中心にする',
      'notes に運用メモや補足情報を寄せる',
    ],
    useCases: ['業務アプリ', '会員制サービス', '受託案件の土台'],
  },
} as const

export type ProjectTemplate = keyof typeof PROJECT_TEMPLATES
export const PROJECT_TEMPLATE_VALUES = Object.keys(PROJECT_TEMPLATES) as ProjectTemplate[]

export const DEFAULT_PROJECT_TEMPLATE: ProjectTemplate = 'workspace'

export type ProjectTemplateOption = {
  description: string
  label: string
  useCases: readonly string[]
  value: ProjectTemplate
}

type BootstrapManifestArgs = {
  name: string
  projectKey: string
  template?: ProjectTemplate | string
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

const normalizeProjectKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const toCollectionFilePath = (projectKey: string, collectionSlug: string) =>
  `src/projects/${projectKey}/collections/${collectionSlug}.ts`

const toCollectionNames = (projectKey: string, template?: ProjectTemplate) =>
  getTemplateDefinition(template).collectionSuffixes.map((suffix) => `${projectKey}-${suffix}`)

const toFeatureFlags = (projectKey: string, template?: ProjectTemplate) =>
  getTemplateDefinition(template).featureFlagSuffixes.map((suffix) => `${projectKey}-${suffix}`)

const toPresetNextSteps = (projectKey: string, template?: ProjectTemplate) =>
  getTemplateDefinition(template).presetNextSteps.map((step) =>
    step
      .replaceAll('articles', `${projectKey}-articles`)
      .replaceAll('assets', `${projectKey}-assets`)
      .replaceAll('releases', `${projectKey}-releases`)
      .replaceAll('tasks', `${projectKey}-tasks`)
      .replaceAll('runs', `${projectKey}-runs`)
      .replaceAll('alerts', `${projectKey}-alerts`)
      .replaceAll('customers', `${projectKey}-customers`)
      .replaceAll('workspaces', `${projectKey}-workspaces`)
      .replaceAll('events', `${projectKey}-events`)
      .replaceAll('records', `${projectKey}-records`)
      .replaceAll('reports', `${projectKey}-reports`)
      .replaceAll('notes', `${projectKey}-notes`),
  )

export const projectTemplateOptions: ProjectTemplateOption[] = (
  Object.entries(PROJECT_TEMPLATES) as Array<[ProjectTemplate, (typeof PROJECT_TEMPLATES)[ProjectTemplate]]>
).map(([value, definition]) => ({
  description: definition.description,
  label: definition.label,
  useCases: definition.useCases,
  value,
}))

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
    presetNextSteps: toPresetNextSteps(normalizedProjectKey, resolvedTemplate),
    projectKey: normalizedProjectKey,
    routes: [
      `/app/${normalizedProjectKey}`,
      `/api/${normalizedProjectKey}`,
      `/console/projects/${normalizedProjectKey}`,
    ],
    template: resolvedTemplate,
    templateDescription: definition.description,
    templateLabel: definition.label,
    useCases: definition.useCases,
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
