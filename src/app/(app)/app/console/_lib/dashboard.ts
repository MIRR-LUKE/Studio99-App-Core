import type { PayloadRequest } from 'payload'

import { getCurrentOrganizationState } from '@/core/server/currentOrganization'
import { createAuthenticatedServerComponentRequest } from '@/core/server/serverComponentPayload'
import { createScopedLocalApi } from '@/core/server/localApi'
import { consoleProject, consoleProjectCollectionSummaries } from '@/projects/console'

type ConsoleDashboardCount = {
  collection: string
  count: number
}

const countDocs = async (
  api: ReturnType<typeof createScopedLocalApi>,
  collection: string,
): Promise<ConsoleDashboardCount> => {
  try {
    const result = await api.find({
      collection,
      depth: 0,
      limit: 1,
    })

    return { collection, count: result.totalDocs }
  } catch {
    return { collection, count: 0 }
  }
}

export type ConsoleProjectDashboard = {
  collectionCounts: ConsoleDashboardCount[]
  currentOrganizationName: string
  currentOrganizationStatus: string
  currentOrganizationSummary: string
  membershipsCount: number
  project: typeof consoleProject
  projectCollectionSummaries: typeof consoleProjectCollectionSummaries
  projectRoute: string
  ready: true
} | {
  errorMessage: string
  ready: false
}

export const loadConsoleProjectDashboard = async (): Promise<ConsoleProjectDashboard> => {
  try {
    const { req } = await createAuthenticatedServerComponentRequest('/app/console')

    if (!req.user) {
      return {
        errorMessage: 'サインイン後にもう一度開いてください。',
        ready: false,
      }
    }

    const api = createScopedLocalApi(req)
    const currentOrganizationState = await getCurrentOrganizationState(req)
    const currentOrganization = currentOrganizationState.currentOrganization
    const currentOrganizationName =
      typeof currentOrganization === 'object' && currentOrganization !== null && 'name' in currentOrganization
        ? String((currentOrganization as { name?: unknown }).name ?? '未選択')
        : '未選択'
    const currentOrganizationStatus =
      typeof currentOrganization === 'object' && currentOrganization !== null && 'status' in currentOrganization
        ? String((currentOrganization as { status?: unknown }).status ?? 'unknown')
        : 'unknown'
    const currentOrganizationSummary =
      typeof currentOrganization === 'object' && currentOrganization !== null && 'name' in currentOrganization
        ? `${String((currentOrganization as { name?: unknown }).name ?? 'organization')} / ${currentOrganizationState.currentOrganizationId ?? 'unknown'}`
        : 'まだ current organization がありません。'
    const collectionCounts = await Promise.all(
      consoleProjectCollectionSummaries.map((collection) => countDocs(api, collection.slug)),
    )

    return {
      collectionCounts,
      currentOrganizationName,
      currentOrganizationStatus,
      currentOrganizationSummary,
      membershipsCount: currentOrganizationState.memberships.length,
      project: consoleProject,
      projectCollectionSummaries: consoleProjectCollectionSummaries,
      projectRoute: '/app/console',
      ready: true,
    }
  } catch (error) {
    return {
      errorMessage: error instanceof Error ? error.message : 'console project dashboard の読み込みに失敗しました。',
      ready: false,
    }
  }
}
