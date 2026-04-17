import Link from 'next/link'

import {
  consoleCardGridStyle,
  consoleCardStyle,
  consoleHeadingStyle,
  consoleLinkStyle,
  consoleMutedStyle,
  consolePageStyle,
  consoleSectionStyle,
} from '../_lib/console'

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
    <section style={consolePageStyle}>
      <header style={consoleSectionStyle}>
        <p style={{ margin: 0 }}>Data</p>
        <h2 style={consoleHeadingStyle}>何をここから触るかが分かる入口</h2>
        <p style={consoleMutedStyle}>
          `/console/data` は、Payload の生 CRUD に入る前の案内板です。ここでは「どのデータを、どこで、何のために触るか」を先に決めます。
        </p>
      </header>

      <section style={consoleCardGridStyle}>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>core identity</p>
          <strong>users / organizations / memberships / invites</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>billing & ops</p>
          <strong>billing-* / support-notes / operational-events</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>media & recovery</p>
          <strong>media / backup-snapshots</strong>
        </div>
        <div style={consoleCardStyle}>
          <p style={{ margin: '0 0 6px' }}>settings</p>
          <strong>app-settings / ops-settings / legal-texts</strong>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h3 style={consoleHeadingStyle}>ここで触るもの</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>普段の CRUD</strong>
            </p>
            <p style={consoleMutedStyle}>
              users や organizations のような core data は、まず `/admin` で開いて編集します。console はその入口をまとめる役です。
            </p>
          </article>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>設定だけを変えるもの</strong>
            </p>
            <p style={consoleMutedStyle}>
              globals は `app-settings`、`ops-settings`、`legal-texts`、`billing-settings`、`email-templates` の順で触ると迷いにくいです。
            </p>
          </article>
          <article style={consoleCardStyle}>
            <p style={{ margin: '0 0 8px' }}>
              <strong>壊したくないもの</strong>
            </p>
            <p style={consoleMutedStyle}>
              billing / recovery / operational data は、内容確認は `/console`、更新は必要な権限と確認を通してからにします。
            </p>
          </article>
        </div>
      </section>

      <section style={consoleSectionStyle}>
        <h3 style={consoleHeadingStyle}>collections</h3>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          {collectionLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={consoleSectionStyle}>
        <h3 style={consoleHeadingStyle}>globals</h3>
        <p style={consoleMutedStyle}>
          globals は「全体設定」。変える前に、何のための設定かを先に決めると、あとで見返したときに迷いません。
        </p>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '20px' }}>
          {globalLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={consoleSectionStyle}>
        <h3 style={consoleHeadingStyle}>戻り道</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/admin" style={consoleLinkStyle}>
            /admin
          </Link>
          <Link href="/console" style={consoleLinkStyle}>
            /console
          </Link>
          <Link href="/console/media" style={consoleLinkStyle}>
            /console/media
          </Link>
          <Link href="/console/projects" style={consoleLinkStyle}>
            /console/projects
          </Link>
        </div>
      </section>
    </section>
  )
}
