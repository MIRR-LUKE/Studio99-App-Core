import Link from 'next/link'

const collectionLinks = [
  { href: '/admin/collections/users', label: 'users' },
  { href: '/admin/collections/organizations', label: 'organizations' },
  { href: '/admin/collections/memberships', label: 'memberships' },
  { href: '/admin/collections/invites', label: 'invites' },
  { href: '/admin/collections/media', label: 'media' },
  { href: '/admin/collections/feature-flags', label: 'feature-flags' },
  { href: '/admin/collections/billing-customers', label: 'billing-customers' },
  { href: '/admin/collections/billing-subscriptions', label: 'billing-subscriptions' },
  { href: '/admin/collections/billing-events', label: 'billing-events' },
  { href: '/admin/collections/support-notes', label: 'support-notes' },
  { href: '/admin/collections/operational-events', label: 'operational-events' },
  { href: '/admin/collections/backup-snapshots', label: 'backup-snapshots' },
]

const globalLinks = [
  { href: '/admin/globals/app-settings', label: 'app-settings' },
  { href: '/admin/globals/ops-settings', label: 'ops-settings' },
  { href: '/admin/globals/legal-texts', label: 'legal-texts' },
  { href: '/admin/globals/billing-settings', label: 'billing-settings' },
  { href: '/admin/globals/email-templates', label: 'email-templates' },
]

export default function ConsoleDataPage() {
  return (
    <section style={{ display: 'grid', gap: '24px' }}>
      <header style={{ display: 'grid', gap: '12px' }}>
        <p style={{ margin: 0 }}>Data</p>
        <h2 style={{ margin: 0 }}>Payload の生管理画面へ入るための導線</h2>
        <p style={{ lineHeight: 1.7, margin: 0 }}>
          `/console` は表向きの管理画面、`/admin` は生の CRUD 画面です。細かいデータ編集や globals の更新はここから
          `/admin` へ入ります。
        </p>
      </header>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>collections</h3>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          {collectionLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ display: 'grid', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>globals</h3>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          {globalLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
