import Link from 'next/link'

import InviteAcceptForm from './invite-accept-form'

export const dynamic = 'force-dynamic'

type InviteAcceptPageProps = {
  searchParams: Promise<{
    token?: string | string[]
  }>
}

const getTokenFromSearchParams = async (searchParams: InviteAcceptPageProps['searchParams']) => {
  const resolvedSearchParams = await searchParams
  const token = resolvedSearchParams.token

  if (Array.isArray(token)) {
    return token[0] ?? ''
  }

  return token ?? ''
}

export default async function InviteAcceptPage({ searchParams }: InviteAcceptPageProps) {
  const initialToken = await getTokenFromSearchParams(searchParams)

  return (
    <section style={{ display: 'grid', gap: '20px' }}>
      <header style={{ display: 'grid', gap: '12px' }}>
        <p style={{ margin: 0 }}>Studio99 Application Core</p>
        <h1 style={{ margin: 0 }}>招待を受ける</h1>
        <p style={{ lineHeight: 1.7, margin: 0 }}>
          ここは招待リンクの着地点です。先に <Link href="/admin">/admin</Link> でログインしてから、
          このページで token を送ると所属 organization に参加できます。
        </p>
      </header>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>やること</h2>
        <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          <li>招待メールのリンクを開く</li>
          <li>
            まだなら <Link href="/admin">/admin</Link> でサインインする
          </li>
          <li>token を確認して「招待を受ける」を押す</li>
        </ol>
      </section>

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          display: 'grid',
          gap: '16px',
          padding: '20px',
        }}
      >
        <InviteAcceptForm initialToken={initialToken} />
      </section>
    </section>
  )
}
