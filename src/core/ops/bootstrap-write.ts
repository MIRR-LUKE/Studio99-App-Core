import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  DEFAULT_PROJECT_TEMPLATE,
  buildProjectBootstrapManifest,
  getProjectBootstrapLinks,
  getProjectBootstrapNextSteps,
  resolveProjectTemplate,
  type ProjectTemplate,
} from './bootstrap-preview'

type ProjectBootstrapLinks = ReturnType<typeof getProjectBootstrapLinks>

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
const resolveTargetPath = (segments: string[], root?: string) =>
  root
    ? path.join(root, ...segments)
    : path.join(/* turbopackIgnore: true */ process.cwd(), ...segments)

const toComponentName = (projectKey: string) =>
  projectKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const toCollectionExportName = (collectionSlug: string) =>
  `${toComponentName(collectionSlug)}Collection`

const toCollectionFilePath = (projectKey: string, collectionSlug: string) =>
  `src/projects/${projectKey}/collections/${collectionSlug}.ts`

const buildProjectScaffoldFiles = ({
  name,
  projectKey,
  root,
  template = DEFAULT_PROJECT_TEMPLATE,
}: ProjectScaffoldArgs): ProjectScaffoldFile[] => {
  const manifest = buildProjectBootstrapManifest({ name, projectKey, template })
  const links = getProjectBootstrapLinks(manifest)
  const componentName = toComponentName(manifest.projectKey)
  const projectRoot = resolveTargetPath([...SRC_PROJECTS_ROOT, manifest.projectKey], root)

  return [
    {
      file: resolveTargetPath(['src', 'app', '(app)', 'app', manifest.projectKey, 'page.tsx'], root),
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
      file: resolveTargetPath(['src', 'app', 'api', manifest.projectKey, 'route.ts'], root),
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
      file: resolveTargetPath(['docs', 'projects', `${manifest.projectKey}.md`], root),
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
      file: resolveTargetPath(['docs', 'projects', `${manifest.projectKey}-billing.md`], root),
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
