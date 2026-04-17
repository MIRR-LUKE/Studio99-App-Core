export const projectConfig = {
  billing: {
    note: 'Studio99 Console は core billing catalog と entitlement helper を前提に動きます。',
    planKey: 'console-starter',
  },
  collections: ['console-customers', 'console-workspaces', 'console-events'],
  featureFlags: [
  "console-billing-beta",
  "console-team-rollout"
],
  routes: {
    adminCollections: [
      '/admin/collections/console-customers',
      '/admin/collections/console-workspaces',
      '/admin/collections/console-events',
    ],
    api: '/api/console',
    app: '/app/console',
    consoleProject: '/console/projects/console',
  },
  key: 'console',
  name: 'Studio99 Console',
  purpose: 'core の上で最初に実際に回る Studio99 の実アプリ。',
  template: 'saas',
}
