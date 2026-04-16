import { BootstrapOwnerForm } from './bootstrap-owner-form'

import { isOwnerBootstrapEnabled } from '@/core/ops/bootstrapOwner'

export const dynamic = 'force-dynamic'

export default function BootstrapOwnerPage() {
  const isEnabled = isOwnerBootstrapEnabled()

  return (
    <main style={{ margin: '0 auto', maxWidth: '720px', padding: '56px 24px 80px' }}>
      <p style={{ margin: '0 0 12px' }}>Studio99 Application Core</p>
      <h1 style={{ margin: '0 0 16px' }}>最初の管理者を作る</h1>
      <p style={{ lineHeight: 1.7, margin: '0 0 18px' }}>
        このページは初回だけ使います。`BOOTSTRAP_OWNER_TOKEN` を env に入れたうえで、
        最初の `platform_owner` を作成してください。
      </p>
      <ul style={{ lineHeight: 1.7, margin: '0 0 20px', paddingLeft: '20px' }}>
        <li>1回目の owner 作成にだけ使う</li>
        <li>token が間違っていると作れない</li>
        <li>作成後は `/admin` と `/ops` に進む</li>
      </ul>
      {isEnabled ? (
        <BootstrapOwnerForm />
      ) : (
        <div style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '16px' }}>
          <p style={{ margin: 0 }}>
            `BOOTSTRAP_OWNER_TOKEN` が未設定です。.env.local に token を入れてから開いてください。
          </p>
        </div>
      )}
    </main>
  )
}
