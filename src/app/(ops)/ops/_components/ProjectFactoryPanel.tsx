'use client'

import type { ChangeEvent, CSSProperties } from 'react'
import { useMemo, useState } from 'react'

import { buildProjectBootstrapManifest, type ProjectTemplateOption } from '@/core/ops/bootstrap-preview'

type Manifest = {
  collections: readonly string[]
  docs: readonly string[]
  featureFlags: readonly string[]
  files: readonly string[]
  presetNextSteps: readonly string[]
  projectKey: string
  routes: readonly string[]
  templateDescription: string
  templateLabel: string
  useCases: readonly string[]
}

type WriteResult = {
  created: Array<{ file: string }>
  links: {
    apiRoute: string
    appRoute: string
    consoleFactoryRoute: string
    consoleProjectRoute: string
    consoleProjectsRoute: string
    docsPath: string
  }
  manifest: Manifest
  nextSteps: string[]
  skipped: Array<{ file: string }>
}

type BootstrapSummary = Pick<WriteResult, 'links' | 'manifest' | 'nextSteps'>

type Props = {
  templates: ProjectTemplateOption[]
}

type FormState = {
  name: string
  projectKey: string
  template: string
}

const inputStyle = {
  border: '1px solid #d4d4d8',
  borderRadius: '8px',
  font: 'inherit',
  padding: '12px 14px',
  width: '100%',
} satisfies CSSProperties

const buttonStyle = {
  background: '#111111',
  border: 0,
  borderRadius: '8px',
  color: '#ffffff',
  cursor: 'pointer',
  font: 'inherit',
  padding: '12px 16px',
} satisfies CSSProperties

const panelStyle = {
  borderTop: '1px solid #e4e4e7',
  paddingTop: '20px',
} satisfies CSSProperties

const cardStyle = {
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  padding: '16px',
} satisfies CSSProperties

const normalizeProjectKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const renderChips = (items: readonly string[]) => (
  <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', listStyle: 'none', margin: 0, padding: 0 }}>
    {items.map((item) => (
      <li
        key={item}
        style={{
          background: '#f4f4f5',
          borderRadius: '999px',
          color: '#27272a',
          fontSize: '13px',
          lineHeight: 1.4,
          padding: '6px 10px',
        }}
      >
        {item}
      </li>
    ))}
  </ul>
)

