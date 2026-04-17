import { listLocalProjects } from '@/core/ops/local-projects'
import { consoleProject, consoleProjectCollectionSummaries } from '@/projects/console'

export type AppStarterProject = Awaited<ReturnType<typeof listLocalProjects>>[number]

export type AppStarterState = {
  consoleProject: typeof consoleProject
  consoleProjectCollections: typeof consoleProjectCollectionSummaries
  localProjects: AppStarterProject[]
  nextActions: string[]
  routeMap: Array<{
    description: string
    href: string
    label: string
  }>
}

export const loadAppStarterState = async (): Promise<AppStarterState> => {
  const localProjects = await listLocalProjects()

  return {
    consoleProject,
    consoleProjectCollections: consoleProjectCollectionSummaries,
    localProjects,
    nextActions: [
      '最初の管理者がまだいなければ /bootstrap/owner で 1 回だけ作る',
      '/console を開いて management / factory / recovery の入口を確認する',
      '/app/console を開いて、実アプリの初期画面からデータを入れ始める',
      '/admin で core collection の中身を確認し、同じデータが見えているか確かめる',
      'project が固まったら /console/factory から 2 本目以降を増やす',
    ],
    routeMap: [
      {
        description: '最初の owner と platform role を作る。',
        href: '/bootstrap/owner',
        label: '/bootstrap/owner',
      },
      {
        description: '表向きの管理画面。project と運用をまとめて見る。',
        href: '/console',
        label: '/console',
      },
      {
        description: 'console project の実画面。ここから最初の project を動かす。',
        href: '/app/console',
        label: '/app/console',
      },
      {
        description: 'core の生データを直接見る裏口。',
        href: '/admin',
        label: '/admin',
      },
      {
        description: 'project 追加の factory。',
        href: '/console/factory',
        label: '/console/factory',
      },
      {
        description: '自分の MFA と recovery code を管理する。',
        href: '/app/security',
        label: '/app/security',
      },
    ],
  }
}
