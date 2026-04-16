'use client'

import type { ChangeEvent, CSSProperties } from 'react'
import { useMemo, useState } from 'react'

type Manifest = {
  collections: string[]
  docs: string[]
  featureFlags: string[]
  files: string[]
  projectKey: string
  routes: string[]
  templateDescription: string
  templateLabel: string
}

type TemplateOption = {
  description: string
  label: string
  value: string
}

type WriteResult = {
  created: Array<{ file: string }>
  manifest: Manifest
  skipped: Array<{ file: string }>
}

type Props = {
  templates: TemplateOption[]
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

export function ProjectFactoryPanel({ templates }: Props) {
  const [form, setForm] = useState<FormState>({
    name: 'My App',
    projectKey: 'my-app',
    template: templates[0]?.value ?? 'workspace',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<null | 'create' | 'preview'>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [result, setResult] = useState<WriteResult | null>(null)

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.value === form.template) ?? templates[0],
    [form.template, templates],
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
      const nextManifest = await postJson<Manifest>('/api/ops/bootstrap/manifest')
      setManifest(nextManifest)
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
      setManifest(nextResult.manifest)
      setResult(nextResult)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'project 作成に失敗しました。')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section style={{ borderTop: '1px solid #e4e4e7', paddingTop: '20px' }}>
      <h2 style={{ margin: '0 0 10px' }}>Project Factory</h2>
      <p style={{ lineHeight: 1.7, margin: '0 0 18px' }}>
        key と名前を入れると、project 用の route / docs / config / feature flag stub をまとめて作れます。
      </p>
      <div style={{ display: 'grid', gap: '14px', maxWidth: '720px' }}>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span>project key</span>
          <input onChange={updateField('projectKey')} style={inputStyle} value={form.projectKey} />
        </label>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '18px' }}>
        <button
          disabled={loading !== null}
          onClick={handlePreview}
          style={buttonStyle}
          type="button"
        >
          {loading === 'preview' ? 'manifest 作成中...' : 'manifest を見る'}
        </button>
        <button
          disabled={loading !== null}
          onClick={handleCreate}
          style={{ ...buttonStyle, background: '#2563eb' }}
          type="button"
        >
          {loading === 'create' ? 'scaffold 作成中...' : 'この project を作る'}
        </button>
      </div>
      {error ? (
        <p style={{ color: '#b91c1c', margin: '16px 0 0' }}>{error}</p>
      ) : null}
      {manifest ? (
        <div style={{ marginTop: '22px' }}>
          <p style={{ margin: '0 0 10px' }}>
            <strong>{manifest.templateLabel}</strong> / {manifest.projectKey}
          </p>
          <p style={{ color: '#52525b', lineHeight: 1.7, margin: '0 0 14px' }}>
            {manifest.templateDescription}
          </p>
          <div style={{ display: 'grid', gap: '16px' }}>
            <ManifestList items={manifest.routes} title="routes" />
            <ManifestList items={manifest.files} title="files" />
            <ManifestList items={manifest.collections} title="collections" />
            <ManifestList items={manifest.featureFlags} title="feature flags" />
          </div>
        </div>
      ) : null}
      {result ? (
        <div style={{ marginTop: '22px' }}>
          <p style={{ margin: '0 0 10px' }}>
            作成結果: 新規 {result.created.length} 件 / 既存スキップ {result.skipped.length} 件
          </p>
          {result.created.length > 0 ? <ManifestList items={result.created.map((item) => item.file)} title="created" /> : null}
          {result.skipped.length > 0 ? <ManifestList items={result.skipped.map((item) => item.file)} title="skipped" /> : null}
        </div>
      ) : null}
    </section>
  )
}

function ManifestList({ items, title }: { items: string[]; title: string }) {
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