function ManifestList({ items, title }: { items: readonly string[]; title: string }) {
  return (
    <div>
      <p style={{ margin: '0 0 8px' }}>
        <strong>{title}</strong>
      </p>
      <ul style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function ProjectFactoryPanel({ templates }: Props) {
  const [form, setForm] = useState<FormState>({
    name: 'My App',
    projectKey: 'my-app',
    template: templates[0]?.value ?? 'workspace',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<null | 'create' | 'preview'>(null)
  const [preview, setPreview] = useState<BootstrapSummary | null>(null)
  const [result, setResult] = useState<WriteResult | null>(null)

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.value === form.template) ?? templates[0],
    [form.template, templates],
  )

  const normalizedProjectKey = useMemo(() => normalizeProjectKey(form.projectKey), [form.projectKey])
  const canSubmit = form.name.trim().length > 0 && normalizedProjectKey.length > 0

  const selectedTemplateManifest = useMemo(
    () =>
      buildProjectBootstrapManifest({
        name: form.name.trim() || 'Sample',
        projectKey: normalizedProjectKey || 'sample-project',
        template: form.template,
      }),
    [form.name, form.template, normalizedProjectKey],
  )

  const updateField =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const postJson = async <T,>(url: string): Promise<T> => {
    const response = await fetch(url, {
      body: JSON.stringify(form),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })

    const payload = (await response.json().catch(() => ({}))) as T & {
      error?: string
    }

    if (!response.ok) {
      throw new Error(payload.error ?? 'Project factory request failed.')
    }

    return payload
  }

  const handlePreview = async () => {
    setLoading('preview')
    setError(null)
    setResult(null)

    try {
      const nextPreview = await postJson<BootstrapSummary>('/api/ops/bootstrap/manifest')
      setPreview(nextPreview)
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'manifest の取得に失敗しました。')
    } finally {
      setLoading(null)
    }
  }

  const handleCreate = async () => {
    setLoading('create')
    setError(null)

    try {
      const nextResult = await postJson<WriteResult>('/api/ops/bootstrap/project')
      setPreview({
        links: nextResult.links,
        manifest: nextResult.manifest,
        nextSteps: nextResult.nextSteps,
      })
      setResult(nextResult)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'project 作成に失敗しました。')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section style={panelStyle}>
      <h2 style={{ margin: '0 0 10px' }}>Project Factory</h2>
      <p style={{ lineHeight: 1.7, margin: '0 0 18px' }}>
        template の違いを見てから作れるようにしています。use case / routes / collections / flags /
        preset next steps を、作成前に同じ画面で確認できます。
      </p>

      <section style={{ display: 'grid', gap: '14px', marginBottom: '22px' }}>
        <h3 style={{ margin: 0 }}>template gallery</h3>
        <div style={{ display: 'grid', gap: '14px' }}>
          {templates.map((template) => {
            const manifest = buildProjectBootstrapManifest({
              name: template.label,
              projectKey: `sample-${template.value}`,
              template: template.value,
            })

            return (
              <article key={template.value} style={cardStyle}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>{template.label}</strong>
                </p>
                <p style={{ color: '#52525b', lineHeight: 1.7, margin: '0 0 12px' }}>{template.description}</p>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>use cases</strong>
                    </p>
                    {renderChips(template.useCases)}
                  </div>
                  <ManifestList items={manifest.routes} title="generated routes" />
                  <ManifestList items={manifest.collections} title="generated collections" />
                  <ManifestList items={manifest.featureFlags} title="generated feature flags" />
                  <ManifestList items={manifest.presetNextSteps} title="preset next steps" />
                </div>
                <p style={{ color: '#71717a', fontFamily: 'monospace', margin: '12px 0 0' }}>
                  {manifest.templateLabel}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <div style={{ display: 'grid', gap: '14px', maxWidth: '780px' }}>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span>project key</span>
          <input onChange={updateField('projectKey')} style={inputStyle} value={form.projectKey} />
        </label>
        <p style={{ color: '#52525b', lineHeight: 1.7, margin: '-6px 0 0' }}>
          保存される project key: <strong>{normalizedProjectKey || '未入力'}</strong>
        </p>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span>表示名</span>
          <input onChange={updateField('name')} style={inputStyle} value={form.name} />
        </label>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span>テンプレート</span>
          <select onChange={updateField('template')} style={inputStyle} value={form.template}>
            {templates.map((template) => (
              <option key={template.value} value={template.value}>
                {template.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p style={{ color: '#52525b', lineHeight: 1.7, margin: '14px 0 0' }}>
        {selectedTemplate?.description}
      </p>

      <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
        <div>
          <p style={{ margin: '0 0 8px' }}>
            <strong>use cases</strong>
          </p>
          {renderChips(selectedTemplate?.useCases ?? [])}
        </div>
        <ManifestList items={selectedTemplateManifest.routes} title="generated routes" />
        <ManifestList items={selectedTemplateManifest.collections} title="generated collections" />
        <ManifestList items={selectedTemplateManifest.featureFlags} title="generated feature flags" />
        <ManifestList items={selectedTemplateManifest.presetNextSteps} title="preset next steps" />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '18px' }}>
        <button
          disabled={loading !== null || !canSubmit}
          onClick={handlePreview}
          style={buttonStyle}
          type="button"
        >
          {loading === 'preview' ? 'manifest 作成中...' : 'manifest を見る'}
        </button>
        <button
          disabled={loading !== null || !canSubmit}
          onClick={handleCreate}
          style={{ ...buttonStyle, background: '#2563eb' }}
          type="button"
        >
          {loading === 'create' ? 'scaffold 作成中...' : 'この project を作る'}
        </button>
      </div>

      {error ? <p style={{ color: '#b91c1c', margin: '16px 0 0' }}>{error}</p> : null}

      {preview ? (
        <div style={{ marginTop: '22px' }}>
          <p style={{ margin: '0 0 10px' }}>
            <strong>{preview.manifest.templateLabel}</strong> / {preview.manifest.projectKey}
          </p>
          <p style={{ color: '#52525b', lineHeight: 1.7, margin: '0 0 14px' }}>
            {preview.manifest.templateDescription}
          </p>
          <div style={{ display: 'grid', gap: '16px' }}>
            <ManifestList items={preview.manifest.useCases} title="use cases" />
            <ManifestList items={preview.manifest.routes} title="routes" />
            <ManifestList items={preview.manifest.files} title="files" />
            <ManifestList items={preview.manifest.collections} title="collections" />
            <ManifestList items={preview.manifest.featureFlags} title="feature flags" />
            <ManifestList items={preview.manifest.presetNextSteps} title="preset next steps" />
            <ManifestList items={preview.nextSteps} title="next steps" />
          </div>
          <p style={{ margin: '12px 0 0' }}>
            すぐ開く場所: <a href={preview.links.consoleProjectRoute}>{preview.links.consoleProjectRoute}</a> /{' '}
            <a href={preview.links.appRoute}>{preview.links.appRoute}</a> /{' '}
            <a href={preview.links.docsPath}>{preview.links.docsPath}</a>
          </p>
        </div>
      ) : null}

      {result ? (
        <div style={{ marginTop: '22px' }}>
          <p style={{ margin: '0 0 10px' }}>
            作成結果: 新規 {result.created.length} 件 / 既存スキップ {result.skipped.length} 件
          </p>
          <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
            <p style={{ margin: 0 }}>
              すぐ開く場所: <a href={result.links.consoleProjectRoute}>{result.links.consoleProjectRoute}</a> /{' '}
              <a href={result.links.appRoute}>{result.links.appRoute}</a> /{' '}
              <a href={result.links.apiRoute}>{result.links.apiRoute}</a>
            </p>
            <ol style={{ lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
              {result.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          {result.created.length > 0 ? <ManifestList items={result.created.map((item) => item.file)} title="created" /> : null}
          {result.skipped.length > 0 ? <ManifestList items={result.skipped.map((item) => item.file)} title="skipped" /> : null}
        </div>
      ) : null}
    </section>
  )
}
