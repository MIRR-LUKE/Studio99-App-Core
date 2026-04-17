import { ConsoleCustomersCollection } from './console-customers'
import { ConsoleEventsCollection } from './console-events'
import { ConsoleWorkspacesCollection } from './console-workspaces'

export { ConsoleCustomersCollection } from './console-customers'
export { ConsoleEventsCollection } from './console-events'
export { ConsoleWorkspacesCollection } from './console-workspaces'

export const consoleProjectCollectionConfigs = [
  ConsoleCustomersCollection,
  ConsoleWorkspacesCollection,
  ConsoleEventsCollection,
]

export const consoleProjectCollectionSummaries = [
  {
    description: 'Studio99 Console の顧客台帳。organization と結びつけて実運用の入口にする。',
    label: 'Customers',
    slug: 'console-customers',
  },
  {
    description: '顧客ごとの workspaces と進行状況をまとめる。',
    label: 'Workspaces',
    slug: 'console-workspaces',
  },
  {
    description: '相談、請求、納品、インシデントを時系列で残す。',
    label: 'Events',
    slug: 'console-events',
  },
] as const
